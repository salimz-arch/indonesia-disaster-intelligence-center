"""Infrastruktur provider — HTTP client lifecycle, fetch+retry, ABC.

Provider = fetch & normalisasi ke canonical schema. TIDAK menyentuh DB.
"""
import asyncio
import logging
from abc import ABC, abstractmethod
from collections.abc import Sequence
from typing import Any, ClassVar, Protocol

import httpx

from app.core.exceptions import ProviderError
from app.schemas.earthquake import EarthquakeCreate
from app.schemas.observation import LocationObservation

logger = logging.getLogger("app.providers")

_client: httpx.AsyncClient | None = None


class LocationRef(Protocol):
    """Atribut lokasi yang dibutuhkan weather provider (dipenuhi ORM Location)."""

    id: int
    latitude: float
    longitude: float


def get_http_client() -> httpx.AsyncClient:
    """Client HTTP bersama — connection pooling, ditutup saat shutdown."""
    global _client
    if _client is None:
        _client = httpx.AsyncClient(
            timeout=httpx.Timeout(10.0, connect=5.0),
            limits=httpx.Limits(max_connections=20, max_keepalive_connections=10),
            headers={
                "User-Agent": "IDIC/0.1 (Indonesia disaster monitoring dashboard)"
            },
            follow_redirects=True,
        )
    return _client


async def close_http_client() -> None:
    global _client
    if _client is not None:
        await _client.aclose()
        _client = None


async def fetch_json(
    url: str,
    *,
    params: dict[str, Any] | None = None,
    attempts: int = 3,
    backoff_start: float = 0.5,
) -> Any:
    """GET + retry exponential backoff. HTTP 4xx = gagal permanen (tanpa retry)."""
    client = get_http_client()
    backoff = backoff_start
    last_error = ""
    for attempt in range(1, attempts + 1):
        try:
            resp = await client.get(url, params=params)
            if resp.status_code < 400:
                return resp.json()
            detail = resp.text[:200]
            if resp.status_code < 500:
                raise ProviderError(f"HTTP {resp.status_code} dari {url}: {detail}")
            last_error = f"HTTP {resp.status_code}: {detail}"
        except httpx.TransportError as exc:
            last_error = f"{exc.__class__.__name__}: {exc}"
        if attempt < attempts:
            logger.warning(
                "fetch %s gagal (%d/%d): %s — retry %.1fs",
                url, attempt, attempts, last_error, backoff,
            )
            await asyncio.sleep(backoff)
            backoff *= 2
    raise ProviderError(f"{url} gagal setelah {attempts} percobaan — {last_error}")


class BaseProvider(ABC):
    """Semua provider eksternal. name = nama registry di tabel data_sources."""

    name: ClassVar[str]


class EarthquakeProvider(BaseProvider):
    @abstractmethod
    async def fetch(self) -> list[EarthquakeCreate]:
        """Ambil & normalisasi event gempa terbaru."""


class WeatherProvider(BaseProvider):
    # Satu fetch bisa melaporkan status ke >1 data source
    source_names: ClassVar[tuple[str, ...]] = ()

    @abstractmethod
    async def fetch_batch(
        self, locations: Sequence[LocationRef]
    ) -> list[LocationObservation]:
        """Ambil observasi cuaca + rainfall untuk batch lokasi."""
