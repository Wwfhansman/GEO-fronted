import re


COMPANY_SUFFIXES = (
    "有限公司",
    "股份有限公司",
    "集团",
    "公司",
)


def normalize_company_name(company_name: str) -> str:
    normalized = re.sub(r"\s+", "", company_name).strip().lower()
    for suffix in COMPANY_SUFFIXES:
        if normalized.endswith(suffix.lower()):
            normalized = normalized[: -len(suffix)]
            break
    return normalized or company_name.strip().lower()
