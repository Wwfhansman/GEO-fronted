from __future__ import annotations

from typing import Optional

import httpx

from app.core.config import settings


def verify_turnstile_token(token: Optional[str], remote_ip: Optional[str] = None) -> bool:
    secret = settings.turnstile_secret_key.strip()
    if not secret:
        return True

    if not token or not token.strip():
        return False

    payload = {
        "secret": secret,
        "response": token.strip(),
    }
    if remote_ip:
        payload["remoteip"] = remote_ip

    try:
        response = httpx.post(settings.turnstile_verify_url, data=payload, timeout=5.0)
        response.raise_for_status()
        data = response.json()
    except Exception:
        return False

    return bool(data.get("success"))
