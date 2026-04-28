from __future__ import annotations

import random
from datetime import datetime, timedelta
from datetime import timezone
from zoneinfo import ZoneInfo

from sqlalchemy import text
from sqlalchemy.orm import Session

from ...core.database import engine
from ...core.settings import get_settings
from ..configuration.service import get_or_create_config
from ..telemetry.model import SensorReading
from .model import AlertEvent, SystemCycle, SystemState, SystemStateLog
from .schemas import DashboardSummary


MAX_DAILY_WATER = 500.0
LOCAL_TZ = ZoneInfo(get_settings().app_timezone)


def _create_alert(db: Session, reading_id: int | None, level: str, title: str, message: str) -> None:
    alert = AlertEvent(
        sensor_reading_id=reading_id,
        level=level,
        title=title,
        message=message,
    )
    db.add(alert)


def evaluate_alerts(db: Session, reading: SensorReading) -> None:
    config = get_or_create_config(db)
    created = False

    if reading.humidity is not None and reading.humidity < config.humidity_on_min:
        _create_alert(
            db,
            reading.id,
            "warning",
            "Humedad baja",
            f"Se detecto humedad en {reading.humidity:.1f}% por debajo del minimo {config.humidity_on_min:.1f}%.",
        )
        created = True

    if reading.humidity is not None and reading.humidity > config.humidity_off_max:
        _create_alert(
            db,
            reading.id,
            "warning",
            "Humedad alta",
            f"Se detecto humedad en {reading.humidity:.1f}% por encima del maximo {config.humidity_off_max:.1f}%.",
        )
        created = True

    if reading.lux is not None and reading.lux < config.lux_on_min:
        _create_alert(
            db,
            reading.id,
            "info",
            "Luz insuficiente",
            f"Luxometria actual {reading.lux:.1f} lx por debajo del umbral {config.lux_on_min:.1f} lx.",
        )
        created = True

    if reading.lux is not None and reading.lux > config.lux_off_max:
        _create_alert(
            db,
            reading.id,
            "info",
            "Luz alta",
            f"Luxometria actual {reading.lux:.1f} lx por encima del umbral {config.lux_off_max:.1f} lx.",
        )
        created = True

    if reading.water_liters is not None and reading.water_liters > MAX_DAILY_WATER:
        _create_alert(
            db,
            reading.id,
            "critical",
            "Consumo de agua elevado",
            f"Consumo reportado {reading.water_liters:.1f} L supera limite sugerido {MAX_DAILY_WATER:.1f} L.",
        )
        created = True

    if created:
        db.commit()


def get_or_create_system_state(db: Session) -> SystemState:
    state = db.query(SystemState).first()
    if state:
        return state

    state = SystemState(id=1, irrigation_on=False, lights_on=False, last_reason="Inicializacion")
    db.add(state)
    db.commit()
    db.refresh(state)
    return state


def _save_state(db: Session, state: SystemState) -> None:
    db.add(state)
    db.commit()
    db.refresh(state)


def _append_state_log(db: Session, state: SystemState, reason: str, source: str) -> None:
    db.add(
        SystemStateLog(
            manual_mode=state.manual_mode,
            irrigation_on=state.irrigation_on,
            lights_on=state.lights_on,
            reason=reason[:220],
            source=source,
        )
    )


def ensure_system_state_columns() -> None:
    # Backward compatible patch if table existed before adding sensor/schedule flags.
    statements = [
        "ALTER TABLE system_state ADD COLUMN IF NOT EXISTS manual_mode BOOLEAN DEFAULT FALSE",
        "ALTER TABLE system_state ADD COLUMN IF NOT EXISTS irrigation_sensor_on BOOLEAN DEFAULT FALSE",
        "ALTER TABLE system_state ADD COLUMN IF NOT EXISTS lights_sensor_on BOOLEAN DEFAULT FALSE",
    ]
    with engine.begin() as connection:
        for sql in statements:
            connection.execute(text(sql))


