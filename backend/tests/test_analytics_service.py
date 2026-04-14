from app.db.session import get_db
from app.models.event_log import EventLog
from app.services.analytics import build_event_payload, track_event


def test_build_event_payload():
    payload = build_event_payload("landing_page_view", {"page": "landing"})
    assert payload["event_name"] == "landing_page_view"


def test_track_event_persists_to_db():
    db = next(get_db())
    event = track_event(db, "test_event", properties={"foo": "bar"}, user_id="u-123")
    assert event.id is not None
    assert event.event_name == "test_event"
    assert event.user_id == "u-123"

    persisted = db.query(EventLog).filter(EventLog.id == event.id).one()
    assert persisted.event_name == "test_event"
    assert '"foo": "bar"' in persisted.properties
    db.close()


def test_track_event_without_user():
    db = next(get_db())
    event = track_event(db, "anonymous_event")
    assert event.user_id is None
    assert event.properties is None
    db.close()
