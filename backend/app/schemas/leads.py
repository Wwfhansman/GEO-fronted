from typing import Any, Optional

from pydantic import BaseModel


class ContactLeadRequest(BaseModel):
    test_run_id: Optional[str] = None
    test_summary: dict[str, Any]


class ContactLeadResponse(BaseModel):
    success: bool
