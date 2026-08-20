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

    # ── CORS (comma-separated origins) ──
    cors_origins: str = "http://localhost:3000"

    # ── Infrastructure ──
    database_url: str = "sqlite+aiosqlite:///./idic.db"
    redis_url: str = "redis://localhost:6379/0"

    # ── Data collection intervals (detik) ──
    earthquake_refresh_seconds: int = 60
    weather_refresh_seconds: int = 600
    rainfall_refresh_seconds: int = 900

    # ── AI ──
    ai_provider: str = "mock"  # mock | gemini | openai
    gemini_api_key: str = ""
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
