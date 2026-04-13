from fastapi.testclient import TestClient

from app.main import app


def test_contact_leads_route_exists():
    client = TestClient(app)
    response = client.post("/api/leads/contact", json={})
    assert response.status_code in {401, 422}
