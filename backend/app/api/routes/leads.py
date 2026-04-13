from collections.abc import Mapping
from datetime import datetime, timedelta
from typing import Dict

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import require_jwt_claims
from app.db.session import get_db
from app.models import ContactLead, User
from app.schemas.leads import ContactLeadRequest, ContactLeadResponse

router = APIRouter(prefix="/api/leads", tags=["leads"])

_last_lead_submit_at: Dict[str, datetime] = {}


def _assert_lead_not_rate_limited(user_id: str) -> None:
    now = datetime.utcnow()
    last_submit = _last_lead_submit_at.get(user_id)
    if last_submit and (now - last_submit) < timedelta(hours=24):
        raise HTTPException(status_code=429, detail="Lead submit is limited to once per 24 hours")
    _last_lead_submit_at[user_id] = now


@router.post("/contact", response_model=ContactLeadResponse)
def create_contact_lead(
    payload: ContactLeadRequest,
    claims: Mapping[str, object] = Depends(require_jwt_claims),
    db: Session = Depends(get_db),
):
    auth_id = str(claims.get("sub", "")).strip()
    user = db.query(User).filter(User.supabase_auth_id == auth_id).one_or_none()
    if user is None:
        raise HTTPException(status_code=403, detail="User not registered")

    _assert_lead_not_rate_limited(user.id)

    lead = ContactLead(
        user_id=user.id,
        test_run_id=payload.test_run_id,
        email=user.email,
        phone=user.phone,
        company_name=user.company_name,
    )
    db.add(lead)
    db.commit()

    return ContactLeadResponse(success=True)
