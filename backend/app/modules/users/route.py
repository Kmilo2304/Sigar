from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ...core.database import get_db
from .schemas import UserCreate, UserPasswordReset, UserRead, UserRoleUpdate
from .service import (
    create_user,
    delete_user,
    get_user_by_cedula,
    list_users,
    reset_user_password,
    update_user_role,
)

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserRead])
def get_users(db: Session = Depends(get_db)) -> list[UserRead]:
    return list_users(db)


@router.get("/{cedula}", response_model=UserRead)
def get_user(cedula: str, db: Session = Depends(get_db)) -> UserRead:
    user = get_user_by_cedula(db, cedula)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    return user


@router.post("", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def post_user(payload: UserCreate, db: Session = Depends(get_db)) -> UserRead:
    existing = get_user_by_cedula(db, payload.cedula)
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="La cedula ya existe")
    return create_user(db, payload)


@router.put("/{cedula}/role", response_model=UserRead)
def put_user_role(cedula: str, payload: UserRoleUpdate, db: Session = Depends(get_db)) -> UserRead:
    user = get_user_by_cedula(db, cedula)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    return update_user_role(db, user, payload.role)


@router.put("/{cedula}/reset-password", response_model=UserRead)
def put_user_reset_password(cedula: str, payload: UserPasswordReset, db: Session = Depends(get_db)) -> UserRead:
    user = get_user_by_cedula(db, cedula)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    return reset_user_password(db, user, payload.password)


@router.delete("/{cedula}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user_by_cedula(cedula: str, db: Session = Depends(get_db)) -> None:
    user = get_user_by_cedula(db, cedula)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    delete_user(db, user)
    return None
