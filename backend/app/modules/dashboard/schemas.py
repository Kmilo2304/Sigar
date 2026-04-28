from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AlertRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    level: str
    title: str
    message: str
    resolved: bool
    created_at: datetime


class DashboardSummary(BaseModel):
    humidity: float | None
    lux: float | None
    water_liters: float | None
    energy_kwh: float | None
    measured_at: datetime | None
    active_alerts: int
    manual_mode: bool
    irrigation_on: bool
    lights_on: bool


class SystemStateRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    manual_mode: bool
    irrigation_on: bool
    lights_on: bool
    last_reason: str
    updated_at: datetime


class ControlModeUpdate(BaseModel):
    mode: str  # automatic | manual


class ControlToggleUpdate(BaseModel):
    system: str  # irrigation | lights
    action: str  # on | off
