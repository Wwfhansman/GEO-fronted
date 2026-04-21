from __future__ import annotations

from collections.abc import Mapping

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models import User, UserTestMetrics
from app.schemas.auth import BootstrapUserRequest
from app.schemas.context import UserContextResponse


def _claim_bool(claims: Mapping[str, object], *keys: str) -> bool:
    for key in keys:
        value = claims.get(key)
        if isinstance(value, bool):
            return value
        if value is not None:
            return True
    return False


def _get_required_claim(claims: Mapping[str, object], key: str) -> str:
    value = claims.get(key)
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"missing_claim:{key}")
    return value.strip()


def upsert_bootstrap_user(
    session: Session,
    claims: Mapping[str, object],
    payload: BootstrapUserRequest,
) -> User:
    auth_id = _get_required_claim(claims, "sub")
    token_email = _get_required_claim(claims, "email").lower()

    user = session.query(User).filter(
        or_(User.supabase_auth_id == auth_id, User.email == token_email)
    ).one_or_none()
    if user is None:
        user = User(
            supabase_auth_id=auth_id,
            email=token_email,
            phone=payload.phone,
            company_name=payload.company_name,
        )
        session.add(user)
        session.flush()
    else:
        user.supabase_auth_id = auth_id
        user.email = token_email
        user.phone = payload.phone
        user.company_name = payload.company_name

    claim_email_verified = _claim_bool(claims, "email_verified", "email_confirmed_at")
    if claim_email_verified or user.email_verified:
        user.email_verified = True
    else:
        user.email_verified = False

    metrics = session.get(UserTestMetrics, user.id)
    if metrics is None:
        session.add(UserTestMetrics(user_id=user.id))

    session.commit()
    session.refresh(user)
    return user


def build_user_context(session: Session, claims: Mapping[str, object]) -> UserContextResponse:
    auth_id = _get_required_claim(claims, "sub")
    email = _get_required_claim(claims, "email").lower()

    user = session.query(User).filter(
        or_(User.supabase_auth_id == auth_id, User.email == email)
    ).one_or_none()
    if user is None:
        return UserContextResponse(
            is_registered=False,
            total_query_count=0,
            total_mentioned_count=0,
            total_exposure_count=0,
            free_test_quota_remaining=3,
            overall_evaluation_text="您尚未开始测试，先查看您的AI曝光情况。",
        )

    metrics = session.get(UserTestMetrics, user.id)
    if metrics is None:
        metrics = UserTestMetrics(user_id=user.id)
        session.add(metrics)
        session.commit()
        session.refresh(metrics)

    return UserContextResponse(
        is_registered=True,
        total_query_count=metrics.total_query_count,
        total_mentioned_count=metrics.total_mentioned_count,
        total_exposure_count=metrics.total_exposure_count,
        free_test_quota_remaining=metrics.free_test_quota_remaining,
        overall_evaluation_text=metrics.overall_evaluation_text,
    )
