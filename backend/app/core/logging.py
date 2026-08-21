"""Structured JSON logging dengan masking secret.

Semua log diemit sebagai satu baris JSON. Secret (API key, token,
password) dimask sebelum meninggalkan proses — tidak pernah
bergantung pada disiplin "jangan log key" manual.
"""

import json
import logging
import re
import sys
from typing import Any

# Pola sensitif → diganti [REDACTED]
_KEY_VALUE = re.compile(
    r"(?i)(api[_-]?key|token|password|secret)([\"']?\s*[:=]\s*[\"']?)[^\s\"',]+"
)
_BEARER = re.compile(r"(?i)bearer\s+[A-Za-z0-9_\-\.]+")
_SK_KEY = re.compile(r"sk-[A-Za-z0-9_\-]{8,}")


def _mask(text: str) -> str:
    text = _KEY_VALUE.sub(r"\1\2[REDACTED]", text)
    text = _BEARER.sub("[REDACTED]", text)
    text = _SK_KEY.sub("[REDACTED]", text)
    return text


class JsonFormatter(logging.Formatter):
    """Format record menjadi satu baris JSON + mask."""

    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "ts": self.formatTime(record, "%Y-%m-%dT%H:%M:%S%z"),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if record.exc_info:
            payload["exc"] = self.formatException(record.exc_info)
        ctx = getattr(record, "ctx", None)
        if ctx:
            payload["ctx"] = ctx
        return _mask(json.dumps(payload, default=str, ensure_ascii=False))


def setup_logging(level: str = "INFO") -> None:
    """Pasang handler JSON di root logger — panggil sekali saat startup."""
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())
    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(level.upper())

    # Turunkan noise library pihak ketiga
    for noisy in ("httpx", "apscheduler", "urllib3"):
        logging.getLogger(noisy).setLevel(logging.WARNING)
