from __future__ import annotations

from pydantic import BaseModel, Field

from ..users.schemas import UserRead


class LoginRequest(BaseModel):
    cedula: str = Field(min_length=5, max_length=24)
    password: str = Field(min_length=6, max_length=128)


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead
