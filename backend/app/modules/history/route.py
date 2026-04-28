from __future__ import annotations

from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ...core.database import get_db
from .schemas import ComparativeHistoryResponse, Granularity
from .service import get_comparative_history

router = APIRouter(prefix="/history", tags=["history"])


@router.get("/comparative", response_model=ComparativeHistoryResponse)
def get_history_comparative(
    granularity: Granularity = Query(default="day"),
    from_date: date | None = None,
    to_date: date | None = None,
    db: Session = Depends(get_db),
) -> ComparativeHistoryResponse:
    today = date.today()
    default_from = today - timedelta(days=30)

    return get_comparative_history(
        db=db,
        granularity=granularity,
        from_date=from_date or default_from,
        to_date=to_date or today,
    )
