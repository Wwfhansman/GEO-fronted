from app.services.result_merger import adjudicate_result


def test_rule_match_wins_without_review():
    result = adjudicate_result(
        rule_matched=True,
        raw_match_count=2,
        llm_review_triggered=False,
        llm_match=None,
        llm_match_count=None,
    )
    assert result["is_mentioned"] is True
    assert result["mentioned_count_for_query"] == 1
    assert result["exposure_count_for_query"] == 2
    assert result["final_match_source"] == "rule"
