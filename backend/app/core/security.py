from fastapi import Header, HTTPException
from typing import Optional

from app.core.config import settings


def require_bearer_token(authorization: Optional[str] = Header(default=None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    return authorization.removeprefix("Bearer ")


def require_admin_token(authorization: Optional[str] = Header(default=None)) -> str:
    token = require_bearer_token(authorization)
    admin_whitelist = {
        email.strip() for email in settings.admin_email_whitelist.split(",") if email.strip()
    }
    # Placeholder until JWT parsing + user-email resolution is implemented.
    # This forces a strict default-deny behavior.
    if not admin_whitelist:
        raise HTTPException(status_code=403, detail="Forbidden")
    raise HTTPException(status_code=403, detail="Forbidden")
    return token
