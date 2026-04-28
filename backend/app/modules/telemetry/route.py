from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from ...core.database import get_db
from .schemas import (
    LightSensorReadingCreate,
    SensorReadingCreate,
    SensorReadingRead,
    WaterSensorReadingCreate,
)
from .service import create_light_reading, create_reading, create_water_reading, list_readings

router = APIRouter(prefix="/telemetry", tags=["telemetry"])


@router.post("/readings", response_model=SensorReadingRead, status_code=status.HTTP_201_CREATED)
def post_reading(payload: SensorReadingCreate, db: Session = Depends(get_db)) -> SensorReadingRead:
    return create_reading(db, payload)


@router.post("/light", response_model=SensorReadingRead, status_code=status.HTTP_201_CREATED)
def post_light_reading(payload: LightSensorReadingCreate, db: Session = Depends(get_db)) -> SensorReadingRead:
    return create_light_reading(db, payload)


@router.post("/water", response_model=SensorReadingRead, status_code=status.HTTP_201_CREATED)
def post_water_reading(payload: WaterSensorReadingCreate, db: Session = Depends(get_db)) -> SensorReadingRead:
    return create_water_reading(db, payload)


@router.get("/readings", response_model=list[SensorReadingRead])
def get_readings(
    limit: int = Query(default=50, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[SensorReadingRead]:
    return list_readings(db, limit)
