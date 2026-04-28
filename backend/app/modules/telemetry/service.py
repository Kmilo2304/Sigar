from __future__ import annotations

from sqlalchemy.orm import Session

from ..dashboard.service import apply_automation, evaluate_alerts
from .model import SensorReading
from .schemas import LightSensorReadingCreate, SensorReadingCreate, WaterSensorReadingCreate


def create_reading(db: Session, payload: SensorReadingCreate) -> SensorReading:
    reading = SensorReading(
        measured_at=payload.measured_at,
        humidity=payload.humidity,
        lux=payload.lux,
        water_liters=payload.water_liters,
        energy_kwh=payload.energy_kwh,
        device_id=payload.device_id,
        raw_payload=payload.raw_payload,
    )
    db.add(reading)
    db.commit()
    db.refresh(reading)

    evaluate_alerts(db, reading)
    apply_automation(db, reading)
    return reading


def create_light_reading(db: Session, payload: LightSensorReadingCreate) -> SensorReading:
    reading = SensorReading(
        measured_at=payload.measured_at,
        lux=payload.lux,
        device_id=payload.device_id,
        raw_payload=payload.raw_payload,
    )
    db.add(reading)
    db.commit()
    db.refresh(reading)

    evaluate_alerts(db, reading)
    apply_automation(db, reading)
    return reading


def create_water_reading(db: Session, payload: WaterSensorReadingCreate) -> SensorReading:
    reading = SensorReading(
        measured_at=payload.measured_at,
        humidity=payload.humidity,
        water_liters=payload.water_liters,
        device_id=payload.device_id,
        raw_payload=payload.raw_payload,
    )
    db.add(reading)
    db.commit()
    db.refresh(reading)

    evaluate_alerts(db, reading)
    apply_automation(db, reading)
    return reading


def list_readings(db: Session, limit: int = 50) -> list[SensorReading]:
    return (
        db.query(SensorReading)
        .order_by(SensorReading.measured_at.desc())
        .limit(limit)
        .all()
    )
