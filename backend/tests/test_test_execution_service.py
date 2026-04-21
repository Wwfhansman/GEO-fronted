from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app
from app.services.provider_adapter import OpenAIProviderAdapter, ProviderError
from app.services.result_merger import adjudicate_result


def test_rule_match_wins_without_review():
    result = adjudicate_result(
        rule_matched=True,
        raw_match_count=2,
        llm_review_triggered=False,
        llm_match=None,
        llm_match_count=None,
    )
    assert result["is_mentioned"] is True
    assert result["mentioned_count_for_query"] == 1
    assert result["exposure_count_for_query"] == 2
    assert result["final_match_source"] == "rule"


def _bootstrap_user(client, auth_token, email="test@example.com", sub="test-sub"):
    token = auth_token(email=email, sub=sub)
    resp = client.post(
        "/api/auth/bootstrap",
        headers={"Authorization": f"Bearer {token}"},
        json={"email": email, "phone": "13800000000", "company_name": "TestCo"},
    )
    assert resp.status_code == 200
    return token, resp.json()


def test_execute_test_persists_run_and_updates_metrics(auth_token, mock_provider):
    mock_provider("推荐 TestCo 作为候选公司。")
    client = TestClient(app)
    token, _ = _bootstrap_user(client, auth_token)

    resp = client.post(
        "/api/tests/execute",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "company_name": "TestCo",
            "product_keyword": "测试产品",
            "industry": "IT科技",
            "provider": "ChatGPT",
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["test_run_id"]
    assert data["status"] == "completed"
    assert data["is_mentioned"] is True

    # Verify metrics updated
    ctx = client.get("/api/context/me", headers={"Authorization": f"Bearer {token}"})
    assert ctx.status_code == 200
    ctx_data = ctx.json()
    assert ctx_data["total_query_count"] == 1
    assert ctx_data["free_test_quota_remaining"] == 2


def test_execute_test_rejects_unregistered_user(auth_token, mock_provider):
    mock_provider("推荐 NoCo 作为候选公司。")
    client = TestClient(app)
    token = auth_token(email="unknown@example.com", sub="unknown-sub")
    resp = client.post(
        "/api/tests/execute",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "company_name": "NoCo",
            "product_keyword": "nothing",
            "industry": "IT科技",
            "provider": "ChatGPT",
        },
    )
    assert resp.status_code == 403


def test_execute_test_requires_verified_email(auth_token, mock_provider):
    mock_provider("推荐 VerifyCo 作为候选公司。")
    client = TestClient(app)
    unverified_token = auth_token(
        email="verify@example.com",
        sub="verify-sub",
        email_verified=False,
    )
    resp = client.post(
        "/api/auth/bootstrap",
        headers={"Authorization": f"Bearer {unverified_token}"},
        json={"email": "verify@example.com", "phone": "13800000000", "company_name": "VerifyCo"},
    )
    assert resp.status_code == 200

    resp = client.post(
        "/api/tests/execute",
        headers={"Authorization": f"Bearer {unverified_token}"},
        json={
            "company_name": "VerifyCo",
            "product_keyword": "验证测试",
            "industry": "IT科技",
            "provider": "ChatGPT",
        },
    )
    assert resp.status_code == 403
    assert resp.json()["detail"] == "Email verification required"


def test_execute_test_quota_exhaustion(auth_token, mock_provider):
    mock_provider("推荐 QuotaCo 作为候选公司。")
    client = TestClient(app)
    token, _ = _bootstrap_user(client, auth_token, email="quota@example.com", sub="quota-sub")

    payload = {
        "company_name": "QuotaCo",
        "product_keyword": "配额测试",
        "industry": "电商品牌",
        "provider": "DeepSeek",
    }

    # Use all 3 free tests
    for i in range(3):
        resp = client.post(
            "/api/tests/execute",
            headers={"Authorization": f"Bearer {token}"},
            json=payload,
        )
        assert resp.status_code == 200, f"Test {i+1} failed"

    # 4th should be rejected
    resp = client.post(
        "/api/tests/execute",
        headers={"Authorization": f"Bearer {token}"},
        json=payload,
    )
    assert resp.status_code == 429


def test_execute_test_returns_502_when_provider_fails(auth_token, monkeypatch):
    def fake_generate(self, prompt: str):
        raise ProviderError("boom")

    monkeypatch.setattr(OpenAIProviderAdapter, "generate", fake_generate)

    client = TestClient(app)
    token, _ = _bootstrap_user(client, auth_token, email="fail@example.com", sub="fail-sub")
    resp = client.post(
        "/api/tests/execute",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "company_name": "FailCo",
            "product_keyword": "失败测试",
            "industry": "IT科技",
            "provider": "ChatGPT",
        },
    )
    assert resp.status_code == 502


def test_execute_test_rate_limits_by_user(auth_token, mock_provider, monkeypatch):
    mock_provider("推荐 FastCo 作为候选公司。")
    client = TestClient(app)
    token, _ = _bootstrap_user(client, auth_token, email="fast@example.com", sub="fast-sub")
    monkeypatch.setattr(settings, "test_rate_limit_per_user", 1)
    monkeypatch.setattr(settings, "test_rate_limit_per_ip", 10)
    monkeypatch.setattr(settings, "test_rate_limit_window_seconds", 3600)

    payload = {
        "company_name": "FastCo",
        "product_keyword": "限流测试",
        "industry": "IT科技",
        "provider": "ChatGPT",
    }
    first = client.post(
        "/api/tests/execute",
        headers={"Authorization": f"Bearer {token}"},
        json=payload,
    )
    second = client.post(
        "/api/tests/execute",
        headers={"Authorization": f"Bearer {token}"},
        json=payload,
    )

    assert first.status_code == 200
    assert second.status_code == 429
    assert second.json()["detail"] == "Too many test executions for this account"


def test_execute_test_ignores_spoofed_forwarded_for(auth_token, mock_provider, monkeypatch):
    mock_provider("推荐 SpoofCo 作为候选公司。")
    client = TestClient(app)
    token, _ = _bootstrap_user(client, auth_token, email="spoof@example.com", sub="spoof-sub")
    monkeypatch.setattr(settings, "test_rate_limit_per_user", 10)
    monkeypatch.setattr(settings, "test_rate_limit_per_ip", 1)
    monkeypatch.setattr(settings, "test_rate_limit_window_seconds", 3600)

    payload = {
        "company_name": "SpoofCo",
        "product_keyword": "伪造来源测试",
        "industry": "IT科技",
        "provider": "ChatGPT",
    }
    first = client.post(
        "/api/tests/execute",
        headers={
            "Authorization": f"Bearer {token}",
            "X-Forwarded-For": "1.1.1.1",
        },
        json=payload,
    )
    second = client.post(
        "/api/tests/execute",
        headers={
            "Authorization": f"Bearer {token}",
            "X-Forwarded-For": "8.8.8.8",
        },
        json=payload,
    )

    assert first.status_code == 200
    assert second.status_code == 429
    assert second.json()["detail"] == "Too many test executions from this IP"
