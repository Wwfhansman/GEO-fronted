from typing import Optional

from pydantic import BaseModel


class BootstrapUserRequest(BaseModel):
    email: str
    phone: str
    company_name: str
    turnstile_token: Optional[str] = None


class BootstrapUserResponse(BaseModel):
    user_id: str
    email: str
    phone: str
    company_name: str
