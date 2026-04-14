from collections.abc import Mapping
from functools import lru_cache
from typing import Any, Optional

import httpx
from fastapi import Depends, Header, HTTPException
from jose import JWTError, jwt

from app.core.config import settings


def require_bearer_token(authorization: Optional[str] = Header(default=None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    return authorization.removeprefix("Bearer ")


@lru_cache(maxsize=1)
def _fetch_jwks() -> dict[str, Any]:
    project_url = settings.supabase_project_url.strip().rstrip("/")
    if not project_url:
        raise HTTPException(status_code=401, detail="Unauthorized")

    jwks_url = f"{project_url}/auth/v1/.well-known/jwks.json"
    try:
        response = httpx.get(jwks_url, timeout=5.0)
        response.raise_for_status()
        payload = response.json()
    except Exception as exc:  # pragma: no cover - network failures are environment-specific
        raise HTTPException(status_code=401, detail="Unauthorized") from exc

    if not isinstance(payload, dict) or not isinstance(payload.get("keys"), list):
        raise HTTPException(status_code=401, detail="Unauthorized")
    return payload


def decode_supabase_jwt(token: str) -> Mapping[str, object]:
    try:
        header = jwt.get_unverified_header(token)
        alg = str(header.get("alg", "")).upper()
        if alg.startswith("HS"):
            return jwt.decode(
                token,
                settings.supabase_jwt_secret,
                algorithms=[alg or "HS256"],
                options={"verify_aud": False},
            )

        return jwt.decode(
            token,
            _fetch_jwks(),
            algorithms=[alg] if alg else ["RS256", "ES256"],
            options={"verify_aud": False},
        )
    except JWTError as exc:
        raise HTTPException(status_code=401, detail="Unauthorized") from exc


def require_jwt_claims(token: str = Depends(require_bearer_token)) -> Mapping[str, object]:
    claims = decode_supabase_jwt(token)
    sub = claims.get("sub")
    email = claims.get("email")
    if not isinstance(sub, str) or not sub.strip():
        raise HTTPException(status_code=401, detail="Unauthorized")
    if not isinstance(email, str) or not email.strip():
        raise HTTPException(status_code=401, detail="Unauthorized")
    return claims


def require_admin_token(claims: Mapping[str, object] = Depends(require_jwt_claims)) -> str:
    admin_whitelist = {
        email.strip().lower() for email in settings.admin_email_whitelist.split(",") if email.strip()
    }
    if not admin_whitelist:
        raise HTTPException(status_code=403, detail="Forbidden")

    email = str(claims["email"]).strip().lower()
    if email not in admin_whitelist:
        raise HTTPException(status_code=403, detail="Forbidden")

    return email
