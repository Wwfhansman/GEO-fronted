from fastapi.testclient import TestClient

from app.main import app


def test_bootstrap_user_route_exists():
    client = TestClient(app)
    response = client.post("/api/auth/bootstrap", json={})
    assert response.status_code in {401, 422}
