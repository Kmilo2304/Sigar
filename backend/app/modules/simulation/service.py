from __future__ import annotations

import asyncio
import random
from datetime import datetime, timezone

from ...core.database import SessionLocal
from ..telemetry.schemas import SensorReadingCreate
from ..telemetry.service import create_reading


def _random_sensor_id() -> str:
    return str(random.randint(1, 5))


def _inject_once() -> None:
    db = SessionLocal()
    try:
        measured_at = datetime.now(timezone.utc)
        light_sensor_id = _random_sensor_id()
        humidity_sensor_id = _random_sensor_id()
        create_reading(
            db,
            SensorReadingCreate(
                device_id=_random_sensor_id(),
                measured_at=measured_at,
                lux=float(random.randint(0, 1000)),
                humidity=float(random.randint(0, 100)),
                raw_payload={
                    "source": "backend_auto_simulation",
                    "light_sensor_id": light_sensor_id,
                    "humidity_sensor_id": humidity_sensor_id,
                },
            ),
        )
    finally:
        db.close()


async def run_auto_sensor_simulation(stop_event: asyncio.Event, interval_seconds: int = 3600) -> None:
    # Inyección inicial al arrancar para generar datos rápidamente.
    _inject_once()

    while not stop_event.is_set():
        try:
            await asyncio.wait_for(stop_event.wait(), timeout=interval_seconds)
            break
        except asyncio.TimeoutError:
            _inject_once()
