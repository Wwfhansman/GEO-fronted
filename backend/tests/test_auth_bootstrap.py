from fastapi.testclient import TestClient

from app.core.config import settings
from app.db.session import get_db
from app.main import app
from app.models import User


def test_bootstrap_user_route_exists():
    client = TestClient(app)
    response = client.post("/api/auth/bootstrap", json={})
    assert response.status_code in {401, 422}


def test_bootstrap_user_persists_user_from_jwt_claims(auth_token):
    client = TestClient(app)
    response = client.post(
        "/api/auth/bootstrap",
        headers={"Authorization": f"Bearer {auth_token(email='founder@example.com', sub='auth-1')}"},
        json={
            "email": "ignored@example.com",
            "phone": "13800000000",
            "company_name": "Acme",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["user_id"]
    assert data["email"] == "founder@example.com"
    assert data["phone"] == "13800000000"
    assert data["company_name"] == "Acme"


def test_bootstrap_user_updates_existing_user_by_auth_id(auth_token):
    client = TestClient(app)
    token = auth_token(email="founder@example.com", sub="auth-1", email_verified=True)
    first = client.post(
        "/api/auth/bootstrap",
        headers={"Authorization": f"Bearer {token}"},
        json={"email": "ignored@example.com", "phone": "111", "company_name": "Old Co"},
    )
    second = client.post(
        "/api/auth/bootstrap",
        headers={"Authorization": f"Bearer {token}"},
        json={"email": "ignored@example.com", "phone": "222", "company_name": "New Co"},
    )

    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["user_id"] == second.json()["user_id"]
    assert second.json()["phone"] == "222"
    assert second.json()["company_name"] == "New Co"


def test_bootstrap_user_does_not_downgrade_email_verified(auth_token):
    client = TestClient(app)
    verified_token = auth_token(email="verified@example.com", sub="auth-v", email_verified=True)
    initial = client.post(
        "/api/auth/bootstrap",
        headers={"Authorization": f"Bearer {verified_token}"},
        json={"email": "ignored@example.com", "phone": "111", "company_name": "Verified Co"},
    )
    stale_token = auth_token(email="verified@example.com", sub="auth-v", email_verified=False)
    second = client.post(
        "/api/auth/bootstrap",
        headers={"Authorization": f"Bearer {stale_token}"},
        json={"email": "ignored@example.com", "phone": "222", "company_name": "Verified Co"},
    )

    assert initial.status_code == 200
    assert second.status_code == 200
    assert second.json()["email"] == "verified@example.com"

    db = next(get_db())
    try:
        user = db.query(User).filter(User.email == "verified@example.com").one()
        assert user.email_verified is True
    finally:
        db.close()


def test_bootstrap_user_rejects_invalid_jwt():
    client = TestClient(app)
    response = client.post(
        "/api/auth/bootstrap",
        headers={"Authorization": "Bearer not-a-jwt"},
        json={"email": "x@example.com", "phone": "123", "company_name": "Bad"},
    )
    assert response.status_code == 401


def test_bootstrap_user_accepts_asymmetric_jwt_via_jwks(monkeypatch):
    from app.core import security

    client = TestClient(app)

    def fake_fetch_jwks():
        return {"keys": [{"kid": "test-key", "alg": "RS256", "kty": "RSA"}]}

    def fake_decode(token, key, algorithms, options):
        assert key == {"keys": [{"kid": "test-key", "alg": "RS256", "kty": "RSA"}]}
        assert algorithms == ["RS256"]
        return {"sub": "auth-rs", "email": "rsa@example.com", "email_verified": True}

    monkeypatch.setattr(security.jwt, "get_unverified_header", lambda token: {"alg": "RS256", "kid": "test-key"})
    monkeypatch.setattr(security, "_fetch_jwks", fake_fetch_jwks)
    monkeypatch.setattr(security.jwt, "decode", fake_decode)

    response = client.post(
        "/api/auth/bootstrap",
        headers={"Authorization": "Bearer rsa-token"},
        json={
            "email": "ignored@example.com",
            "phone": "13800000000",
            "company_name": "Asymmetric Co",
        },
    )

    assert response.status_code == 200
    assert response.json()["email"] == "rsa@example.com"


def test_bootstrap_user_requires_turnstile_when_enabled(auth_token, monkeypatch):
    client = TestClient(app)
    monkeypatch.setattr(settings, "turnstile_secret_key", "turnstile-secret")
    monkeypatch.setattr("app.api.routes.auth.verify_turnstile_token", lambda token, remote_ip: False)

    response = client.post(
        "/api/auth/bootstrap",
        headers={"Authorization": f"Bearer {auth_token(email='guard@example.com', sub='guard-1')}"},
        json={
            "email": "ignored@example.com",
            "phone": "13800000000",
            "company_name": "Acme",
        },
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "Turnstile verification failed"


def test_bootstrap_user_rate_limits_by_ip(auth_token, monkeypatch):
    client = TestClient(app)
    monkeypatch.setattr(settings, "bootstrap_rate_limit_per_ip", 1)
    monkeypatch.setattr(settings, "bootstrap_rate_limit_window_seconds", 3600)

    first = client.post(
        "/api/auth/bootstrap",
        headers={"Authorization": f"Bearer {auth_token(email='first@example.com', sub='first-1')}"},
        json={
            "email": "ignored@example.com",
            "phone": "13800000000",
            "company_name": "First Co",
        },
    )
    second = client.post(
        "/api/auth/bootstrap",
        headers={"Authorization": f"Bearer {auth_token(email='second@example.com', sub='second-1')}"},
        json={
            "email": "ignored@example.com",
            "phone": "13800000001",
            "company_name": "Second Co",
        },
    )

    assert first.status_code == 200
    assert second.status_code == 429
    assert second.json()["detail"] == "Too many bootstrap attempts"


def test_bootstrap_user_ignores_spoofed_forwarded_for(auth_token, monkeypatch):
    client = TestClient(app)
    monkeypatch.setattr(settings, "bootstrap_rate_limit_per_ip", 1)
    monkeypatch.setattr(settings, "bootstrap_rate_limit_window_seconds", 3600)

    first = client.post(
        "/api/auth/bootstrap",
        headers={
            "Authorization": f"Bearer {auth_token(email='spoof1@example.com', sub='spoof-1')}",
            "X-Forwarded-For": "1.1.1.1",
        },
        json={
            "email": "ignored@example.com",
            "phone": "13800000000",
            "company_name": "First Co",
        },
    )
    second = client.post(
        "/api/auth/bootstrap",
        headers={
            "Authorization": f"Bearer {auth_token(email='spoof2@example.com', sub='spoof-2')}",
            "X-Forwarded-For": "8.8.8.8",
        },
        json={
            "email": "ignored@example.com",
            "phone": "13800000001",
            "company_name": "Second Co",
        },
    )

    assert first.status_code == 200
    assert second.status_code == 429
