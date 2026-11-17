import os

os.environ["FALLBACK_SQLITE"] = "False"

from alembic import context
from sqlalchemy.engine import make_url

import backend.models  # noqa: F401
from backend import database


config = context.config
target_metadata = database.Base.metadata

if database.FALLBACK_SQLITE:
    raise RuntimeError(
        "Alembic requires FALLBACK_SQLITE=False; run it in a fresh process."
    )

requested_url = make_url(database.DATABASE_URL)
if requested_url.get_backend_name() not in {"postgresql", "sqlite"}:
    raise RuntimeError(
        "Alembic supports only PostgreSQL or an explicitly configured SQLite URL."
    )

if database.engine.url != requested_url:
    raise RuntimeError(
        "Alembic's active database target does not match DATABASE_URL."
    )


def run_migrations_online():
    with database.engine.connect() as connection:
        is_sqlite = connection.dialect.name == "sqlite"
        original_foreign_keys = None

        try:
            if is_sqlite:
                original_foreign_keys = connection.exec_driver_sql(
                    "PRAGMA foreign_keys"
                ).scalar_one()
                connection.commit()
                if original_foreign_keys:
                    connection.exec_driver_sql("PRAGMA foreign_keys=OFF")
                    connection.commit()

            context.configure(
                connection=connection,
                target_metadata=target_metadata,
                compare_type=True,
                transactional_ddl=is_sqlite,
            )

            with context.begin_transaction():
                context.run_migrations()
                if is_sqlite:
                    violations = connection.exec_driver_sql(
                        "PRAGMA foreign_key_check"
                    ).all()
                    if violations:
                        raise RuntimeError(
                            "SQLite migration produced foreign-key violations."
                        )
        finally:
            if is_sqlite and original_foreign_keys is not None:
                if connection.in_transaction():
                    connection.rollback()
                pragma_value = "ON" if original_foreign_keys else "OFF"
                connection.exec_driver_sql(
                    f"PRAGMA foreign_keys={pragma_value}"
                )
                connection.commit()


run_migrations_online()