def _is_time_between(start_hhmm: str, end_hhmm: str, now_hhmm: str) -> bool:
    if start_hhmm <= end_hhmm:
        return start_hhmm <= now_hhmm < end_hhmm
    return now_hhmm >= start_hhmm or now_hhmm < end_hhmm


def _open_cycle(db: Session, system: str, trigger_source: str) -> None:
    existing = (
        db.query(SystemCycle)
        .filter(SystemCycle.system == system)
        .filter(SystemCycle.status == "open")
        .first()
    )
    if existing:
        return

    cycle = SystemCycle(
        system=system,
        trigger_source=trigger_source,
        started_at=datetime.now(timezone.utc),
        unit="liters" if system == "irrigation" else "kwh",
        status="open",
    )
    db.add(cycle)
    db.commit()


def _close_cycle_with_consumption(db: Session, system: str) -> float:
    cycle = (
        db.query(SystemCycle)
        .filter(SystemCycle.system == system)
        .filter(SystemCycle.status == "open")
        .order_by(SystemCycle.started_at.desc())
        .first()
    )

    consumption = float(random.randint(1, 100))
    now_utc = datetime.now(timezone.utc)

    latest_humidity = (
        db.query(SensorReading.humidity)
        .filter(SensorReading.humidity.is_not(None))
        .order_by(SensorReading.measured_at.desc())
        .limit(1)
        .scalar()
    )
    latest_lux = (
        db.query(SensorReading.lux)
        .filter(SensorReading.lux.is_not(None))
        .order_by(SensorReading.measured_at.desc())
        .limit(1)
        .scalar()
    )

    if cycle:
        cycle.ended_at = now_utc
        cycle.status = "closed"
        cycle.consumption_value = consumption
        db.add(cycle)
        db.commit()

    reading = SensorReading(
        device_id=str(random.randint(1, 5)),
        measured_at=now_utc,
        humidity=float(latest_humidity) if latest_humidity is not None else None,
        lux=float(latest_lux) if latest_lux is not None else None,
        water_liters=consumption if system == "irrigation" else None,
        energy_kwh=consumption if system == "lights" else None,
        raw_payload={
            "source": "system_cycle_close",
            "system": system,
            "consumption_generated": consumption,
            "snapshot_humidity": float(latest_humidity) if latest_humidity is not None else None,
            "snapshot_lux": float(latest_lux) if latest_lux is not None else None,
        },
    )
    db.add(reading)
    db.commit()
    return consumption


def refresh_state_by_schedule(db: Session) -> SystemState:
    config = get_or_create_config(db)
    state = get_or_create_system_state(db)
    if bool(getattr(state, "manual_mode", False)):
        return state
    now_local = datetime.now(LOCAL_TZ).strftime("%H:%M")

    irrigation_schedule_on = _is_time_between(config.irrigation_start, config.irrigation_end, now_local)
    lights_schedule_on = _is_time_between(config.lights_start, config.lights_end, now_local)

    # Final state is OR between schedule and sensor-trigger state.
    irrigation_sensor_on = bool(getattr(state, "irrigation_sensor_on", False))
    lights_sensor_on = bool(getattr(state, "lights_sensor_on", False))
    next_irrigation = irrigation_schedule_on or irrigation_sensor_on
    next_lights = lights_schedule_on or lights_sensor_on

    changed = (state.irrigation_on != next_irrigation) or (state.lights_on != next_lights)
    if changed:
        reasons: list[str] = []
        prev_irrigation = state.irrigation_on
        prev_lights = state.lights_on

        if not prev_irrigation and next_irrigation:
            source = "horario" if irrigation_schedule_on else "sensor"
            _open_cycle(db, "irrigation", source)
            _create_alert(db, None, "info", "Riego encendido", f"Riego encendido por {source}.")

        if prev_irrigation and not next_irrigation:
            consumption = _close_cycle_with_consumption(db, "irrigation")
            _create_alert(db, None, "info", "Riego apagado", f"Riego apagado. Consumo del ciclo: {consumption:.1f} litros.")

        if not prev_lights and next_lights:
            source = "horario" if lights_schedule_on else "sensor"
            _open_cycle(db, "lights", source)
            _create_alert(db, None, "info", "Luces encendidas", f"Luces encendidas por {source}.")

        if prev_lights and not next_lights:
            consumption = _close_cycle_with_consumption(db, "lights")
            _create_alert(db, None, "info", "Luces apagadas", f"Luces apagadas. Consumo del ciclo: {consumption:.1f} kWh.")

        if irrigation_schedule_on:
            reasons.append("Riego encendido por horario")
        elif irrigation_sensor_on:
            reasons.append("Riego encendido por sensor")
        else:
            reasons.append("Riego apagado (fuera de horario y sin disparo de sensor)")

        if lights_schedule_on:
            reasons.append("Luces encendidas por horario")
        elif lights_sensor_on:
            reasons.append("Luces encendidas por sensor")
        else:
            reasons.append("Luces apagadas (fuera de horario y sin disparo de sensor)")

        state.irrigation_on = next_irrigation
        state.lights_on = next_lights
        state.last_reason = "; ".join(reasons)
        _append_state_log(db, state, state.last_reason, "schedule")
        db.add(state)
        db.commit()
        db.refresh(state)

    return state


