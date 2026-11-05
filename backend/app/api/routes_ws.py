"""
ASTID WebSocket API Endpoint for Real-Time Streaming
Allows frontend clients to subscribe to live transaction decisions and toggle generator streams.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from backend.app.services.stream_manager import stream_manager

router = APIRouter(tags=["WebSocket Stream"])

@router.websocket("/ws/stream")
async def websocket_stream_endpoint(websocket: WebSocket):
    await stream_manager.connect(websocket)
    try:
        while True:
            # Listen for client control commands (e.g. pause, resume, speed)
            message_text = await websocket.receive_text()
            try:
                import json
                data = json.loads(message_text)
                action = data.get("action")
                if action == "START":
                    stream_manager.start_background_stream()
                elif action == "STOP":
                    stream_manager.stop_background_stream()
                elif action == "SET_INTERVAL":
                    interval = float(data.get("interval_seconds", 3.5))
                    stream_manager.interval_seconds = max(0.5, min(10.0, interval))

                # Acknowledge state back to client
                await websocket.send_json({
                    "type": "STREAM_STATUS",
                    "is_running": stream_manager.is_running,
                    "interval_seconds": stream_manager.interval_seconds,
                    "stats": stream_manager.stats,
                })
            except Exception as e:
                await websocket.send_json({"type": "ERROR", "message": str(e)})

    except WebSocketDisconnect:
        stream_manager.disconnect(websocket)
