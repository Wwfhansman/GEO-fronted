from typing import Dict


def rule_match_company(response_text: str, normalized_company_name: str) -> Dict[str, int]:
    normalized_text = response_text.lower().replace(" ", "")
    match_count = normalized_text.count(normalized_company_name.lower())
    return {"rule_matched": bool(match_count > 0), "raw_match_count": match_count}
