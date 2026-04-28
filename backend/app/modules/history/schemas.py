from __future__ import annotations

from datetime import date
from typing import Literal

from pydantic import BaseModel


Granularity = Literal["year", "quarter", "month", "week", "day", "hour"]


class HistoryPoint(BaseModel):
    bucket: str
    water_liters: float
    energy_kwh: float


class ComparativeHistoryResponse(BaseModel):
    granularity: Granularity
    from_date: date
    to_date: date
    points: list[HistoryPoint]
