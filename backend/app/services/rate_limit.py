from __future__ import annotations

from datetime import datetime, timedelta

from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.models import RateLimitEvent


def is_rate_limited(session: Session, key: str, limit: int, window_seconds: int) -> bool:
    now = datetime.utcnow()
    cutoff = now - timedelta(seconds=window_seconds)

    session.execute(
        delete(RateLimitEvent).where(
            RateLimitEvent.key == key,
            RateLimitEvent.created_at <= cutoff,
        )
    )
    session.commit()

    current = (
        session.query(RateLimitEvent)
        .filter(
            RateLimitEvent.key == key,
            RateLimitEvent.created_at > cutoff,
        )
        .count()
    )
    if current >= limit:
        return True

    session.add(RateLimitEvent(key=key, created_at=now))
    session.commit()
    return False
