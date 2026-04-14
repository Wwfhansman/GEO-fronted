from __future__ import annotations

import json
import logging
from typing import Any, Dict, Optional

from sqlalchemy.orm import Session

from app.models.event_log import EventLog

logger = logging.getLogger(__name__)


def build_event_payload(event_name: str, properties: Dict[str, Any]) -> Dict[str, Any]:
    return {"event_name": event_name, "properties": properties}


def track_event(
    db: Session,
    event_name: str,
    properties: Optional[Dict[str, Any]] = None,
    user_id: Optional[str] = None,
) -> EventLog:
    """Persist an analytics event to the database."""
    props_str = json.dumps(properties, ensure_ascii=False) if properties else None
    event = EventLog(
        event_name=event_name,
        user_id=user_id,
        properties=props_str,
    )
    db.add(event)
    db.commit()
    logger.debug("Tracked event: %s user=%s", event_name, user_id)
    return event
