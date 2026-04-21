from collections.abc import Mapping
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import require_jwt_claims
from app.db.session import get_db
from app.models import TestRun, User, UserTestMetrics
from app.schemas.tests import ExecuteTestRequest, ExecuteTestResponse, TestRunDetail, TestRunSummary
from app.services.analytics import track_event
from app.services.company_preprocessor import normalize_company_name
from app.services.llm_review import review_response_with_llm
from app.services.metrics import calculate_overall_evaluation_text
from app.services.prompt_builder import build_prompt_with_default_template
from app.services.provider_adapter import ProviderError, get_provider_adapter
from app.services.rate_limit import is_rate_limited
from app.services.result_merger import adjudicate_result
from app.services.rule_matcher import rule_match_company
from app.services.user_service import resolve_email_verified

router = APIRouter(prefix="/api/tests", tags=["tests"])


def _get_user_or_403(session: Session, claims: Mapping[str, object]) -> User:
    auth_id = str(claims.get("sub", "")).strip()
    user = session.query(User).filter(User.supabase_auth_id == auth_id).one_or_none()
    if user is None:
        raise HTTPException(status_code=403, detail="User not registered")
    return user


def _assert_verified_email(session: Session, user: User, claims: Mapping[str, object]) -> None:
    if resolve_email_verified(claims):
        if not user.email_verified:
            user.email_verified = True
            session.commit()
        return

    if not user.email_verified:
        raise HTTPException(status_code=403, detail="Email verification required")


def _client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


@router.post("/execute", response_model=ExecuteTestResponse)
def execute_test(
    payload: ExecuteTestRequest,
    request: Request,
    claims: Mapping[str, object] = Depends(require_jwt_claims),
    x_visitor_id: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
):
    user = _get_user_or_403(db, claims)
    _assert_verified_email(db, user, claims)
    client_ip = _client_ip(request)

    if is_rate_limited(
        db,
        f"tests:ip:{client_ip}",
        settings.test_rate_limit_per_ip,
        settings.test_rate_limit_window_seconds,
    ):
        raise HTTPException(status_code=429, detail="Too many test executions from this IP")

    if is_rate_limited(
        db,
        f"tests:user:{user.id}",
        settings.test_rate_limit_per_user,
        settings.test_rate_limit_window_seconds,
    ):
        raise HTTPException(status_code=429, detail="Too many test executions for this account")

    metrics = db.get(UserTestMetrics, user.id)
    if metrics is None:
        metrics = UserTestMetrics(user_id=user.id)
        db.add(metrics)
        db.flush()

    if metrics.free_test_quota_remaining <= 0:
        raise HTTPException(status_code=429, detail="Free test quota exhausted")

    prompt_info = build_prompt_with_default_template(
        industry=payload.industry,
        product_keyword=payload.product_keyword,
        language=payload.language,
    )
    adapter = get_provider_adapter(payload.provider, settings.openai_api_key)
    try:
        provider_result = adapter.generate(prompt_info["prompt"])
    except ProviderError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    response_text = provider_result["response_text"]
    normalized = normalize_company_name(payload.company_name)

    rule_result = rule_match_company(response_text, normalized)
    rule_matched = bool(rule_result["rule_matched"])
    raw_match_count = rule_result["raw_match_count"]

    llm_review_triggered = not rule_matched
    llm_review = review_response_with_llm(
        response_text=response_text,
        company_name=payload.company_name,
        mode="match_check" if llm_review_triggered else "reason_only",
    )

    merged = adjudicate_result(
        rule_matched=rule_matched,
        raw_match_count=raw_match_count,
        llm_review_triggered=llm_review_triggered,
        llm_match=llm_review.get("llm_match"),
        llm_match_count=llm_review.get("llm_match_count"),
    )

    # Persist test run
    run = TestRun(
        user_id=user.id,
        input_company_name=payload.company_name,
        input_product_keyword=payload.product_keyword,
        input_industry=payload.industry,
        input_provider=payload.provider,
        final_prompt=prompt_info["prompt"],
        provider_model_name=provider_result["model_name"],
        raw_response_text=response_text,
        response_latency_ms=provider_result["response_latency_ms"],
        normalized_company_name=normalized,
        rule_matched=merged["rule_matched"],
        llm_review_triggered=merged["llm_review_triggered"],
        final_match_source=merged["final_match_source"],
        is_mentioned=merged["is_mentioned"],
        mentioned_count_for_query=merged["mentioned_count_for_query"],
        exposure_count_for_query=merged["exposure_count_for_query"],
        evaluation_text=llm_review.get("evaluation_text", ""),
        evaluation_source="llm_review" if llm_review_triggered else "rule",
        status="completed",
        completed_at=datetime.utcnow(),
    )
    db.add(run)

    # Update user metrics
    metrics.total_query_count += 1
    if merged["is_mentioned"]:
        metrics.total_mentioned_count += 1
    metrics.total_exposure_count += merged["exposure_count_for_query"]
    metrics.free_test_quota_remaining = max(0, metrics.free_test_quota_remaining - 1)
    metrics.last_test_at = datetime.utcnow()
    metrics.overall_evaluation_text = calculate_overall_evaluation_text(
        metrics.total_query_count, metrics.total_mentioned_count
    )

    db.commit()
    db.refresh(run)

    track_event(
        db,
        "test_executed",
        user_id=user.id,
        visitor_id=x_visitor_id,
        properties={
            "test_run_id": run.id,
            "provider": payload.provider,
            "is_mentioned": merged["is_mentioned"],
        },
    )

    return ExecuteTestResponse(
        test_run_id=run.id,
        status="completed",
        is_mentioned=merged["is_mentioned"],
        mentioned_count_for_query=merged["mentioned_count_for_query"],
        exposure_count_for_query=merged["exposure_count_for_query"],
        final_match_source=merged["final_match_source"],
        evaluation_text=llm_review.get("evaluation_text", ""),
    )


@router.get("/runs", response_model=list[TestRunSummary])
def list_test_runs(
    claims: Mapping[str, object] = Depends(require_jwt_claims),
    db: Session = Depends(get_db),
):
    user = _get_user_or_403(db, claims)
    runs = (
        db.query(TestRun)
        .filter(TestRun.user_id == user.id)
        .order_by(TestRun.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        TestRunSummary(
            id=r.id,
            input_company_name=r.input_company_name,
            input_industry=r.input_industry,
            input_provider=r.input_provider,
            is_mentioned=r.is_mentioned,
            status=r.status,
            created_at=(r.created_at.isoformat() + "Z") if r.created_at else "",
        )
        for r in runs
    ]


@router.get("/runs/{run_id}", response_model=TestRunDetail)
def get_test_run(
    run_id: str,
    claims: Mapping[str, object] = Depends(require_jwt_claims),
    db: Session = Depends(get_db),
):
    user = _get_user_or_403(db, claims)
    run = db.query(TestRun).filter(TestRun.id == run_id, TestRun.user_id == user.id).one_or_none()
    if run is None:
        raise HTTPException(status_code=404, detail="Test run not found")

    return TestRunDetail(
        id=run.id,
        input_company_name=run.input_company_name,
        input_product_keyword=run.input_product_keyword,
        input_industry=run.input_industry,
        input_provider=run.input_provider,
        raw_response_text=run.raw_response_text,
        is_mentioned=run.is_mentioned,
        mentioned_count_for_query=run.mentioned_count_for_query,
        exposure_count_for_query=run.exposure_count_for_query,
        final_match_source=run.final_match_source,
        evaluation_text=run.evaluation_text,
        status=run.status,
        created_at=(run.created_at.isoformat() + "Z") if run.created_at else "",
    )
