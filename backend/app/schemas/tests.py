from pydantic import BaseModel


class ExecuteTestRequest(BaseModel):
    company_name: str
    product_keyword: str
    industry: str
    provider: str


class ExecuteTestResponse(BaseModel):
    status: str
    is_mentioned: bool
    mentioned_count_for_query: int
    exposure_count_for_query: int
    final_match_source: str
    evaluation_text: str
