from __future__ import annotations

from datetime import date

from sqlalchemy import text
from sqlalchemy.orm import Session

from ...core.database import engine
from .model import MonthlyTariffConfig, ScheduleConfig
from .schemas import MonthlyTariffUpdate, ScheduleConfigUpdate


def ensure_configuration_columns() -> None:
    """Lightweight schema patching for environments without migrations."""
    statements = [
        "ALTER TABLE schedule_config ADD COLUMN IF NOT EXISTS lux_on_min DOUBLE PRECISION DEFAULT 120.0",
        "ALTER TABLE schedule_config ADD COLUMN IF NOT EXISTS lux_off_max DOUBLE PRECISION DEFAULT 500.0",
        "ALTER TABLE schedule_config ADD COLUMN IF NOT EXISTS humidity_on_min DOUBLE PRECISION DEFAULT 25.0",
        "ALTER TABLE schedule_config ADD COLUMN IF NOT EXISTS humidity_off_max DOUBLE PRECISION DEFAULT 80.0",
        "ALTER TABLE schedule_config DROP COLUMN IF EXISTS active_days",
        "ALTER TABLE schedule_config DROP COLUMN IF EXISTS auto_mode",
        "ALTER TABLE monthly_tariff_config DROP COLUMN IF EXISTS currency",
    ]

    with engine.begin() as connection:
        for sql in statements:
            connection.execute(text(sql))


def get_or_create_config(db: Session) -> ScheduleConfig:
    config = db.query(ScheduleConfig).first()
    if config:
        return config

    config = ScheduleConfig()
    db.add(config)
    db.commit()
    db.refresh(config)
    return config


def update_config(db: Session, payload: ScheduleConfigUpdate) -> ScheduleConfig:
    config = get_or_create_config(db)
    config.irrigation_start = payload.irrigation_start
    config.irrigation_end = payload.irrigation_end
    config.lights_start = payload.lights_start
    config.lights_end = payload.lights_end
    config.lux_on_min = payload.lux_on_min
    config.lux_off_max = payload.lux_off_max
    config.humidity_on_min = payload.humidity_on_min
    config.humidity_off_max = payload.humidity_off_max

    db.add(config)
    db.commit()
    db.refresh(config)
    return config


def get_or_create_monthly_tariff(db: Session, year: int, month: int) -> MonthlyTariffConfig:
    tariff = (
        db.query(MonthlyTariffConfig)
        .filter(MonthlyTariffConfig.year == year)
        .filter(MonthlyTariffConfig.month == month)
        .first()
    )
    if tariff:
        return tariff

    tariff = MonthlyTariffConfig(
        year=year,
        month=month,
    )
    db.add(tariff)
    db.commit()
    db.refresh(tariff)
    return tariff


def get_monthly_tariff(db: Session, year: int | None = None, month: int | None = None) -> MonthlyTariffConfig:
    today = date.today()
    selected_year = year or today.year
    selected_month = month or today.month
    return get_or_create_monthly_tariff(db, selected_year, selected_month)


def upsert_monthly_tariff(db: Session, payload: MonthlyTariffUpdate) -> MonthlyTariffConfig:
    tariff = get_or_create_monthly_tariff(db, payload.year, payload.month)
    tariff.water_cost_per_m3 = payload.water_cost_per_m3
    tariff.energy_cost_per_kwh = payload.energy_cost_per_kwh
    db.add(tariff)
    db.commit()
    db.refresh(tariff)
    return tariff
