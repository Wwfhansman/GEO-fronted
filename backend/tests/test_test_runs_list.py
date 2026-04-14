from fastapi.testclient import TestClient

from app.main import app


def _bootstrap_and_run(client, auth_token, mock_provider):
    mock_provider("推荐 HistCo 作为候选公司。")
    token = auth_token(email="hist@example.com", sub="hist-sub")
    client.post(
        "/api/auth/bootstrap",
        headers={"Authorization": f"Bearer {token}"},
        json={"email": "hist@example.com", "phone": "123", "company_name": "HistCo"},
    )
    client.post(
        "/api/tests/execute",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "company_name": "HistCo",
            "product_keyword": "历史测试",
            "industry": "IT科技",
            "provider": "ChatGPT",
        },
    )
    return token


def test_list_runs_returns_user_history(auth_token, mock_provider):
    client = TestClient(app)
    token = _bootstrap_and_run(client, auth_token, mock_provider)

    resp = client.get("/api/tests/runs", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["input_company_name"] == "HistCo"


def test_list_runs_empty_for_new_user(auth_token):
    client = TestClient(app)
    token = auth_token(email="empty@example.com", sub="empty-sub")
    client.post(
        "/api/auth/bootstrap",
        headers={"Authorization": f"Bearer {token}"},
        json={"email": "empty@example.com", "phone": "000", "company_name": "EmptyCo"},
    )
    resp = client.get("/api/tests/runs", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json() == []
