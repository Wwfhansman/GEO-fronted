from collections.abc import Mapping
from typing import Optional

from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session

from app.core.security import decode_supabase_jwt
from app.db.session import get_db
from app.models import User
from app.schemas.analytics import TrackAnalyticsEventRequest, TrackAnalyticsEventResponse
from app.services.analytics import track_event

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


def _resolve_registered_user_id(
    db: Session,
    authorization: Optional[str],
) -> Optional[str]:
    if not authorization or not authorization.startswith("Bearer "):
        return None

    try:
        claims: Mapping[str, object] = decode_supabase_jwt(authorization.removeprefix("Bearer "))
    except Exception:
        return None

    auth_id = str(claims.get("sub", "")).strip()
    email = str(claims.get("email", "")).strip().lower()
    if not auth_id and not email:
        return None

    user = (
        db.query(User)
        .filter((User.supabase_auth_id == auth_id) | (User.email == email))
        .one_or_none()
    )
    return user.id if user else None


@router.post("/track", response_model=TrackAnalyticsEventResponse)
def track_analytics_event(
    payload: TrackAnalyticsEventRequest,
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    track_event(
        db,
        payload.event,
        properties=payload.properties,
        user_id=_resolve_registered_user_id(db, authorization),
        visitor_id=payload.visitor_id,
    )
    return TrackAnalyticsEventResponse(success=True)
