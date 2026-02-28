import asyncio
import json
from typing import Any


class EventBus:
    """In-process pub/sub for broadcasting SSE events to connected clients."""

    def __init__(self):
        self._subscribers: list[asyncio.Queue] = []

    async def publish(self, event_type: str, data: Any):
        payload = json.dumps({"event_type": event_type, "data": data})
        for queue in self._subscribers:
            await queue.put(payload)

    def subscribe(self) -> asyncio.Queue:
        queue: asyncio.Queue = asyncio.Queue()
        self._subscribers.append(queue)
        return queue

    def unsubscribe(self, queue: asyncio.Queue):
        self._subscribers.remove(queue)


event_bus = EventBus()
