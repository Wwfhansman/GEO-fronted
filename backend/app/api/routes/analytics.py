from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.analytics import TrackAnalyticsEventRequest, TrackAnalyticsEventResponse
from app.services.analytics import track_event

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.post("/track", response_model=TrackAnalyticsEventResponse)
def track_analytics_event(
    payload: TrackAnalyticsEventRequest,
    db: Session = Depends(get_db),
):
    track_event(
        db,
        payload.event,
        properties=payload.properties,
        visitor_id=payload.visitor_id,
    )
    return TrackAnalyticsEventResponse(success=True)