def apply_automation(db: Session, reading: SensorReading) -> SystemState:
    config = get_or_create_config(db)
    state = get_or_create_system_state(db)
    if bool(getattr(state, "manual_mode", False)):
        return state
    changed = False
    reasons: list[str] = []

    if reading.humidity is not None:
        next_irrigation_sensor_on = config.humidity_on_min <= reading.humidity <= config.humidity_off_max
        prev_irrigation_sensor_on = bool(getattr(state, "irrigation_sensor_on", False))
        if next_irrigation_sensor_on != prev_irrigation_sensor_on:
            state.irrigation_sensor_on = next_irrigation_sensor_on
            reasons.append(
                f"Riego {'encendido' if next_irrigation_sensor_on else 'apagado'} por humedad {reading.humidity:.1f}% (rango {config.humidity_on_min:.1f}% - {config.humidity_off_max:.1f}%)."
            )
            _create_alert(
                db,
                reading.id,
                "info",
                f"Riego {'encendido' if next_irrigation_sensor_on else 'apagado'} automatico",
                f"Humedad {reading.humidity:.1f}% {'dentro' if next_irrigation_sensor_on else 'fuera'} del rango {config.humidity_on_min:.1f}% - {config.humidity_off_max:.1f}%.",
            )
            changed = True

    if reading.lux is not None:
        next_lights_sensor_on = config.lux_on_min <= reading.lux <= config.lux_off_max
        prev_lights_sensor_on = bool(getattr(state, "lights_sensor_on", False))
        if next_lights_sensor_on != prev_lights_sensor_on:
            state.lights_sensor_on = next_lights_sensor_on
            reasons.append(
                f"Luces {'encendidas' if next_lights_sensor_on else 'apagadas'} por lux {reading.lux:.1f} (rango {config.lux_on_min:.1f} - {config.lux_off_max:.1f})."
            )
            _create_alert(
                db,
                reading.id,
                "info",
                f"Luces {'encendidas' if next_lights_sensor_on else 'apagadas'} automatico",
                f"Lux {reading.lux:.1f} {'dentro' if next_lights_sensor_on else 'fuera'} del rango {config.lux_on_min:.1f} - {config.lux_off_max:.1f}.",
            )
            changed = True

    if changed:
        state.last_reason = "; ".join(reasons)
        _save_state(db, state)

    return refresh_state_by_schedule(db)


