from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    supabase_auth_id: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    phone: Mapped[str] = mapped_column(String, nullable=False)
    company_name: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )


class UserTestMetrics(Base):
    __tablename__ = "user_test_metrics"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    total_query_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_mentioned_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_exposure_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    free_test_quota_total: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    free_test_quota_remaining: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    overall_evaluation_text: Mapped[str] = mapped_column(
        Text,
        default="您尚未开始测试，先查看您的AI曝光情况。",
        nullable=False,
    )
    last_test_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )
