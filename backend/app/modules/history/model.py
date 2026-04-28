from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from ...core.database import Base


class HistoryQueryLog(Base):
    __tablename__ = "history_query_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    granularity: Mapped[str] = mapped_column(String(12), index=True)
    start_date: Mapped[str] = mapped_column(String(12))
    end_date: Mapped[str] = mapped_column(String(12))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
