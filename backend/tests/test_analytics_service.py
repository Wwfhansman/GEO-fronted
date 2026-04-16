import sqlite3
from pathlib import Path

from sqlalchemy import inspect

from app.core.config import settings
from app.db.session import get_db, init_db, reset_database_for_tests
from app.models.event_log import EventLog
from app.services.analytics import build_event_payload, track_event


def test_build_event_payload():
    payload = build_event_payload("landing_page_view", {"page": "landing"})
    assert payload["event_name"] == "landing_page_view"


def test_track_event_persists_to_db():
    db = next(get_db())
    event = track_event(db, "test_event", properties={"foo": "bar"}, user_id="u-123", visitor_id="v-123")
    assert event.id is not None
    assert event.event_name == "test_event"
    assert event.user_id == "u-123"
    assert event.visitor_id == "v-123"

    persisted = db.query(EventLog).filter(EventLog.id == event.id).one()
    assert persisted.event_name == "test_event"
    assert '"foo": "bar"' in persisted.properties
    db.close()


def test_track_event_without_user():
    db = next(get_db())
    event = track_event(db, "anonymous_event")
    assert event.user_id is None
    assert event.visitor_id is None
    assert event.properties is None
    db.close()


def test_init_db_backfills_legacy_event_logs_schema():
    reset_database_for_tests()

    db_path = Path(str(settings.database_url).removeprefix("sqlite:///"))
    connection = sqlite3.connect(db_path)
    try:
        connection.execute(
            """
            CREATE TABLE event_logs (
                id VARCHAR PRIMARY KEY,
                event_name VARCHAR NOT NULL,
                user_id VARCHAR,
                properties TEXT,
                created_at DATETIME NOT NULL
            )
            """
        )
        connection.commit()
    finally:
        connection.close()

    init_db()

    db = next(get_db())
    try:
        columns = {column["name"] for column in inspect(db.bind).get_columns("event_logs")}
        assert "visitor_id" in columns
    finally:
        db.close()