def set_control_mode(db: Session, mode: str) -> SystemState:
    state = get_or_create_system_state(db)
    state.manual_mode = mode == "manual"
    state.last_reason = "Control manual activado" if state.manual_mode else "Control automatico activado"
    _append_state_log(db, state, state.last_reason, "mode")
    db.add(state)
    db.commit()
    db.refresh(state)
    if not state.manual_mode:
        return refresh_state_by_schedule(db)
    return state


def set_manual_system_state(db: Session, system: str, action: str) -> SystemState:
    state = get_or_create_system_state(db)
    if not state.manual_mode:
        return state

    is_on = action == "on"
    now_reason = "manual"

    if system == "irrigation":
        if is_on and not state.irrigation_on:
            _open_cycle(db, "irrigation", now_reason)
            _create_alert(db, None, "info", "Riego encendido", "Riego encendido manualmente.")
        if not is_on and state.irrigation_on:
            consumption = _close_cycle_with_consumption(db, "irrigation")
            _create_alert(db, None, "info", "Riego apagado", f"Riego apagado manualmente. Consumo: {consumption:.1f} litros.")
        state.irrigation_on = is_on
        state.irrigation_sensor_on = False

    if system == "lights":
        if is_on and not state.lights_on:
            _open_cycle(db, "lights", now_reason)
            _create_alert(db, None, "info", "Luces encendidas", "Luces encendidas manualmente.")
        if not is_on and state.lights_on:
            consumption = _close_cycle_with_consumption(db, "lights")
            _create_alert(db, None, "info", "Luces apagadas", f"Luces apagadas manualmente. Consumo: {consumption:.1f} kWh.")
        state.lights_on = is_on
        state.lights_sensor_on = False

    state.last_reason = f"Cambio manual: {system} {'encendido' if is_on else 'apagado'}"
    _append_state_log(db, state, state.last_reason, "manual")
    db.add(state)
    db.commit()
    db.refresh(state)
    return state


def list_alerts(db: Session, limit: int = 20) -> list[AlertEvent]:
    return (
        db.query(AlertEvent)
        .order_by(AlertEvent.created_at.desc())
        .limit(limit)
        .all()
    )


def resolve_alert(db: Session, alert_id: int) -> AlertEvent | None:
    alert = db.query(AlertEvent).filter(AlertEvent.id == alert_id).first()
    if not alert:
        return None

    alert.resolved = True
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


def build_summary(db: Session) -> DashboardSummary:
    latest = (
        db.query(SensorReading)
        .order_by(SensorReading.measured_at.desc())
        .first()
    )
    active_alerts = db.query(AlertEvent).filter(AlertEvent.resolved.is_(False)).count()
    state = refresh_state_by_schedule(db)

    now_local = datetime.now(LOCAL_TZ)
    start_local = now_local.replace(hour=0, minute=0, second=0, microsecond=0)
    end_local = start_local + timedelta(days=1)
    start_utc = start_local.astimezone(timezone.utc)
    end_utc = end_local.astimezone(timezone.utc)

    today_readings = (
        db.query(SensorReading)
        .filter(SensorReading.measured_at >= start_utc)
        .filter(SensorReading.measured_at < end_utc)
        .all()
    )
    today_water_liters = sum(item.water_liters or 0.0 for item in today_readings)
    today_energy_kwh = sum(item.energy_kwh or 0.0 for item in today_readings)

    if not latest:
        return DashboardSummary(
            humidity=None,
            lux=None,
            water_liters=round(today_water_liters, 2),
            energy_kwh=round(today_energy_kwh, 2),
            measured_at=None,
            active_alerts=active_alerts,
            manual_mode=state.manual_mode,
            irrigation_on=state.irrigation_on,
            lights_on=state.lights_on,
        )

    return DashboardSummary(
        humidity=latest.humidity,
        lux=latest.lux,
        water_liters=round(today_water_liters, 2),
        energy_kwh=round(today_energy_kwh, 2),
        measured_at=latest.measured_at,
        active_alerts=active_alerts,
        manual_mode=state.manual_mode,
        irrigation_on=state.irrigation_on,
        lights_on=state.lights_on,
    )
