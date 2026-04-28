from __future__ import annotations

from collections import defaultdict
from datetime import date, datetime, timezone

from sqlalchemy.orm import Session

from ..telemetry.model import SensorReading
from .model import TariffConfig
from .schemas import FinanceSummary, MonthlyCostPoint, TariffUpdate


def get_or_create_tariff(db: Session) -> TariffConfig:
    tariff = db.query(TariffConfig).first()
    if tariff:
        return tariff

    tariff = TariffConfig()
    db.add(tariff)
    db.commit()
    db.refresh(tariff)
    return tariff


def update_tariff(db: Session, payload: TariffUpdate) -> TariffConfig:
    tariff = get_or_create_tariff(db)
    tariff.water_cost_per_liter = payload.water_cost_per_liter
    tariff.energy_cost_per_kwh = payload.energy_cost_per_kwh
    tariff.currency = payload.currency
    db.add(tariff)
    db.commit()
    db.refresh(tariff)
    return tariff


def summarize_costs(
    db: Session,
    from_date: date,
    to_date: date,
) -> FinanceSummary:
    from_dt = datetime.combine(from_date, datetime.min.time()).replace(tzinfo=timezone.utc)
    to_dt = datetime.combine(to_date, datetime.max.time()).replace(tzinfo=timezone.utc)

    tariff = get_or_create_tariff(db)

    readings = (
        db.query(SensorReading)
        .filter(SensorReading.measured_at >= from_dt)
        .filter(SensorReading.measured_at <= to_dt)
        .order_by(SensorReading.measured_at.asc())
        .all()
    )

    total_water_liters = sum((item.water_liters or 0.0) for item in readings)
    total_energy_kwh = sum((item.energy_kwh or 0.0) for item in readings)

    water_cost = total_water_liters * tariff.water_cost_per_liter
    energy_cost = total_energy_kwh * tariff.energy_cost_per_kwh

    month_totals: dict[str, float] = defaultdict(float)
    for item in readings:
        bucket = item.measured_at.strftime("%Y-%m")
        month_totals[bucket] += (
            (item.water_liters or 0.0) * tariff.water_cost_per_liter
            + (item.energy_kwh or 0.0) * tariff.energy_cost_per_kwh
        )

    monthly_trend = [
        MonthlyCostPoint(bucket=bucket, total_cost=round(cost, 2))
        for bucket, cost in sorted(month_totals.items())
    ]

    return FinanceSummary(
        currency=tariff.currency,
        from_date=from_date,
        to_date=to_date,
        total_water_liters=round(total_water_liters, 2),
        total_energy_kwh=round(total_energy_kwh, 2),
        water_cost=round(water_cost, 2),
        energy_cost=round(energy_cost, 2),
        total_cost=round(water_cost + energy_cost, 2),
        monthly_trend=monthly_trend,
    )
