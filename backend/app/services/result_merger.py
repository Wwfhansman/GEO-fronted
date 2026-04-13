from typing import Any, Dict, Optional


def adjudicate_result(
    rule_matched: bool,
    raw_match_count: int,
    llm_review_triggered: bool,
    llm_match: Optional[bool],
    llm_match_count: Optional[int],
) -> Dict[str, Any]:
    if rule_matched:
        return {
            "rule_matched": True,
            "llm_review_triggered": False,
            "is_mentioned": True,
            "mentioned_count_for_query": 1,
            "exposure_count_for_query": raw_match_count,
            "final_match_source": "rule",
        }

    if llm_review_triggered and llm_match:
        return {
            "rule_matched": False,
            "llm_review_triggered": True,
            "is_mentioned": True,
            "mentioned_count_for_query": 1,
            "exposure_count_for_query": llm_match_count or 1,
            "final_match_source": "llm_review",
        }

    return {
        "rule_matched": False,
        "llm_review_triggered": llm_review_triggered,
        "is_mentioned": False,
        "mentioned_count_for_query": 0,
        "exposure_count_for_query": 0,
        "final_match_source": "none",
    }
