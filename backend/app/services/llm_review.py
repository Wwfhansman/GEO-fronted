from typing import Any, Dict


def review_response_with_llm(
    response_text: str,
    company_name: str,
    mode: str = "match_check",
) -> Dict[str, Any]:
    # Placeholder for structured LLM review call.
    # Future implementation should return JSON from review model.
    if mode == "reason_only":
        return {
            "llm_match": None,
            "llm_match_count": None,
            "evaluation_text": f"已命中公司名：{company_name}，建议尽快推进GEO优化。",
        }

    return {
        "llm_match": False,
        "llm_match_count": 0,
        "evaluation_text": "在本次测试场景中，AI 未提及您的公司。",
    }
