import asyncio
from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse

from app.event_bus import event_bus

router = APIRouter(prefix="/events", tags=["events"])


@router.get("/stream")
async def event_stream():
    """SSE endpoint for real-time pipeline updates."""
    queue = event_bus.subscribe()

    async def generate():
        try:
            while True:
                try:
                    data = await asyncio.wait_for(queue.get(), timeout=30.0)
                    yield {"data": data}
                except asyncio.TimeoutError:
                    yield {"event": "ping", "data": ""}
        except asyncio.CancelledError:
            event_bus.unsubscribe(queue)
            raise

    return EventSourceResponse(generate())
