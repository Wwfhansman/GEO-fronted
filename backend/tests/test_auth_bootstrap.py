from fastapi.testclient import TestClient

from app.main import app


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
