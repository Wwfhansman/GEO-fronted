from fastapi import APIRouter, Depends

from app.core.security import require_bearer_token
from app.schemas.context import UserContextResponse

router = APIRouter(prefix="/api/context", tags=["context"])


@router.get("/me", response_model=UserContextResponse)
def get_user_context(_: str = Depends(require_bearer_token)):
    return UserContextResponse(
        is_registered=True,
        total_query_count=0,
        total_mentioned_count=0,
        total_exposure_count=0,
        free_test_quota_remaining=3,
        overall_evaluation_text="您尚未开始测试，先查看您的AI曝光情况。",
    )
