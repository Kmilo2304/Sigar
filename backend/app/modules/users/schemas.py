from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class UserCreate(BaseModel):
    cedula: str = Field(min_length=5, max_length=24)
    full_name: str = Field(min_length=3, max_length=120)
    password: str = Field(min_length=6, max_length=128)
    role: str = Field(default="admin", max_length=24)


class UserRoleUpdate(BaseModel):
    role: str = Field(min_length=3, max_length=24)


class UserPasswordReset(BaseModel):
    password: str = Field(min_length=6, max_length=128)


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    cedula: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime
