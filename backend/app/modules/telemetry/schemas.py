from __future__ import annotations

from datetime import datetime, timezone

from pydantic import BaseModel, ConfigDict, Field, model_validator


class SensorReadingCreate(BaseModel):
    measured_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    humidity: float | None = Field(default=None, ge=0, le=100)
    lux: float | None = Field(default=None, ge=0)
    water_liters: float | None = Field(default=None, ge=0)
    energy_kwh: float | None = Field(default=None, ge=0)
    device_id: str = Field(default="sensor-01", max_length=50)
    raw_payload: dict | None = None

    @model_validator(mode="after")
    def validate_any_metric(self) -> "SensorReadingCreate":
        if all(
            value is None
            for value in (self.humidity, self.lux, self.water_liters, self.energy_kwh)
        ):
            raise ValueError("Debe enviar al menos un dato de sensor.")
        return self


class LightSensorReadingCreate(BaseModel):
    measured_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    lux: float = Field(ge=0)
    device_id: str = Field(pattern=r"^[1-5]$")
    raw_payload: dict | None = None


class WaterSensorReadingCreate(BaseModel):
    measured_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    humidity: float | None = Field(default=None, ge=0, le=100)
    water_liters: float | None = Field(default=None, ge=0)
    device_id: str = Field(pattern=r"^[1-5]$")
    raw_payload: dict | None = None

    @model_validator(mode="after")
    def validate_any_metric(self) -> "WaterSensorReadingCreate":
        if self.humidity is None and self.water_liters is None:
            raise ValueError("Debe enviar humedad o consumo de agua.")
        return self


class SensorReadingRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    measured_at: datetime
    humidity: float | None
    lux: float | None
    water_liters: float | None
    energy_kwh: float | None
    device_id: str
