from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ...core.database import get_db
from .schemas import MonthlyTariffRead, MonthlyTariffUpdate, ScheduleConfigRead, ScheduleConfigUpdate
from .service import get_monthly_tariff, get_or_create_config, upsert_monthly_tariff, update_config

router = APIRouter(prefix="/configuration", tags=["configuration"])


@router.get("", response_model=ScheduleConfigRead)
def get_configuration(db: Session = Depends(get_db)) -> ScheduleConfigRead:
    return get_or_create_config(db)


@router.put("", response_model=ScheduleConfigRead)
def put_configuration(payload: ScheduleConfigUpdate, db: Session = Depends(get_db)) -> ScheduleConfigRead:
    return update_config(db, payload)


@router.get("/tariff", response_model=MonthlyTariffRead)
def get_configuration_tariff(
    year: int | None = Query(default=None, ge=2000, le=2100),
    month: int | None = Query(default=None, ge=1, le=12),
    db: Session = Depends(get_db),
) -> MonthlyTariffRead:
    return get_monthly_tariff(db, year, month)


@router.put("/tariff", response_model=MonthlyTariffRead)
def put_configuration_tariff(payload: MonthlyTariffUpdate, db: Session = Depends(get_db)) -> MonthlyTariffRead:
    return upsert_monthly_tariff(db, payload)
