from datetime import datetime, timedelta
from typing import Dict

from fastapi import APIRouter, Depends, HTTPException

from app.core.security import require_bearer_token
from app.schemas.leads import ContactLeadRequest, ContactLeadResponse

router = APIRouter(prefix="/api/leads", tags=["leads"])

_last_lead_submit_at: Dict[str, datetime] = {}


def _assert_lead_not_rate_limited(token: str) -> None:
    now = datetime.utcnow()
    last_submit = _last_lead_submit_at.get(token)
    if last_submit and (now - last_submit) < timedelta(hours=24):
        raise HTTPException(status_code=429, detail="Lead submit is limited to once per 24 hours")
    _last_lead_submit_at[token] = now


@router.post("/contact", response_model=ContactLeadResponse)
def create_contact_lead(
    payload: ContactLeadRequest,
    token: str = Depends(require_bearer_token),
):
    _assert_lead_not_rate_limited(token)
    _ = payload
    return ContactLeadResponse(success=True)
