from fastapi.testclient import TestClient

from app.main import app


def test_analytics_track_route_persists_anonymous_event():
    client = TestClient(app)
    response = client.post(
        "/api/analytics/track",
        json={
            "event": "landing_view",
            "visitor_id": "visitor-1",
            "properties": {"page": "landing"},
        },
    )
    assert response.status_code == 200
    assert response.json() == {"success": True}
