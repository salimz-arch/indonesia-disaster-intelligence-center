"""Unit test: event bus pub/sub + payload inserted_events."""
import asyncio

from app.realtime.bus import QUEUE_MAXSIZE, bus


async def test_bus_roundtrip():
    sub_id, queue = bus.subscribe()
    bus.publish("test.event", {"x": 1})
    item = await asyncio.wait_for(queue.get(), timeout=1)
    assert item == 'event: test.event\ndata: {"x": 1}\n\n'
    bus.unsubscribe(sub_id)
    assert bus.subscriber_count() == 0


async def test_bus_no_subscriber_is_noop():
    bus.publish("test.event", {"x": 1})  # tidak raise


async def test_bus_full_queue_drops_silently():
    sub_id, queue = bus.subscribe()
    for i in range(QUEUE_MAXSIZE + 50):  # melebihi kapasitas
        bus.publish("test.event", {"i": i})
    assert queue.qsize() <= QUEUE_MAXSIZE  # tidak meledak, tidak raise
    bus.unsubscribe(sub_id)
