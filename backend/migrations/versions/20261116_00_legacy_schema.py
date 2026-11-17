"""Create the pre-refactor SI-PADI schema on an empty database.

Revision ID: 20261116_00
Revises:
Create Date: 2026-11-16

Existing databases must be verified and stamped at this baseline before
applying the following schema upgrade.
"""
from alembic import op
import sqlalchemy as sa


revision = "20261116_00"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    existing_tables = set(sa.inspect(bind).get_table_names())
    application_tables = existing_tables - {"alembic_version"}
    if application_tables:
        raise RuntimeError(
            "The SI-PADI baseline can only initialize an empty database. "
            "For an existing database, verify its legacy schema and stamp "
            "this baseline before upgrading."
        )

    op.create_table(
        "users",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("email", sa.String(length=120), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=20), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "training_runs",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("filename", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.String(length=50), nullable=False),
        sa.Column("rows_count", sa.Integer(), nullable=False),
        sa.Column("features", sa.Text(), nullable=False),
        sa.Column("target_column", sa.String(length=100), nullable=False),
        sa.Column("best_model", sa.String(length=50), nullable=False),
        sa.Column("metrics", sa.Text(), nullable=False),
        sa.Column("shap_data", sa.Text(), nullable=False),
        sa.Column("ale_data", sa.Text(), nullable=False),
        sa.Column("model_path", sa.String(length=500), nullable=False),
        sa.Column("uploaded_by", sa.String(length=120), nullable=True),
    )

    op.create_table(
        "dataset_records",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("run_id", sa.String(length=64), nullable=False),
        sa.Column("kabupaten", sa.String(length=100), nullable=False),
        sa.Column("tahun", sa.Integer(), nullable=False),
        sa.Column("bulan", sa.Float(), nullable=True),
        sa.Column("ndvi", sa.Float(), nullable=False),
        sa.Column("lst", sa.Float(), nullable=False),
        sa.Column("rainfall", sa.Float(), nullable=False),
        sa.Column("produktivitas", sa.Float(), nullable=False),
        sa.ForeignKeyConstraint(
            ["run_id"],
            ["training_runs.id"],
            ondelete="CASCADE",
        ),
    )
    op.create_index("ix_dataset_records_run_id", "dataset_records", ["run_id"])
    op.create_index(
        "ix_dataset_records_kabupaten",
        "dataset_records",
        ["kabupaten"],
    )
    op.create_index("ix_dataset_records_tahun", "dataset_records", ["tahun"])


def downgrade():
    bind = op.get_bind()
    for table_name in ("users", "training_runs", "dataset_records"):
        table = sa.Table(table_name, sa.MetaData(), autoload_with=bind)
        if bind.execute(
            sa.select(sa.literal(1)).select_from(table).limit(1)
        ).first():
            raise RuntimeError(
                "Refusing to remove the SI-PADI baseline while table "
                f"{table_name} contains data."
            )

    op.drop_table("dataset_records")
    op.drop_table("training_runs")
    op.drop_table("users")
