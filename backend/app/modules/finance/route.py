from __future__ import annotations

from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ...core.database import get_db
from .schemas import FinanceSummary, TariffRead, TariffUpdate
from .service import get_or_create_tariff, summarize_costs, update_tariff

router = APIRouter(prefix="/finance", tags=["finance"])


@router.get("/tariff", response_model=TariffRead)
def get_tariff(db: Session = Depends(get_db)) -> TariffRead:
    return get_or_create_tariff(db)


@router.put("/tariff", response_model=TariffRead)
def put_tariff(payload: TariffUpdate, db: Session = Depends(get_db)) -> TariffRead:
    return update_tariff(db, payload)


@router.get("/summary", response_model=FinanceSummary)
def get_finance_summary(
    from_date: date | None = None,
    to_date: date | None = None,
    db: Session = Depends(get_db),
) -> FinanceSummary:
    today = date.today()
    default_from = today - timedelta(days=30)
    return summarize_costs(db, from_date or default_from, to_date or today)
