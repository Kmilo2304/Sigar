from __future__ import annotations

from collections import defaultdict
from datetime import date, datetime, timedelta, timezone

from sqlalchemy.orm import Session

from ..telemetry.model import SensorReading
from .model import HistoryQueryLog
from .schemas import ComparativeHistoryResponse, Granularity, HistoryPoint


def _bucket_key(value: datetime, granularity: Granularity) -> tuple[str, datetime]:
    if granularity == "year":
        label = value.strftime("%Y")
        ref = datetime(value.year, 1, 1, tzinfo=value.tzinfo)
        return label, ref

    if granularity == "quarter":
        quarter = ((value.month - 1) // 3) + 1
        label = f"Q{quarter}-{value.year}"
        ref = datetime(value.year, ((quarter - 1) * 3) + 1, 1, tzinfo=value.tzinfo)
        return label, ref

    if granularity == "month":
        label = value.strftime("%Y-%m")
        ref = datetime(value.year, value.month, 1, tzinfo=value.tzinfo)
        return label, ref

    if granularity == "week":
        iso_year, iso_week, _ = value.isocalendar()
        label = f"{iso_year}-W{iso_week:02d}"
        week_start = value - timedelta(days=value.weekday())
        ref = datetime(week_start.year, week_start.month, week_start.day, tzinfo=value.tzinfo)
        return label, ref

    if granularity == "day":
        label = value.strftime("%Y-%m-%d")
        ref = datetime(value.year, value.month, value.day, tzinfo=value.tzinfo)
        return label, ref

    label = value.strftime("%Y-%m-%d %H:00")
    ref = datetime(value.year, value.month, value.day, value.hour, tzinfo=value.tzinfo)
    return label, ref


def get_comparative_history(
    db: Session,
    granularity: Granularity,
    from_date: date,
    to_date: date,
) -> ComparativeHistoryResponse:
    from_dt = datetime.combine(from_date, datetime.min.time()).replace(tzinfo=timezone.utc)
    to_dt = datetime.combine(to_date, datetime.max.time()).replace(tzinfo=timezone.utc)

    readings = (
        db.query(SensorReading)
        .filter(SensorReading.measured_at >= from_dt)
        .filter(SensorReading.measured_at <= to_dt)
        .order_by(SensorReading.measured_at.asc())
        .all()
    )

    grouped: dict[str, dict[str, float | datetime]] = defaultdict(
        lambda: {"water_liters": 0.0, "energy_kwh": 0.0, "reference": None}
    )

    for reading in readings:
        label, reference = _bucket_key(reading.measured_at, granularity)
        grouped[label]["water_liters"] = float(grouped[label]["water_liters"]) + float(reading.water_liters or 0.0)
        grouped[label]["energy_kwh"] = float(grouped[label]["energy_kwh"]) + float(reading.energy_kwh or 0.0)
        current_ref = grouped[label]["reference"]
        if current_ref is None or reference < current_ref:
            grouped[label]["reference"] = reference

    points: list[HistoryPoint] = []
    for label, values in sorted(grouped.items(), key=lambda item: item[1]["reference"]):
        points.append(
            HistoryPoint(
                bucket=label,
                water_liters=round(float(values["water_liters"]), 2),
                energy_kwh=round(float(values["energy_kwh"]), 2),
            )
        )

    db.add(
        HistoryQueryLog(
            granularity=granularity,
            start_date=from_date.isoformat(),
            end_date=to_date.isoformat(),
        )
    )
    db.commit()

    return ComparativeHistoryResponse(
        granularity=granularity,
        from_date=from_date,
        to_date=to_date,
        points=points,
    )
