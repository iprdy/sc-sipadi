import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

BASE_DIR = Path(__file__).resolve().parent
ENV_PATH = BASE_DIR / ".env"
load_dotenv(ENV_PATH)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg2://postgres:postgres@localhost:5432/sipadi")
FALLBACK_SQLITE = os.getenv("FALLBACK_SQLITE", "True").lower() in ("true", "1", "yes")

engine = None
active_dialect = "unknown"

try:
    # Attempt connecting to PostgreSQL
    test_engine = create_engine(DATABASE_URL, pool_pre_ping=True, connect_args={"connect_timeout": 3})
    with test_engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    engine = test_engine
    active_dialect = "postgresql"
    print(f"Connected to PostgreSQL successfully: {DATABASE_URL}")
except Exception as e:
    if FALLBACK_SQLITE:
        sqlite_db_path = BASE_DIR / "sipadi.db"
        sqlite_url = f"sqlite:///{sqlite_db_path}"
        print(f"[SIPADI DB NOTICE] PostgreSQL not available ({e}).")
        print(f"[SIPADI DB NOTICE] Falling back to SQLite database at: {sqlite_db_path}")
        engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})
        active_dialect = "sqlite"
    else:
        raise ConnectionError(f"Failed to connect to PostgreSQL: {e}")

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

