from fastapi.testclient import TestClient

from app.main import app


def test_dashboard_summary_route_exists():
    client = TestClient(app)
    response = client.get("/api/dashboard/summary")
    assert response.status_code in {401, 422}


def test_dashboard_summary_requires_admin_whitelist(auth_token):
    client = TestClient(app)
    response = client.get(
        "/api/dashboard/summary",
        headers={"Authorization": f"Bearer {auth_token(email='user@example.com', sub='auth-2')}"},
    )
    assert response.status_code == 403


def test_dashboard_summary_accepts_admin_jwt(auth_token):
    client = TestClient(app)
    response = client.get(
        "/api/dashboard/summary",
        headers={"Authorization": f"Bearer {auth_token(email='admin@example.com', sub='admin-1')}"},
    )
    assert response.status_code == 200
    assert response.json()["user_count"] == 0
    assert "funnel" in response.json()


def test_dashboard_summary_reflects_real_data(auth_token, mock_provider):
    mock_provider("推荐 DashCo 作为候选公司。")
    client = TestClient(app)

    # Bootstrap a user
    user_token = auth_token(email="dash-user@example.com", sub="dash-sub")
    client.post(
        "/api/auth/bootstrap",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"email": "dash-user@example.com", "phone": "123", "company_name": "DashCo"},
    )

    # Run a test
    client.post(
        "/api/tests/execute",
        headers={"Authorization": f"Bearer {user_token}"},
        json={
            "company_name": "DashCo",
            "product_keyword": "仪表盘",
            "industry": "IT科技",
            "provider": "ChatGPT",
        },
    )

    # Check dashboard as admin
    admin_token = auth_token(email="admin@example.com", sub="admin-dash")
    response = client.get(
        "/api/dashboard/summary",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["user_count"] == 1
    assert data["test_count"] == 1
    assert data["funnel"]["registered"] == 1
    assert data["funnel"]["tested"] == 1
