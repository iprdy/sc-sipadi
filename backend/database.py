import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import declarative_base, sessionmaker

BASE_DIR = Path(__file__).resolve().parent
ENV_PATH = BASE_DIR / ".env"
load_dotenv(ENV_PATH)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg2://postgres:postgres@localhost:5432/sipadi")
FALLBACK_SQLITE = os.getenv("FALLBACK_SQLITE", "True").lower() in ("true", "1", "yes")


def create_db_engine(url):
    dialect = make_url(url).get_backend_name()
    if dialect == "sqlite":
        return create_engine(
            url,
            connect_args={"check_same_thread": False},
        )

    if dialect == "postgresql":
        return create_engine(
            url,
            pool_pre_ping=True,
            connect_args={"connect_timeout": 3},
        )

    raise ValueError("Only PostgreSQL and SQLite database URLs are supported.")


engine = None
active_dialect = "unknown"

try:
    test_engine = create_db_engine(DATABASE_URL)
    with test_engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    engine = test_engine
    active_dialect = engine.dialect.name
    print(f"[SIPADI DB] Connected: {active_dialect}")
except Exception as exc:
    error_type = type(exc).__name__
    if FALLBACK_SQLITE:
        sqlite_db_path = BASE_DIR / "sipadi.db"
        sqlite_url = f"sqlite:///{sqlite_db_path.as_posix()}"
        engine = create_db_engine(sqlite_url)
        active_dialect = "sqlite"
        print(
            "[SIPADI DB NOTICE] Database connection failed "
            f"({error_type}); using SQLite fallback."
        )
        print(f"[SIPADI DB] Fallback to SQLite: {sqlite_db_path}")
    else:
        raise ConnectionError(
            f"Database connection failed ({error_type}). "
            "Check DATABASE_URL and database availability."
        ) from None

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_active_dialect():
    return active_dialect

