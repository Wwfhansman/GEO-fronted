from fastapi.testclient import TestClient

from app.main import app


def test_user_context_route_exists():
    client = TestClient(app)
    response = client.get("/api/context/me")
    assert response.status_code in {401, 422}


def test_user_context_returns_unregistered_defaults(auth_token):
    client = TestClient(app)
    response = client.get(
        "/api/context/me",
        headers={"Authorization": f"Bearer {auth_token(email='new@example.com', sub='new-auth')}"},
    )
    assert response.status_code == 200
    assert response.json()["is_registered"] is False
    assert response.json()["free_test_quota_remaining"] == 3


def test_user_context_returns_registered_metrics_after_bootstrap(auth_token):
    client = TestClient(app)
    token = auth_token(email="member@example.com", sub="auth-ctx")
    bootstrap = client.post(
        "/api/auth/bootstrap",
        headers={"Authorization": f"Bearer {token}"},
        json={"email": "ignored@example.com", "phone": "123", "company_name": "Context Co"},
    )
    assert bootstrap.status_code == 200

    response = client.get("/api/context/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["is_registered"] is True
    assert response.json()["total_query_count"] == 0
    assert response.json()["overall_evaluation_text"] == "您尚未开始测试，先查看您的AI曝光情况。"
