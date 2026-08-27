"""Asyncio event bus — pub/sub realtime, transport-agnostic.

publish() non-blocking: subscriber lambat (queue penuh) → event di-drop.
Realtime bersifat ephemeral — frontend resync semua query saat reconnect,
jadi event yang terlewap tergantikan oleh refetch, bukan hilang.
"""
import asyncio
import json
import logging

logger = logging.getLogger("app.realtime")

QUEUE_MAXSIZE = 100


class EventBus:
    """Setiap subscriber mendapat queue sendiri (isolasi slow-consumer)."""

    def __init__(self) -> None:
        self._queues: dict[int, asyncio.Queue[str]] = {}
        self._next_id = 1

    def subscribe(self) -> tuple[int, asyncio.Queue[str]]:
        sub_id = self._next_id
        self._next_id += 1
        queue: asyncio.Queue[str] = asyncio.Queue(maxsize=QUEUE_MAXSIZE)
        self._queues[sub_id] = queue
        return sub_id, queue

    def unsubscribe(self, sub_id: int) -> None:
        self._queues.pop(sub_id, None)

    def subscriber_count(self) -> int:
        return len(self._queues)

    def publish(self, event: str, data: object) -> None:
        """Broadcast event (format SSE siap kirim) ke semua subscriber."""
        payload = f"event: {event}\ndata: {json.dumps(data, default=str)}\n\n"
        dropped = 0
        for queue in list(self._queues.values()):
            try:
                queue.put_nowait(payload)
            except asyncio.QueueFull:
                dropped += 1
        if dropped:
            logger.warning(
                "realtime: %d subscriber penuh — event '%s' di-drop", dropped, event
            )


bus = EventBus()
