from pydantic import BaseModel


class UserContextResponse(BaseModel):
    is_registered: bool
    total_query_count: int
    total_mentioned_count: int
    total_exposure_count: int
    free_test_quota_remaining: int
    overall_evaluation_text: str
