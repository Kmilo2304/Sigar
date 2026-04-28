from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BASE_DIR / ".env")


class Settings(BaseModel):
    project_name: str = os.getenv("PROJECT_NAME", "SIGAR API")
    api_prefix: str = os.getenv("API_PREFIX", "/api")
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./sigar_local.db")
    app_timezone: str = os.getenv("APP_TIMEZONE", "America/Bogota")
    cors_origins: list[str] = ["*"]
    auto_simulation_enabled: bool = os.getenv("AUTO_SIMULATION_ENABLED", "true").lower() == "true"
    auto_simulation_interval_seconds: int = int(os.getenv("AUTO_SIMULATION_INTERVAL_SECONDS", "3600"))


@lru_cache
def get_settings() -> Settings:
    return Settings()
