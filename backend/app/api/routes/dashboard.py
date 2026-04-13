from fastapi import APIRouter, Depends

from app.core.security import require_admin_token

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary")
def dashboard_summary(_: str = Depends(require_admin_token)):
    return {
        "user_count": 0,
        "test_count": 0,
        "lead_count": 0,
        "funnel": {},
    }
