"""Canonical data source schema — untuk halaman Data Source Transparency."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DataSourceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    category: str
    status: str
    description: str | None
    last_success_at: datetime | None
    last_error: str | None
    refresh_seconds: int
    latency_ms: int | None
