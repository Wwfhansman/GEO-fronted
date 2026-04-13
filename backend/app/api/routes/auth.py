from fastapi import APIRouter, Depends

from app.core.security import require_bearer_token
from app.schemas.auth import BootstrapUserRequest, BootstrapUserResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/bootstrap", response_model=BootstrapUserResponse)
def bootstrap_user(
    payload: BootstrapUserRequest,
    _: str = Depends(require_bearer_token),
):
    return BootstrapUserResponse(
        user_id="placeholder-user-id",
        email=payload.email,
        phone=payload.phone,
        company_name=payload.company_name,
    )
