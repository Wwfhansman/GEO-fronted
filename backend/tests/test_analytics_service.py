from app.services.analytics import build_event_payload


def test_build_event_payload():
    payload = build_event_payload("landing_page_view", {"page": "landing"})
    assert payload["event_name"] == "landing_page_view"
