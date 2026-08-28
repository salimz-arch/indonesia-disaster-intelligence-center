"""Application settings — dimuat dari environment / file .env."""

from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ──
    app_name: str = "Indonesia Disaster Intelligence Center"
    environment: Literal["development", "production"] = "development"
    version: str = "0.1.0"
    log_level: str = "INFO"

    # ── CORS ──
    cors_origins: str = "http://localhost:3000"

    # ── Infrastructure ──
    database_url: str = "postgresql+asyncpg://idic:idic@127.0.0.1:5432/idic"
    redis_url: str = "redis://127.0.0.1:6379/0"

    # ── Data collection ──
    data_mode: Literal["live", "mock"] = "live"
    scheduler_enabled: bool = True
    earthquake_refresh_seconds: int = 60
    usgs_refresh_seconds: int = 300
    usgs_backfill_days: int = 7
    weather_refresh_seconds: int = 600

    # ── AI ──
    ai_provider: str = "mock"  # mock | gemini | openai
    gemini_api_key: str = ""
    gemini_model: str = "gemini-1.5-flash"
    openai_api_key: str = ""

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def is_dev(self) -> bool:
        return self.environment == "development"


@lru_cache
def get_settings() -> Settings:
    """Singleton settings — aman di-import di mana saja."""
    return Settings()
