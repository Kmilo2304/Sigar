from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from ..users.service import get_user_by_cedula, verify_password
from .model import AuthSession


SESSION_HOURS = 12


def authenticate_user(db: Session, cedula: str, password: str):
    user = get_user_by_cedula(db, cedula)
    if not user or not user.is_active:
        return None

    if not verify_password(password, user.password_hash):
        return None

    return user


def create_session(db: Session, user_id: int) -> AuthSession:
    session = AuthSession(
        user_id=user_id,
        token=secrets.token_urlsafe(32),
        expires_at=datetime.now(timezone.utc) + timedelta(hours=SESSION_HOURS),
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session
