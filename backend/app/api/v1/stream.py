"""Realtime SSE endpoint — GET /api/v1/stream (§17, §1.8).

Format: event: <nama>\\ndata: <json>\\n\\n
Events: hello, heartbeat (tiap 25s), earthquake.new, weather.update, source.status.
Klien disconnect → generator dibatalkan → unsubscribe (cleanup di finally).
"""
import asyncio
import json
import logging
from datetime import UTC, datetime

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.realtime.bus import bus

logger = logging.getLogger("app.api.stream")

router = APIRouter(tags=["realtime"])

HEARTBEAT_SECONDS = 25


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data, default=str)}\n\n"


@router.get("/stream")
async def stream() -> StreamingResponse:
    """Server-Sent Events — satu koneksi persist per klien."""

    async def event_generator():
        sub_id, queue = bus.subscribe()
        logger.info("sse client connected (total: %d)", bus.subscriber_count())
        try:
            yield _sse(
                "hello",
                {"clients": bus.subscriber_count(), "ts": datetime.now(UTC).isoformat()},
            )
            while True:
                try:
                    # Poll queue dengan timeout → heartbeat saat idle
                    item = await asyncio.wait_for(
                        queue.get(), timeout=HEARTBEAT_SECONDS
                    )
                    yield item
                except TimeoutError:
                    yield _sse("heartbeat", {"ts": datetime.now(UTC).isoformat()})
        finally:
            bus.unsubscribe(sub_id)
            logger.info(
                "sse client disconnected (total: %d)", bus.subscriber_count()
            )

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # nonaktifkan buffering proxy (nginx dkk.)
        },
    )
