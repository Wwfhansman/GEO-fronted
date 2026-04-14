from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class TestRun(Base):
    __tablename__ = "test_runs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    input_company_name: Mapped[str] = mapped_column(String, nullable=False, default="")
    input_product_keyword: Mapped[str] = mapped_column(String, nullable=False, default="")
    input_industry: Mapped[str] = mapped_column(String, nullable=False, default="")
    input_provider: Mapped[str] = mapped_column(String, nullable=False, default="")
    final_prompt: Mapped[str] = mapped_column(Text, nullable=False, default="")
    provider_model_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    raw_response_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    response_latency_ms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    normalized_company_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    rule_matched: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    llm_review_triggered: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    final_match_source: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    is_mentioned: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    mentioned_count_for_query: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    exposure_count_for_query: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    evaluation_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    evaluation_source: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, default="pending", nullable=False)
    error_code: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)


class ContactLead(Base):
    __tablename__ = "contact_leads"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    test_run_id: Mapped[Optional[str]] = mapped_column(ForeignKey("test_runs.id"), nullable=True)
    email: Mapped[str] = mapped_column(String, nullable=False)
    phone: Mapped[str] = mapped_column(String, nullable=False)
    company_name: Mapped[str] = mapped_column(String, nullable=False)
    test_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    email_sent: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
