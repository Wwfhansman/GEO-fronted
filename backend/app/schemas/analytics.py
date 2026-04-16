from typing import Any, Optional

from pydantic import BaseModel, Field


class TrackAnalyticsEventRequest(BaseModel):
    event: str
    properties: dict[str, Any] = Field(default_factory=dict)
    visitor_id: Optional[str] = None
    timestamp: Optional[str] = None


class TrackAnalyticsEventResponse(BaseModel):
    success: bool
