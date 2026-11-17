# SI-PADI database initialization

Alembic is the only supported schema management path. The FastAPI application
does not create or migrate tables at startup.

Run commands from the repository root. Set `DATABASE_URL` to the intended
database explicitly. Alembic disables SQLite fallback; a connection failure
stops the migration.

## Back up first

Stop the API before migration. For PostgreSQL, create a custom-format backup:

```powershell
$backup = "backend\backups\sipadi-$(Get-Date -Format yyyyMMdd-HHmmss).dump"
New-Item -ItemType Directory -Force (Split-Path $backup) | Out-Null
pg_dump --format=custom --file $backup --dbname $env:DATABASE_URL
```

For SQLite, copy the database file while the application is stopped:

```powershell
$backup = "backend\backups\sipadi-$(Get-Date -Format yyyyMMdd-HHmmss).db"
New-Item -ItemType Directory -Force (Split-Path $backup) | Out-Null
Copy-Item backend\sipadi.db $backup
```

## Empty database

For a genuinely empty PostgreSQL or SQLite database, run:

```powershell
$env:FALLBACK_SQLITE = "False"
python -m alembic -c backend/alembic.ini upgrade head
```

The `20261116_00` baseline creates the pre-refactor schema only when no
application tables exist. `20261116_01` then upgrades it to the current
`models.py` structure. If any application table already exists, baseline
creation stops rather than overwriting it.

For SQLite, set an explicit URL first, for example:

```powershell
$env:DATABASE_URL = "sqlite:///backend/sipadi.db"
```

For PostgreSQL, configure `DATABASE_URL` in `backend\.env` (or in the
environment) to the intended PostgreSQL database.

## Existing legacy database

Back up the database first and stop the application while changing its schema.
Configure its exact PostgreSQL or SQLite URL and disable fallback:

```powershell
$env:FALLBACK_SQLITE = "False"
python -m backend.migrations.verify_legacy
```

Proceed only if the verifier reports success. It is read-only and checks the
legacy tables, columns, primary/foreign keys, and required legacy indexes. It
rejects an existing Alembic version table or a partially upgraded schema.
Then mark only the verified baseline and apply the upgrade:

```powershell
python -m alembic -c backend/alembic.ini stamp 20261116_00
python -m alembic -c backend/alembic.ini upgrade head
```

Do not stamp `head` to skip schema changes. If verification fails, stop and
inspect the schema manually; do not stamp that database.

The upgrade stops if legacy monthly keys contain NULL months, duplicate
period keys, or `best_model` values longer than the target column allows.
Resolve any reported data issue without deleting historical records, then
rerun the upgrade.

After migration, application startup checks the model tables, columns, and
nullability required by the current models. It fails with a schema error
instead of creating tables automatically.
