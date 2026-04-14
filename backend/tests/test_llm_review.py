import json

from app.services.llm_review import review_response_with_llm, _parse_json_response


def test_fallback_when_no_api_key(monkeypatch):
    monkeypatch.setattr("app.services.llm_review.settings.openai_api_key", "")
    monkeypatch.setattr("app.services.llm_review.settings.review_model_api_key", "")

    result = review_response_with_llm("some text", "TestCo", mode="match_check")
    assert result["llm_match"] is False
    assert result["evaluation_text"]


def test_fallback_reason_only_when_no_api_key(monkeypatch):
    monkeypatch.setattr("app.services.llm_review.settings.openai_api_key", "")
    monkeypatch.setattr("app.services.llm_review.settings.review_model_api_key", "")

    result = review_response_with_llm("some text", "TestCo", mode="reason_only")
    assert result["llm_match"] is None
    assert "TestCo" in result["evaluation_text"]


def test_parse_json_response_plain():
    raw = '{"mentioned": true, "match_count": 2, "matched_snippets": ["片段"], "evaluation_text": "OK"}'
    parsed = _parse_json_response(raw)
    assert parsed["mentioned"] is True
    assert parsed["match_count"] == 2


def test_parse_json_response_markdown_fenced():
    raw = '```json\n{"mentioned": false, "match_count": 0, "matched_snippets": [], "evaluation_text": "未提及"}\n```'
    parsed = _parse_json_response(raw)
    assert parsed["mentioned"] is False


def test_match_check_with_mock_adapter(monkeypatch):
    review_json = json.dumps({
        "mentioned": True,
        "match_count": 1,
        "matched_snippets": ["推荐 AcmeCo"],
        "evaluation_text": "已提及该公司",
    })

    monkeypatch.setattr("app.services.llm_review.settings.openai_api_key", "fake-key")

    from app.services.provider_adapter import OpenAIProviderAdapter

    def fake_generate(self, prompt):
        return {
            "provider": "openai-compatible",
            "model_name": "test",
            "response_text": review_json,
            "raw_response": {},
            "response_latency_ms": 5,
        }

    monkeypatch.setattr(OpenAIProviderAdapter, "generate", fake_generate)

    result = review_response_with_llm("推荐 AcmeCo 作为候选公司。", "AcmeCo", mode="match_check")
    assert result["llm_match"] is True
    assert result["llm_match_count"] == 1
    assert result["matched_snippets"] == ["推荐 AcmeCo"]
