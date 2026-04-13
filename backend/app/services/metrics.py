def calculate_overall_evaluation_text(total_query_count: int, total_mentioned_count: int) -> str:
    if total_query_count <= 0 or total_mentioned_count == 0:
        return "您的品牌当前几乎不会被 AI 主动推荐。"

    mention_rate = total_mentioned_count / total_query_count
    if mention_rate < 0.5:
        return "您的品牌在部分场景会被提及，但整体推荐可见性仍偏低。"

    return "您的品牌在多数测试场景已被提及，建议继续优化提升稳定曝光。"
