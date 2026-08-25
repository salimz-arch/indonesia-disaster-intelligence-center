"""Middleware penangkap exception tak tertangani → envelope error + header CORS.

PENTING: didaftarkan SETELAH CORSMiddleware → berada DI DALAM stack CORS,
sehingga response error tetap melewati CORSMiddleware dan browser dapat
membacanya (bukan "CORS Missing Allow Origin" palsu).

Pure-ASGI (bukan BaseHTTPMiddleware) agar aman untuk streaming SSE (Step 12).
"""
import logging
from datetime import UTC, datetime

from starlette.responses import JSONResponse
from starlette.types import ASGIApp, Receive, Scope, Send

logger = logging.getLogger("app.errors")


class ErrorHandlingMiddleware:
    """Tangkap exception endpoint (mis. DB timeout) → 503 + envelope."""

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        try:
            await self.app(scope, receive, send)
        except Exception:
            logger.exception(
                "unhandled error: %s %s", scope.get("method"), scope.get("path")
            )
            response = JSONResponse(
                status_code=503,
                content={
                    "success": False,
                    "timestamp": datetime.now(UTC).isoformat(),
                    "error": {
                        "code": "SERVICE_UNAVAILABLE",
                        "message": (
                            "Service temporarily unavailable — infrastruktur "
                            "database/cache tidak responsif. Cek: docker compose ps"
                        ),
                    },
                },
            )
            try:
                await response(scope, receive, send)
            except Exception:
                # response asli mungkin sudah terkirim sebagian — log saja
                logger.exception("gagal mengirim error envelope")