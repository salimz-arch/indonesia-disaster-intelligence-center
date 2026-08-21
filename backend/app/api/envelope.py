"""Envelope response konsisten untuk seluruh API (kontrak §35)."""
from datetime import UTC, datetime
from typing import Any


def ok(data: Any, source: str = "database") -> dict[str, Any]:
    return {
        "success": True,
        "timestamp": datetime.now(UTC).isoformat(),
        "source": source,
        "data": data,
    }


def fail(code: str, message: str) -> dict[str, Any]:
    return {
        "success": False,
        "timestamp": datetime.now(UTC).isoformat(),
        "error": {"code": code, "message": message},
    }
