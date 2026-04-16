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
    visitor_id = "visitor-dash"

    # Bootstrap a user
    user_token = auth_token(email="dash-user@example.com", sub="dash-sub")
    client.post(
        "/api/auth/bootstrap",
        headers={"Authorization": f"Bearer {user_token}", "X-Visitor-Id": visitor_id},
        json={"email": "dash-user@example.com", "phone": "123", "company_name": "DashCo"},
    )

    # Run a test
    client.post(
        "/api/tests/execute",
        headers={"Authorization": f"Bearer {user_token}", "X-Visitor-Id": visitor_id},
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
    assert "traffic_summary" in data
    assert "traffic_funnel" in data


def test_dashboard_summary_includes_traffic_funnel(auth_token):
    client = TestClient(app)

    client.post(
        "/api/analytics/track",
        json={"event": "landing_view", "visitor_id": "visitor-1", "properties": {"page": "landing"}},
    )
    client.post(
        "/api/analytics/track",
        json={"event": "landing_primary_cta_click", "visitor_id": "visitor-1", "properties": {"page": "landing"}},
    )
    client.post(
        "/api/analytics/track",
        json={"event": "test_page_view", "visitor_id": "visitor-1", "properties": {"page": "test"}},
    )

    admin_token = auth_token(email="admin@example.com", sub="admin-traffic")
    response = client.get(
        "/api/dashboard/summary",
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["traffic_summary"]["landing_views"] == 1
    assert data["traffic_summary"]["test_page_views"] == 1
    assert data["traffic_summary"]["landing_cta_rate"] == 100.0
    assert data["traffic_diagnosis"]["largest_dropoff"] is not None


def test_dashboard_summary_merges_anonymous_and_authenticated_funnel_steps(auth_token, mock_provider):
    mock_provider("推荐 MergeCo 作为候选公司。")
    client = TestClient(app)
    visitor_id = "visitor-merge"

    client.post(
        "/api/analytics/track",
        json={"event": "register_modal_open", "visitor_id": visitor_id, "properties": {"page": "test"}},
    )

    user_token = auth_token(email="merge-user@example.com", sub="merge-sub")
    client.post(
        "/api/auth/bootstrap",
        headers={"Authorization": f"Bearer {user_token}", "X-Visitor-Id": visitor_id},
        json={"email": "merge-user@example.com", "phone": "123", "company_name": "MergeCo"},
    )
    client.post(
        "/api/tests/execute",
        headers={"Authorization": f"Bearer {user_token}", "X-Visitor-Id": visitor_id},
        json={
            "company_name": "MergeCo",
            "product_keyword": "检测",
            "industry": "IT科技",
            "provider": "ChatGPT",
        },
    )

    admin_token = auth_token(email="admin@example.com", sub="admin-merge")
    response = client.get(
        "/api/dashboard/summary",
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    assert response.status_code == 200
    steps = {step["event_name"]: step for step in response.json()["traffic_funnel"]}
    assert steps["register_modal_open"]["count"] == 1
    assert steps["user_registered"]["count"] == 1
    assert steps["test_executed"]["count"] == 1
    assert steps["user_registered"]["conversion_from_previous"] == 100.0


def test_dashboard_summary_uses_null_conversions_when_previous_steps_are_missing(auth_token):
    client = TestClient(app)
    user_token = auth_token(email="partial@example.com", sub="partial-sub")

    client.post(
        "/api/auth/bootstrap",
        headers={"Authorization": f"Bearer {user_token}"},
        json={"email": "partial@example.com", "phone": "123", "company_name": "PartialCo"},
    )

    admin_token = auth_token(email="admin@example.com", sub="admin-partial")
    response = client.get(
        "/api/dashboard/summary",
        headers={"Authorization": f"Bearer {admin_token}"},
    )

    assert response.status_code == 200
    steps = {step["event_name"]: step for step in response.json()["traffic_funnel"]}
    assert steps["landing_view"]["conversion_from_previous"] is None
    assert steps["landing_view"]["conversion_from_start"] is None
    assert steps["user_registered"]["count"] == 1
    assert steps["user_registered"]["conversion_from_previous"] is None
    assert steps["user_registered"]["conversion_from_start"] is None
