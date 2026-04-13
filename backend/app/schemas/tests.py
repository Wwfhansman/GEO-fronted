from typing import Optional

from pydantic import BaseModel


class ExecuteTestRequest(BaseModel):
    company_name: str
    product_keyword: str
    industry: str
    provider: str


class ExecuteTestResponse(BaseModel):
    test_run_id: str
    status: str
    is_mentioned: bool
    mentioned_count_for_query: int
    exposure_count_for_query: int
    final_match_source: str
    evaluation_text: str


class TestRunDetail(BaseModel):
    id: str
    input_company_name: str
    input_product_keyword: str
    input_industry: str
    input_provider: str
    raw_response_text: Optional[str] = None
    is_mentioned: Optional[bool] = None
    mentioned_count_for_query: Optional[int] = None
    exposure_count_for_query: Optional[int] = None
    final_match_source: Optional[str] = None
    evaluation_text: Optional[str] = None
    status: str
    created_at: str
