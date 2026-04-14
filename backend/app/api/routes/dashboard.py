from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.security import require_admin_token
from app.db.session import get_db
from app.models import ContactLead, EventLog, TestRun, User

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary")
def dashboard_summary(
    _: str = Depends(require_admin_token),
    db: Session = Depends(get_db),
):
    user_count = db.query(func.count(User.id)).scalar() or 0
    test_count = db.query(func.count(TestRun.id)).scalar() or 0
    lead_count = db.query(func.count(ContactLead.id)).scalar() or 0

    mentioned_count = (
        db.query(func.count(TestRun.id)).filter(TestRun.is_mentioned == True).scalar() or 0  # noqa: E712
    )

    return {
        "user_count": user_count,
        "test_count": test_count,
        "lead_count": lead_count,
        "mentioned_count": mentioned_count,
        "funnel": {
            "registered": user_count,
            "tested": db.query(func.count(func.distinct(TestRun.user_id))).scalar() or 0,
            "contacted": db.query(func.count(func.distinct(ContactLead.user_id))).scalar() or 0,
        },
        "event_counts": {
            "user_registered": db.query(func.count(EventLog.id)).filter(EventLog.event_name == "user_registered").scalar() or 0,
            "test_executed": db.query(func.count(EventLog.id)).filter(EventLog.event_name == "test_executed").scalar() or 0,
            "lead_submitted": db.query(func.count(EventLog.id)).filter(EventLog.event_name == "lead_submitted").scalar() or 0,
        },
    }
