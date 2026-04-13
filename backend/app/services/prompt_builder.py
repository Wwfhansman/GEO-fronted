from typing import Dict


def build_prompt(industry: str, product_keyword: str, template: str) -> str:
    return template.replace("{product_keyword}", product_keyword).replace(
        "{industry}",
        industry,
    )


def get_default_template() -> str:
    return (
        "行业场景背景：用户正在评估{industry}方向的解决方案。"
        "用户需求描述：用户想了解{product_keyword}相关推荐对象。"
        "推荐型回答要求：请直接给出推荐公司或品牌，并简要说明推荐理由。"
    )


def build_prompt_with_default_template(industry: str, product_keyword: str) -> Dict[str, str]:
    template = get_default_template()
    return {"template_version": "v1", "prompt": build_prompt(industry, product_keyword, template)}
