from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ...core.database import get_db
from .schemas import AlertRead, ControlModeUpdate, ControlToggleUpdate, DashboardSummary, SystemStateRead
from .service import (
    build_summary,
    list_alerts,
    refresh_state_by_schedule,
    resolve_alert,
    set_control_mode,
    set_manual_system_state,
)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db)) -> DashboardSummary:
    return build_summary(db)


@router.get("/system-state", response_model=SystemStateRead)
def get_dashboard_system_state(db: Session = Depends(get_db)) -> SystemStateRead:
    return refresh_state_by_schedule(db)


@router.post("/control/mode", response_model=SystemStateRead)
def post_control_mode(payload: ControlModeUpdate, db: Session = Depends(get_db)) -> SystemStateRead:
    if payload.mode not in {"automatic", "manual"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Modo invalido.")
    return set_control_mode(db, payload.mode)


@router.post("/control/toggle", response_model=SystemStateRead)
def post_control_toggle(payload: ControlToggleUpdate, db: Session = Depends(get_db)) -> SystemStateRead:
    if payload.system not in {"irrigation", "lights"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Sistema invalido.")
    if payload.action not in {"on", "off"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Accion invalida.")
    return set_manual_system_state(db, payload.system, payload.action)


@router.get("/alerts", response_model=list[AlertRead])
def get_dashboard_alerts(
    limit: int = Query(default=20, ge=1, le=200),
    db: Session = Depends(get_db),
) -> list[AlertRead]:
    return list_alerts(db, limit)


@router.post("/alerts/{alert_id}/resolve", response_model=AlertRead)
def post_resolve_alert(alert_id: int, db: Session = Depends(get_db)) -> AlertRead:
    alert = resolve_alert(db, alert_id)
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alerta no encontrada")
    return alert
