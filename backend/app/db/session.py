from __future__ import annotations

from pathlib import Path
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings


class Base(DeclarativeBase):
    pass


_engine = None
_session_factory = None


def _sqlite_connect_args(database_url: str) -> dict[str, bool]:
    if database_url.startswith("sqlite"):
        return {"check_same_thread": False}
    return {}


def get_engine():
    global _engine
    if _engine is None:
        _engine = create_engine(
            settings.database_url,
            future=True,
            connect_args=_sqlite_connect_args(settings.database_url),
        )
    return _engine


def get_session_factory():
    global _session_factory
    if _session_factory is None:
        _session_factory = sessionmaker(bind=get_engine(), autoflush=False, autocommit=False)
    return _session_factory


def init_db() -> None:
    from app.models import ContactLead, EventLog, TestRun, User, UserTestMetrics  # noqa: F401

    Base.metadata.create_all(bind=get_engine())


def SessionLocal() -> Session:  # noqa: N802
    """Return a new session for use outside of request scope (e.g. background threads)."""
    init_db()
    return get_session_factory()()


def get_db() -> Generator[Session, None, None]:
    init_db()
    session = get_session_factory()()
    try:
        yield session
    finally:
        session.close()


def reset_database_for_tests() -> None:
    global _engine, _session_factory

    if _engine is not None:
        _engine.dispose()
    _engine = None
    _session_factory = None

    database_url = settings.database_url
    if database_url.startswith("sqlite:///"):
        db_path = Path(database_url.removeprefix("sqlite:///"))
        if db_path.exists():
            db_path.unlink()
