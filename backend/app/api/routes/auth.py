from collections.abc import Mapping
from typing import Optional

from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session

from app.core.security import require_jwt_claims
from app.db.session import get_db
from app.schemas.auth import BootstrapUserRequest, BootstrapUserResponse
from app.services.analytics import track_event
from app.services.user_service import upsert_bootstrap_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/bootstrap", response_model=BootstrapUserResponse)
def bootstrap_user(
    payload: BootstrapUserRequest,
    claims: Mapping[str, object] = Depends(require_jwt_claims),
    x_visitor_id: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
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
