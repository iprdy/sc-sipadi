"""Add master dataset and training evaluation fields.

Revision ID: 20261116_01
Revises: 20261116_00
Create Date: 2026-11-16

This migration upgrades existing SI-PADI tables; it does not create base tables.
"""
from alembic import op
import sqlalchemy as sa


revision = "20261116_01"
down_revision = "20261116_00"
branch_labels = None
depends_on = None


DATASET_ADDED_COLUMNS = (
    "luas_panen_ha",
    "produksi_ton",
    "status_lst",
)
TRAINING_ADDED_COLUMNS = (
    "supervised_rows",
    "model_params",
    "validation_scheme",
    "temporal_validation_metrics",
    "final_test_metrics",
    "metadata_json",
)


def _table_columns(bind, table_name):
    return {
        column["name"]: column
        for column in sa.inspect(bind).get_columns(table_name)
    }


def _validate_upgrade_schema(bind):
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())
    required_tables = {"dataset_records", "training_runs"}
    missing_tables = required_tables - tables
    if missing_tables:
        raise RuntimeError(
            "Migration requires existing SI-PADI tables; missing: "
            + ", ".join(sorted(missing_tables))
        )

    dataset_columns = _table_columns(bind, "dataset_records")
    training_columns = _table_columns(bind, "training_runs")
    if "produktivitas" not in dataset_columns:
        raise RuntimeError(
            "Migration requires dataset_records.produktivitas to exist."
        )

    conflicts = [
        f"dataset_records.{name}"
        for name in DATASET_ADDED_COLUMNS
        if name in dataset_columns
    ] + [
        f"training_runs.{name}"
        for name in TRAINING_ADDED_COLUMNS
        if name in training_columns
    ]
    if conflicts:
        raise RuntimeError(
            "Migration expects the legacy schema; these columns already exist: "
            + ", ".join(conflicts)
        )


def _column_has_null(bind, table_name, column_name):
    table = sa.Table(table_name, sa.MetaData(), autoload_with=bind)
    statement = (
        sa.select(sa.literal(1))
        .select_from(table)
        .where(table.c[column_name].is_(None))
        .limit(1)
    )
    return bind.execute(statement).first() is not None


def _assert_unique_values(bind, table_name, column_names):
    table = sa.Table(table_name, sa.MetaData(), autoload_with=bind)
    columns = [table.c[name] for name in column_names]
    statement = (
        sa.select(*columns)
        .where(sa.and_(*(column.is_not(None) for column in columns)))
        .group_by(*columns)
        .having(sa.func.count() > 1)
        .limit(1)
    )
    if bind.execute(statement).first() is not None:
        raise RuntimeError(
            f"Cannot add the unique key to {table_name}; duplicate "
            f"{', '.join(column_names)} values exist. Resolve duplicates "
            "without deleting historical records, then retry."
        )


def _dataset_integrity_state(bind):
    inspector = sa.inspect(bind)
    unique_columns = ("run_id", "kabupaten", "tahun", "bulan")
    index_columns = ("kabupaten", "tahun")
    constraints = inspector.get_unique_constraints("dataset_records")
    indexes = inspector.get_indexes("dataset_records")

    for constraint in constraints:
        if (
            constraint.get("name") == "uq_dataset_record_run_period"
            and tuple(constraint.get("column_names") or ()) != unique_columns
        ):
            raise RuntimeError(
                "The existing uq_dataset_record_run_period constraint has "
                "unexpected columns."
            )
    for index in indexes:
        if (
            index.get("name") == "ix_dataset_record_region_year"
            and tuple(index.get("column_names") or ()) != index_columns
        ):
            raise RuntimeError(
                "The existing ix_dataset_record_region_year index has "
                "unexpected columns."
            )

    has_unique = any(
        tuple(constraint.get("column_names") or ()) == unique_columns
        for constraint in constraints
    ) or any(
        index.get("unique")
        and tuple(index.get("column_names") or ()) == unique_columns
        for index in indexes
    )
    has_index = any(
        tuple(index.get("column_names") or ()) == index_columns
        for index in indexes
    )

    if not has_unique:
        _assert_unique_values(bind, "dataset_records", unique_columns)

    return not has_unique, not has_index


def _assert_no_values(bind, table_name, column_names):
    table = sa.Table(table_name, sa.MetaData(), autoload_with=bind)
    for column_name in column_names:
        statement = (
            sa.select(sa.literal(1))
            .select_from(table)
            .where(table.c[column_name].is_not(None))
            .limit(1)
        )
        if bind.execute(statement).first() is not None:
            raise RuntimeError(
                f"Downgrade would discard data in {table_name}.{column_name}; "
                "move or clear those values before downgrading."
            )


