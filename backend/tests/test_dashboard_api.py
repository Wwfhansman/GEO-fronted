from fastapi.testclient import TestClient

from app.main import app


def test_dashboard_summary_route_exists():
    client = TestClient(app)
    response = client.get("/api/dashboard/summary")
    assert response.status_code in {401, 422}
