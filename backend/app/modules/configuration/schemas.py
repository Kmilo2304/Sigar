from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ScheduleConfigRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    irrigation_start: str
    irrigation_end: str
    lights_start: str
    lights_end: str
    lux_on_min: float
    lux_off_max: float
    humidity_on_min: float
    humidity_off_max: float
    updated_at: datetime


class ScheduleConfigUpdate(BaseModel):
    irrigation_start: str = Field(pattern=r"^([01][0-9]|2[0-3]):[0-5][0-9]$")
    irrigation_end: str = Field(pattern=r"^([01][0-9]|2[0-3]):[0-5][0-9]$")
    lights_start: str = Field(pattern=r"^([01][0-9]|2[0-3]):[0-5][0-9]$")
    lights_end: str = Field(pattern=r"^([01][0-9]|2[0-3]):[0-5][0-9]$")
    lux_on_min: float = Field(ge=0)
    lux_off_max: float = Field(ge=0)
    humidity_on_min: float = Field(ge=0, le=100)
    humidity_off_max: float = Field(ge=0, le=100)


class MonthlyTariffRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    year: int
    month: int
    water_cost_per_m3: float
    energy_cost_per_kwh: float
    updated_at: datetime


class MonthlyTariffUpdate(BaseModel):
    year: int = Field(ge=2000, le=2100)
    month: int = Field(ge=1, le=12)
    water_cost_per_m3: float = Field(gt=0)
    energy_cost_per_kwh: float = Field(gt=0)
