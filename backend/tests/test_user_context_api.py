from fastapi.testclient import TestClient

from app.main import app


def test_user_context_route_exists():
    client = TestClient(app)
    response = client.get("/api/context/me")
    assert response.status_code in {401, 422}
