from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from ...core.database import Base


class TariffConfig(Base):
    __tablename__ = "tariff_config"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    water_cost_per_liter: Mapped[float] = mapped_column(Float, default=0.002)
    energy_cost_per_kwh: Mapped[float] = mapped_column(Float, default=0.26)
    currency: Mapped[str] = mapped_column(String(8), default="USD")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
