"""Explicitly provision the first administrator after database migrations."""

import getpass
import os
import re
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy.engine import make_url
from sqlalchemy.exc import IntegrityError, SQLAlchemyError


BASE_DIR = Path(__file__).resolve().parent


def _get_database_session_factory():
    load_dotenv(BASE_DIR / ".env")
    configured_url = os.getenv("DATABASE_URL", "").strip()
    if not configured_url:
        raise RuntimeError(
            "Set DATABASE_URL explicitly in the environment or backend/.env."
        )

    os.environ["FALLBACK_SQLITE"] = "False"
    from backend.database import DATABASE_URL, SessionLocal, engine

    configured_dialect = make_url(DATABASE_URL).get_backend_name()
    if engine.dialect.name != configured_dialect:
        raise RuntimeError(
            "Connected database does not match the explicitly configured target."
        )
    return SessionLocal


def provision_first_admin(name: str, email: str, password: str) -> str:
    clean_name = name.strip()
    clean_email = email.strip().lower()
    if not clean_name or len(clean_name) > 100:
        raise ValueError("Name must contain 1 to 100 characters.")
    if len(clean_email) > 120 or not re.fullmatch(
        r"[^@\s]+@[^@\s]+\.[^@\s]+", clean_email
    ):
        raise ValueError("Enter a valid email address of at most 120 characters.")
    if len(password) < 14:
        raise ValueError("Password must contain at least 14 characters.")
    if len(password.encode("utf-8")) > 72:
        raise ValueError("Password must not exceed 72 UTF-8 bytes.")

    session_factory = _get_database_session_factory()
    from backend.auth import get_password_hash
    from backend.models import User

    with session_factory() as db:
        try:
            if db.query(User.id).filter(User.role == "admin").first():
                raise RuntimeError(
                    "An administrator already exists; first-admin provisioning is disabled."
                )
            if db.query(User.id).filter(User.email == clean_email).first():
                raise RuntimeError("That email address is already registered.")

            user = User(
                name=clean_name,
                email=clean_email,
                hashed_password=get_password_hash(password),
                role="admin",
            )
            db.add(user)
            db.commit()
            return user.email
        except IntegrityError:
            db.rollback()
            raise RuntimeError(
                "Administrator provisioning conflicted with an existing user."
            ) from None
        except SQLAlchemyError as exc:
            db.rollback()
            raise RuntimeError(
                f"Database provisioning failed ({type(exc).__name__}); "
                "verify the target database and applied schema."
            ) from None


def main() -> None:
    name = input("Administrator name: ")
    email = input("Administrator email: ")
    password = getpass.getpass("Administrator password (minimum 14 characters): ")
    confirmation = getpass.getpass("Confirm password: ")
    if password != confirmation:
        raise SystemExit("Passwords do not match.")

    try:
        created_email = provision_first_admin(name, email, password)
    except (RuntimeError, ValueError) as exc:
        raise SystemExit(str(exc)) from None
    print(f"Administrator provisioned: {created_email}")


if __name__ == "__main__":
    main()
