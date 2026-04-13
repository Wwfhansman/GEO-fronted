from collections.abc import Mapping
from typing import Optional

from fastapi import Depends, Header, HTTPException
from jose import JWTError, jwt

from app.core.config import settings


def require_bearer_token(authorization: Optional[str] = Header(default=None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    return authorization.removeprefix("Bearer ")


def decode_supabase_jwt(token: str) -> Mapping[str, object]:
    try:
        return jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
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
