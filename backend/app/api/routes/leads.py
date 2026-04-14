import json
from collections.abc import Mapping
from datetime import datetime, timedelta
from threading import Thread

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import require_jwt_claims
from app.db.session import get_db
from app.models import ContactLead, User
from app.schemas.leads import ContactLeadRequest, ContactLeadResponse
from app.services.analytics import track_event
from app.services.emailer import send_lead_notification

router = APIRouter(prefix="/api/leads", tags=["leads"])


def _assert_lead_not_rate_limited(db: Session, user_id: str) -> None:
    cutoff = datetime.utcnow() - timedelta(hours=24)
    recent = (
        db.query(ContactLead)
        .filter(ContactLead.user_id == user_id, ContactLead.created_at > cutoff)
        .first()
    )
    if recent is not None:
        raise HTTPException(status_code=429, detail="Lead submit is limited to once per 24 hours")


def _send_and_mark(lead_id: str, db_url: str, **email_kwargs: object) -> None:
    """Send email in background thread, then mark email_sent on the lead."""
    sent = send_lead_notification(**email_kwargs)
    if sent:
        # Open a fresh session for the background thread
        from app.db.session import SessionLocal

        session = SessionLocal()
        try:
            lead = session.query(ContactLead).get(lead_id)
            if lead:
                lead.email_sent = True
                session.commit()
        finally:
            session.close()


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

    _assert_lead_not_rate_limited(db, user.id)

    summary_str = json.dumps(payload.test_summary, ensure_ascii=False) if payload.test_summary else None

    lead = ContactLead(
        user_id=user.id,
        test_run_id=payload.test_run_id,
        email=user.email,
        phone=user.phone,
        company_name=user.company_name,
        test_summary=summary_str,
    )
    db.add(lead)
    db.commit()

    track_event(db, "lead_submitted", user_id=user.id, properties={
        "lead_id": lead.id,
        "company_name": user.company_name,
    })

    Thread(
        target=_send_and_mark,
        kwargs={
            "lead_id": lead.id,
            "db_url": "",
            "user_email": user.email,
            "user_phone": user.phone,
            "company_name": user.company_name,
            "test_summary": payload.test_summary,
        },
        daemon=True,
    ).start()

    return ContactLeadResponse(success=True)
