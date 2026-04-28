from __future__ import annotations

from datetime import date

from pydantic import BaseModel, ConfigDict, Field


class TariffRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    water_cost_per_liter: float
    energy_cost_per_kwh: float
    currency: str


class TariffUpdate(BaseModel):
    water_cost_per_liter: float = Field(gt=0)
    energy_cost_per_kwh: float = Field(gt=0)
    currency: str = Field(min_length=3, max_length=8)


class MonthlyCostPoint(BaseModel):
    bucket: str
    total_cost: float


class FinanceSummary(BaseModel):
    currency: str
    from_date: date
    to_date: date
    total_water_liters: float
    total_energy_kwh: float
    water_cost: float
    energy_cost: float
    total_cost: float
    monthly_trend: list[MonthlyCostPoint]
