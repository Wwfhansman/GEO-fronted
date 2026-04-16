from __future__ import annotations

from pathlib import Path
from threading import Lock
from typing import Generator

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings


class Base(DeclarativeBase):
    pass


_engine = None
_session_factory = None
_db_initialized = False
_db_init_lock = Lock()


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


def _ensure_event_logs_schema() -> None:
    engine = get_engine()
    inspector = inspect(engine)

    if "event_logs" not in inspector.get_table_names():
        return

    column_names = {column["name"] for column in inspector.get_columns("event_logs")}
    if "visitor_id" in column_names:
        return

    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE event_logs ADD COLUMN visitor_id VARCHAR"))


def init_db() -> None:
    global _db_initialized
    if _db_initialized:
        return

    from app.models import ContactLead, EventLog, TestRun, User, UserTestMetrics  # noqa: F401

    with _db_init_lock:
        if _db_initialized:
            return
        Base.metadata.create_all(bind=get_engine())
        _ensure_event_logs_schema()
        _db_initialized = True


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
    global _engine, _session_factory, _db_initialized

    if _engine is not None:
        _engine.dispose()
    _engine = None
    _session_factory = None
    _db_initialized = False

    database_url = settings.database_url
    if database_url.startswith("sqlite:///"):
        db_path = Path(database_url.removeprefix("sqlite:///"))
        if db_path.exists():
            db_path.unlink()
