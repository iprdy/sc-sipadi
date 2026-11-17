import os

os.environ["FALLBACK_SQLITE"] = "False"

from sqlalchemy import inspect
from sqlalchemy.engine import make_url

from backend import database


LEGACY_COLUMNS = {
    "users": {
        "id",
        "name",
        "email",
        "hashed_password",
        "role",
        "created_at",
    },
    "training_runs": {
        "id",
        "filename",
        "created_at",
        "rows_count",
        "features",
        "target_column",
        "best_model",
        "metrics",
        "shap_data",
        "ale_data",
        "model_path",
        "uploaded_by",
    },
    "dataset_records": {
        "id",
        "run_id",
        "kabupaten",
        "tahun",
        "bulan",
        "ndvi",
        "lst",
        "rainfall",
        "produktivitas",
    },
}

MIGRATION_COLUMNS = {
    "training_runs": {
        "supervised_rows",
        "model_params",
        "validation_scheme",
        "temporal_validation_metrics",
        "final_test_metrics",
        "metadata_json",
    },
    "dataset_records": {"luas_panen_ha", "produksi_ton", "status_lst"},
}

LEGACY_NULLABILITY = {
    "users": {
        "id": False,
        "name": False,
        "email": False,
        "hashed_password": False,
        "role": False,
        "created_at": True,
    },
    "training_runs": {
        "id": False,
        "filename": False,
        "created_at": False,
        "rows_count": False,
        "features": False,
        "target_column": False,
        "best_model": False,
        "metrics": False,
        "shap_data": False,
        "ale_data": False,
        "model_path": False,
        "uploaded_by": True,
    },
    "dataset_records": {
        "id": False,
        "run_id": False,
        "kabupaten": False,
        "tahun": False,
        "bulan": True,
        "ndvi": False,
        "lst": False,
        "rainfall": False,
        "produktivitas": False,
    },
}


def verify_legacy_schema(engine=None):
    if engine is None:
        engine = database.engine
    if database.FALLBACK_SQLITE:
        raise RuntimeError(
            "Legacy verification requires FALLBACK_SQLITE=False in a fresh process."
        )
    if engine.url != make_url(database.DATABASE_URL):
        raise RuntimeError(
            "Legacy verification target does not match DATABASE_URL."
        )

    inspector = inspect(engine)
    tables = set(inspector.get_table_names())
    problems = []

    if "alembic_version" in tables:
        problems.append(
            "alembic_version already exists; inspect its current revision instead of stamping"
        )

    for table_name, expected_columns in LEGACY_COLUMNS.items():
        if table_name not in tables:
            problems.append(f"missing table {table_name}")
            continue

        columns = {
            column["name"]: column
            for column in inspector.get_columns(table_name)
        }
        missing = expected_columns - columns.keys()
        extra = columns.keys() - expected_columns
        if missing:
            problems.append(f"{table_name} missing columns {sorted(missing)}")
        if extra:
            problems.append(f"{table_name} has unexpected columns {sorted(extra)}")
        for column_name, nullable in LEGACY_NULLABILITY[table_name].items():
            column = columns.get(column_name)
            if column is not None and column["nullable"] != nullable:
                expected = "NULL" if nullable else "NOT NULL"
                problems.append(
                    f"{table_name}.{column_name} must be {expected}"
                )

    for table_name, column_names in MIGRATION_COLUMNS.items():
        if table_name in tables:
            present = column_names & {
                column["name"] for column in inspector.get_columns(table_name)
            }
            if present:
                problems.append(
                    f"{table_name} already has migration columns {sorted(present)}"
                )

    if "dataset_records" in tables:
        record_columns = {
            column["name"]: column
            for column in inspector.get_columns("dataset_records")
        }
        if "bulan" in record_columns and not record_columns["bulan"]["nullable"]:
            problems.append("legacy dataset_records.bulan is expected to allow NULL")
        if (
            "produktivitas" in record_columns
            and record_columns["produktivitas"]["nullable"]
        ):
            problems.append(
                "legacy dataset_records.produktivitas is expected to be NOT NULL"
            )
        primary_key = inspector.get_pk_constraint("dataset_records").get(
            "constrained_columns"
        )
        if primary_key != ["id"]:
            problems.append("dataset_records primary key must be id")
        foreign_keys = inspector.get_foreign_keys("dataset_records")
        if not any(
            fk.get("constrained_columns") == ["run_id"]
            and fk.get("referred_table") == "training_runs"
            and fk.get("referred_columns") == ["id"]
            and (fk.get("options") or {}).get("ondelete") == "CASCADE"
            for fk in foreign_keys
        ):
            problems.append(
                "dataset_records.run_id foreign key to training_runs.id "
                "with ON DELETE CASCADE is missing"
            )

    for table_name in ("users", "training_runs"):
        if table_name in tables:
            primary_key = inspector.get_pk_constraint(table_name).get(
                "constrained_columns"
            )
            if primary_key != ["id"]:
                problems.append(f"{table_name} primary key must be id")

    if "users" in tables:
        email_is_unique = any(
            index.get("unique")
            and index.get("column_names") == ["email"]
            for index in inspector.get_indexes("users")
        ) or any(
            constraint.get("column_names") == ["email"]
            for constraint in inspector.get_unique_constraints("users")
        )
        if not email_is_unique:
            problems.append("users.email unique index/constraint is missing")

    if "dataset_records" in tables:
        index_columns = {
            tuple(index.get("column_names") or ())
            for index in inspector.get_indexes("dataset_records")
        }
        for column_name in ("run_id", "kabupaten", "tahun"):
            if (column_name,) not in index_columns:
                problems.append(
                    f"legacy dataset_records index on {column_name} is missing"
                )

    if problems:
        raise RuntimeError(
            "Legacy schema verification failed; do not stamp this database: "
            + "; ".join(problems)
        )

    print(
        "[SIPADI DB] Legacy schema verified for "
        f"{engine.dialect.name}; stamping the baseline is permitted."
    )


if __name__ == "__main__":
    verify_legacy_schema()
