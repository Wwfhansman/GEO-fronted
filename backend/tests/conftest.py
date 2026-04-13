import os
from pathlib import Path

import pytest
from jose import jwt

os.environ.setdefault("DATABASE_URL", "sqlite:///./test_geo.db")
os.environ.setdefault("SUPABASE_JWT_SECRET", "test-supabase-secret")
os.environ.setdefault("ADMIN_EMAIL_WHITELIST", "admin@example.com")


@pytest.fixture(autouse=True)
def reset_test_database():
    from app.db.session import init_db, reset_database_for_tests

    reset_database_for_tests()
    init_db()
    yield
    reset_database_for_tests()


@pytest.fixture
def auth_token():
    def _build(email: str = "user@example.com", sub: str = "user-123", **extra_claims):
        claims = {"sub": sub, "email": email, **extra_claims}
        return jwt.encode(claims, os.environ["SUPABASE_JWT_SECRET"], algorithm="HS256")

    return _build


@pytest.fixture
def mock_provider(monkeypatch):
    from app.services.provider_adapter import OpenAIProviderAdapter

    def _apply(response_text: str):
        def fake_generate(self, prompt: str):
            return {
                "provider": "openai-compatible",
                "model_name": self.model_name,
                "response_text": response_text,
                "raw_response": {"choices": [{"message": {"content": response_text}}]},
                "response_latency_ms": 12,
            }

        monkeypatch.setattr(OpenAIProviderAdapter, "generate", fake_generate)

    return _apply


@pytest.fixture(autouse=True)
def cleanup_test_db_file():
    yield
    db_path = Path("test_geo.db")
    if db_path.exists():
        db_path.unlink()
