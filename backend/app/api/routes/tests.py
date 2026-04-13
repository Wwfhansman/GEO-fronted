from fastapi import APIRouter, Depends

from app.core.security import require_bearer_token
from app.schemas.tests import ExecuteTestRequest, ExecuteTestResponse
from app.services.company_preprocessor import normalize_company_name
from app.services.llm_review import review_response_with_llm
from app.services.result_merger import adjudicate_result
from app.services.rule_matcher import rule_match_company

router = APIRouter(prefix="/api/tests", tags=["tests"])


@router.post("/execute", response_model=ExecuteTestResponse)
def execute_test(
    payload: ExecuteTestRequest,
    _: str = Depends(require_bearer_token),
):
    # Placeholder end-to-end flow for Task 9 scaffolding.
    simulated_response = f"推荐 {payload.company_name} 作为候选公司。"
    normalized_company_name = normalize_company_name(payload.company_name)
    rule_result = rule_match_company(simulated_response, normalized_company_name)
    rule_matched = bool(rule_result["rule_matched"])
    raw_match_count = rule_result["raw_match_count"]

    llm_review_triggered = not rule_matched
    llm_review = review_response_with_llm(
        response_text=simulated_response,
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

    return ExecuteTestResponse(
        status="completed",
        is_mentioned=merged["is_mentioned"],
        mentioned_count_for_query=merged["mentioned_count_for_query"],
        exposure_count_for_query=merged["exposure_count_for_query"],
        final_match_source=merged["final_match_source"],
        evaluation_text=llm_review.get("evaluation_text", ""),
    )
