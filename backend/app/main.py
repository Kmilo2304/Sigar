from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.database import Base, SessionLocal, engine
from .core.settings import get_settings
from .modules.auth.route import router as auth_router
from .modules.configuration.route import router as configuration_router
from .modules.configuration.service import ensure_configuration_columns, get_or_create_config
from .modules.dashboard.route import router as dashboard_router
from .modules.dashboard.service import ensure_system_state_columns
from .modules.finance.route import router as finance_router
from .modules.finance.service import get_or_create_tariff
from .modules.history.route import router as history_router
from .modules.telemetry.route import router as telemetry_router
from .modules.users.route import router as users_router
from .modules.users.service import ensure_default_user
from .modules.simulation import run_auto_sensor_simulation

# Import models so SQLAlchemy can build all tables.
from .modules import (  # noqa: F401
    auth,
    configuration,
    dashboard,
    finance,
    history,
    telemetry,
    users,
)

settings = get_settings()

Base.metadata.create_all(bind=engine)


def bootstrap_seed_data() -> None:
    ensure_configuration_columns()
    ensure_system_state_columns()
    db = SessionLocal()
    try:
        ensure_default_user(db)
        get_or_create_config(db)
        get_or_create_tariff(db)
    finally:
        db.close()


bootstrap_seed_data()

@asynccontextmanager
async def lifespan(_: FastAPI):
    stop_event = asyncio.Event()
    task: asyncio.Task[None] | None = None

    if settings.auto_simulation_enabled:
        task = asyncio.create_task(
            run_auto_sensor_simulation(
                stop_event=stop_event,
                interval_seconds=settings.auto_simulation_interval_seconds,
            ),
        )

    try:
        yield
    finally:
        stop_event.set()
        if task:
            await task


app = FastAPI(title=settings.project_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix=settings.api_prefix)
app.include_router(users_router, prefix=settings.api_prefix)
app.include_router(configuration_router, prefix=settings.api_prefix)
app.include_router(telemetry_router, prefix=settings.api_prefix)
app.include_router(dashboard_router, prefix=settings.api_prefix)
app.include_router(history_router, prefix=settings.api_prefix)
app.include_router(finance_router, prefix=settings.api_prefix)


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}