def _assert_no_null_productivity(bind):
    table = sa.Table("dataset_records", sa.MetaData(), autoload_with=bind)
    statement = (
        sa.select(sa.literal(1))
        .select_from(table)
        .where(table.c.produktivitas.is_(None))
        .limit(1)
    )
    if bind.execute(statement).first() is not None:
        raise RuntimeError(
            "Downgrade cannot restore dataset_records.produktivitas to NOT NULL "
            "while NULL values exist."
        )


def _assert_best_model_max_length(bind, max_length, purpose):
    table = sa.Table("training_runs", sa.MetaData(), autoload_with=bind)
    statement = (
        sa.select(sa.literal(1))
        .select_from(table)
        .where(sa.func.length(table.c.best_model) > max_length)
        .limit(1)
    )
    if bind.execute(statement).first() is not None:
        raise RuntimeError(
            f"{purpose} cannot set training_runs.best_model to "
            f"{max_length} characters while longer values exist."
        )


def upgrade():
    bind = op.get_bind()
    _validate_upgrade_schema(bind)
    dataset_columns = _table_columns(bind, "dataset_records")
    training_columns = _table_columns(bind, "training_runs")
    add_unique_constraint, add_region_index = _dataset_integrity_state(bind)

    if dataset_columns["bulan"]["nullable"] and _column_has_null(
        bind, "dataset_records", "bulan"
    ):
        raise RuntimeError(
            "Cannot make dataset_records.bulan NOT NULL while NULL values "
            "exist. Correct those values without deleting historical records."
        )

    best_model_length = getattr(
        training_columns["best_model"]["type"], "length", None
    )
    if training_columns["best_model"]["nullable"]:
        if _column_has_null(bind, "training_runs", "best_model"):
            raise RuntimeError(
                "Cannot make training_runs.best_model NOT NULL while NULL "
                "values exist."
            )
    if best_model_length != 120:
        _assert_best_model_max_length(bind, 120, "Migration")

    with op.batch_alter_table("dataset_records") as batch_op:
        batch_op.add_column(sa.Column("luas_panen_ha", sa.Float(), nullable=True))
        batch_op.add_column(sa.Column("produksi_ton", sa.Float(), nullable=True))
        batch_op.add_column(sa.Column("status_lst", sa.String(length=100), nullable=True))
        if not dataset_columns["produktivitas"]["nullable"]:
            batch_op.alter_column(
                "produktivitas",
                existing_type=sa.Float(),
                existing_nullable=False,
                nullable=True,
            )
        if dataset_columns["bulan"]["nullable"]:
            batch_op.alter_column(
                "bulan",
                existing_type=sa.Float(),
                existing_nullable=True,
                nullable=False,
            )
        if add_unique_constraint:
            batch_op.create_unique_constraint(
                "uq_dataset_record_run_period",
                ["run_id", "kabupaten", "tahun", "bulan"],
            )
        if add_region_index:
            batch_op.create_index(
                "ix_dataset_record_region_year",
                ["kabupaten", "tahun"],
                unique=False,
            )

    with op.batch_alter_table("training_runs") as batch_op:
        batch_op.add_column(sa.Column("supervised_rows", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("model_params", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("validation_scheme", sa.String(length=200), nullable=True))
        batch_op.add_column(sa.Column("temporal_validation_metrics", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("final_test_metrics", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("metadata_json", sa.Text(), nullable=True))
        if best_model_length != 120:
            batch_op.alter_column(
                "best_model",
                existing_type=training_columns["best_model"]["type"],
                type_=sa.String(length=120),
            )
        if training_columns["best_model"]["nullable"]:
            batch_op.alter_column(
                "best_model",
                existing_type=training_columns["best_model"]["type"],
                existing_nullable=True,
                nullable=False,
            )


def downgrade():
    bind = op.get_bind()
    _assert_no_values(bind, "dataset_records", DATASET_ADDED_COLUMNS)
    _assert_no_values(bind, "training_runs", TRAINING_ADDED_COLUMNS)
    _assert_no_null_productivity(bind)
    _assert_best_model_max_length(bind, 50, "Downgrade")

    with op.batch_alter_table("training_runs") as batch_op:
        for column_name in reversed(TRAINING_ADDED_COLUMNS):
            batch_op.drop_column(column_name)
        batch_op.alter_column(
            "best_model",
            existing_type=sa.String(length=120),
            type_=sa.String(length=50),
        )

    with op.batch_alter_table("dataset_records") as batch_op:
        batch_op.alter_column(
            "produktivitas",
            existing_type=sa.Float(),
            existing_nullable=True,
            nullable=False,
        )
        batch_op.alter_column(
            "bulan",
            existing_type=sa.Float(),
            existing_nullable=False,
            nullable=True,
        )
        for column_name in reversed(DATASET_ADDED_COLUMNS):
            batch_op.drop_column(column_name)
