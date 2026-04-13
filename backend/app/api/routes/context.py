from collections.abc import Mapping

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import require_jwt_claims
from app.db.session import get_db
from app.schemas.context import UserContextResponse
from app.services.user_service import build_user_context

router = APIRouter(prefix="/api/context", tags=["context"])


@router.get("/me", response_model=UserContextResponse)
def get_user_context(
    claims: Mapping[str, object] = Depends(require_jwt_claims),
    db: Session = Depends(get_db),
):
    return build_user_context(db, claims)
