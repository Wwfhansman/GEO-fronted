from pydantic import BaseModel


class BootstrapUserRequest(BaseModel):
    email: str
    phone: str
    company_name: str


class BootstrapUserResponse(BaseModel):
    user_id: str
    email: str
    phone: str
    company_name: str
