from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from ...core.database import Base


class ScheduleConfig(Base):
    __tablename__ = "schedule_config"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    irrigation_start: Mapped[str] = mapped_column(String(5), default="06:00")
    irrigation_end: Mapped[str] = mapped_column(String(5), default="06:30")
    lights_start: Mapped[str] = mapped_column(String(5), default="17:30")
    lights_end: Mapped[str] = mapped_column(String(5), default="23:00")
    lux_on_min: Mapped[float] = mapped_column(Float, default=120.0)
    lux_off_max: Mapped[float] = mapped_column(Float, default=500.0)
    humidity_on_min: Mapped[float] = mapped_column(Float, default=25.0)
    humidity_off_max: Mapped[float] = mapped_column(Float, default=80.0)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )


class MonthlyTariffConfig(Base):
    __tablename__ = "monthly_tariff_config"
    __table_args__ = (UniqueConstraint("year", "month", name="uq_monthly_tariff_period"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    year: Mapped[int] = mapped_column(Integer, index=True)
    month: Mapped[int] = mapped_column(Integer, index=True)
    water_cost_per_m3: Mapped[float] = mapped_column(Float, default=3.0)
    energy_cost_per_kwh: Mapped[float] = mapped_column(Float, default=0.8)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
