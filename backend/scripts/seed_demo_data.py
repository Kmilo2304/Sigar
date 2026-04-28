from __future__ import annotations

import random
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))

from app.core.database import SessionLocal
from app.modules.telemetry.model import SensorReading


def seed_demo_data(days: int = 30, points_per_day: int = 4) -> None:
    db = SessionLocal()
    try:
        existing = db.query(SensorReading).count()
        if existing > 0:
            print(f"No se insertaron datos demo. Ya existen {existing} lecturas.")
            return

        now = datetime.now(timezone.utc)
        records: list[SensorReading] = []

        for day in range(days, -1, -1):
            for point in range(points_per_day):
                measured_at = now - timedelta(days=day, hours=(points_per_day - point) * 4)

                humidity = round(random.uniform(28, 76), 2)
                lux = round(random.uniform(90, 750), 2)
                water = round(random.uniform(40, 220), 2)
                energy = round(random.uniform(0.8, 4.8), 2)

                records.append(
                    SensorReading(
                        device_id="sensor-01",
                        measured_at=measured_at,
                        humidity=humidity,
                        lux=lux,
                        water_liters=water,
                        energy_kwh=energy,
                        raw_payload={
                            "humidity": humidity,
                            "lux": lux,
                            "water_liters": water,
                            "energy_kwh": energy,
                            "source": "seed_demo_data",
                        },
                    )
                )

        db.add_all(records)
        db.commit()
        print(f"Datos demo insertados: {len(records)} lecturas.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_demo_data()
