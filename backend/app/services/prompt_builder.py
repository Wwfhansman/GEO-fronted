from typing import Dict


def build_prompt(industry: str, product_keyword: str, template: str) -> str:
    return template.replace("{product_keyword}", product_keyword).replace(
        "{industry}",
        industry,
    )


def _normalize_language(language: str) -> str:
    return "en" if str(language).lower().startswith("en") else "zh"


def _display_industry(industry: str, language: str) -> str:
    normalized_language = _normalize_language(language)
    if normalized_language == "zh":
        return industry

    industry_map = {
        "医疗健康": "healthcare",
        "电商品牌": "e-commerce",
        "IT科技": "IT and technology",
        "智能制造": "advanced manufacturing",
        "传统零售": "retail",
    }
    return industry_map.get(industry, industry)


def get_default_template(language: str = "zh") -> str:
    if _normalize_language(language) == "en":
        return (
            "Industry context: the user is evaluating solutions in {industry}. "
            "User request: the user wants recommendations related to {product_keyword}. "
            "Recommendation format: provide recommended companies or brands directly, then briefly explain why they fit."
        )

    return (
        "行业场景背景：用户正在评估{industry}方向的解决方案。"
        "用户需求描述：用户想了解{product_keyword}相关推荐对象。"
        "推荐型回答要求：请直接给出推荐公司或品牌，并简要说明推荐理由。"
    )


def build_prompt_with_default_template(
    industry: str,
    product_keyword: str,
    language: str = "zh",
) -> Dict[str, str]:
    normalized_language = _normalize_language(language)
    template = get_default_template(normalized_language)
    prompt = build_prompt(_display_industry(industry, normalized_language), product_keyword, template)
    return {
        "template_version": f"v1_{normalized_language}",
        "prompt": prompt,
        "language": normalized_language,
    }
