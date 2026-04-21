from collections.abc import Mapping
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy.orm import Session

from app.core.security import require_jwt_claims
from app.db.session import get_db
from app.schemas.auth import BootstrapUserRequest, BootstrapUserResponse
from app.services.analytics import track_event
from app.services.rate_limit import is_rate_limited
from app.services.turnstile import verify_turnstile_token
from app.services.user_service import upsert_bootstrap_user
from app.core.config import settings

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


@router.post("/bootstrap", response_model=BootstrapUserResponse)
def bootstrap_user(
    payload: BootstrapUserRequest,
    request: Request,
    claims: Mapping[str, object] = Depends(require_jwt_claims),
    x_visitor_id: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    client_ip = _client_ip(request)
    if is_rate_limited(
        db,
        f"bootstrap:ip:{client_ip}",
        settings.bootstrap_rate_limit_per_ip,
        settings.bootstrap_rate_limit_window_seconds,
    ):
        raise HTTPException(status_code=429, detail="Too many bootstrap attempts")

    if not verify_turnstile_token(payload.turnstile_token, client_ip):
        raise HTTPException(status_code=403, detail="Turnstile verification failed")

    user = upsert_bootstrap_user(db, claims, payload)
    track_event(
        db,
        "user_registered",
        user_id=user.id,
        visitor_id=x_visitor_id,
        properties={"email": user.email},
    )
    return BootstrapUserResponse(
        user_id=user.id,
        email=user.email,
        phone=user.phone,
        company_name=user.company_name,
    )
