from __future__ import annotations

import hashlib

from sqlalchemy.orm import Session

from .model import User
from .schemas import UserCreate


DEFAULT_ADMIN_CEDULA = "1010101010"
DEFAULT_ADMIN_PASSWORD = "SIGAR2026"


def hash_password(raw_password: str) -> str:
    return hashlib.sha256(raw_password.encode("utf-8")).hexdigest()


def verify_password(raw_password: str, password_hash: str) -> bool:
    return hash_password(raw_password) == password_hash


def list_users(db: Session) -> list[User]:
    return db.query(User).order_by(User.id.asc()).all()


def get_user_by_cedula(db: Session, cedula: str) -> User | None:
    return db.query(User).filter(User.cedula == cedula).first()


def create_user(db: Session, payload: UserCreate) -> User:
    user = User(
        cedula=payload.cedula,
        full_name=payload.full_name,
        password_hash=hash_password(payload.password),
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_user_role(db: Session, user: User, role: str) -> User:
    user.role = role
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def reset_user_password(db: Session, user: User, new_password: str) -> User:
    user.password_hash = hash_password(new_password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user: User) -> None:
    db.delete(user)
    db.commit()


def ensure_default_user(db: Session) -> None:
    existing = db.query(User).first()
    if existing:
        return

    default_admin = User(
        cedula=DEFAULT_ADMIN_CEDULA,
        full_name="Administrador SIGAR",
        password_hash=hash_password(DEFAULT_ADMIN_PASSWORD),
        role="admin",
    )
    db.add(default_admin)
    db.commit()
