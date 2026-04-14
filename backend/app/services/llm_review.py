from __future__ import annotations

import json
import logging
from typing import Any, Dict, Optional

from app.core.config import settings
from app.services.provider_adapter import OpenAIProviderAdapter, ProviderError

logger = logging.getLogger(__name__)

_MATCH_CHECK_SYSTEM = (
    "你是一位严谨的文本审核助手。给定一段AI模型的回答文本和一个目标公司名，"
    "请判断该回答中是否提及了该公司（含简称、品牌名、别名）。"
    "返回严格的JSON格式，不要包含任何其他文字：\n"
    '{"mentioned": true/false, "match_count": 数字, "matched_snippets": ["匹配片段1"], '
    '"evaluation_text": "一句话评估说明"}'
)

_REASON_ONLY_SYSTEM = (
    "你是一位品牌曝光分析助手。给定一段AI模型的回答文本和一个目标公司名，"
    "该公司已被确认提及。请给出一句话的曝光评估建议。"
    "返回严格的JSON格式，不要包含任何其他文字：\n"
    '{"evaluation_text": "一句话评估说明"}'
)


def _build_review_adapter() -> Optional[OpenAIProviderAdapter]:
    api_key = settings.review_model_api_key or settings.openai_api_key
    if not api_key:
        return None
    return OpenAIProviderAdapter(
        api_key=api_key,
        base_url=settings.openai_base_url,
        model_name=settings.chatgpt_model,
    )


def _parse_json_response(text: str) -> Dict[str, Any]:
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        lines = [l for l in lines if not l.strip().startswith("```")]
        text = "\n".join(lines).strip()
    return json.loads(text)


def review_response_with_llm(
    response_text: str,
    company_name: str,
    mode: str = "match_check",
) -> Dict[str, Any]:
    adapter = _build_review_adapter()
    if adapter is None:
        return _fallback(company_name, mode)

    if mode == "reason_only":
        system_prompt = _REASON_ONLY_SYSTEM
        user_prompt = f"回答文本：\n{response_text}\n\n目标公司名：{company_name}"
    else:
        system_prompt = _MATCH_CHECK_SYSTEM
        user_prompt = f"回答文本：\n{response_text}\n\n目标公司名：{company_name}"

    full_prompt = f"{system_prompt}\n\n{user_prompt}"

    try:
        result = adapter.generate(full_prompt)
        parsed = _parse_json_response(result["response_text"])
    except (ProviderError, json.JSONDecodeError, KeyError) as exc:
        logger.warning("LLM review failed, falling back: %s", exc)
        return _fallback(company_name, mode)

    if mode == "reason_only":
        return {
            "llm_match": None,
            "llm_match_count": None,
            "evaluation_text": parsed.get("evaluation_text", f"已命中公司名：{company_name}，建议尽快推进GEO优化。"),
        }

    mentioned = parsed.get("mentioned", False)
    default_eval = (
        f"已命中公司名：{company_name}，建议尽快推进GEO优化。"
        if mentioned
        else "在本次测试场景中，AI 未提及您的公司。"
    )
    return {
        "llm_match": mentioned,
        "llm_match_count": parsed.get("match_count", 0),
        "matched_snippets": parsed.get("matched_snippets", []),
        "evaluation_text": parsed.get("evaluation_text") or default_eval,
    }


def _fallback(company_name: str, mode: str) -> Dict[str, Any]:
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
