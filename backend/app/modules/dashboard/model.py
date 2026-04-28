from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from ...core.database import Base


class AlertEvent(Base):
    __tablename__ = "alert_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    sensor_reading_id: Mapped[int | None] = mapped_column(
        ForeignKey("sensor_readings.id", ondelete="SET NULL"),
        nullable=True,
    )
    level: Mapped[str] = mapped_column(String(16), default="warning")
    title: Mapped[str] = mapped_column(String(120))
    message: Mapped[str] = mapped_column(Text)
    resolved: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class SystemState(Base):
    __tablename__ = "system_state"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    manual_mode: Mapped[bool] = mapped_column(Boolean, default=False)
    irrigation_sensor_on: Mapped[bool] = mapped_column(Boolean, default=False)
    lights_sensor_on: Mapped[bool] = mapped_column(Boolean, default=False)
    irrigation_on: Mapped[bool] = mapped_column(Boolean, default=False)
    lights_on: Mapped[bool] = mapped_column(Boolean, default=False)
    last_reason: Mapped[str] = mapped_column(String(180), default="Inicializacion")
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )


class SystemCycle(Base):
    __tablename__ = "system_cycles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    system: Mapped[str] = mapped_column(String(16), index=True)  # irrigation | lights
    trigger_source: Mapped[str] = mapped_column(String(20), default="automatico")
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    consumption_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    unit: Mapped[str] = mapped_column(String(12))  # liters | kwh
    status: Mapped[str] = mapped_column(String(12), default="open")  # open | closed


class SystemStateLog(Base):
    __tablename__ = "system_state_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    manual_mode: Mapped[bool] = mapped_column(Boolean, default=False)
    irrigation_on: Mapped[bool] = mapped_column(Boolean, default=False)
    lights_on: Mapped[bool] = mapped_column(Boolean, default=False)
    reason: Mapped[str] = mapped_column(String(220))
    source: Mapped[str] = mapped_column(String(30), default="system")
    changed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
