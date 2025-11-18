import asyncio
import json
import logging
import os
from typing import Any, Dict

import httpx
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import PlainTextResponse
import uvicorn

PORT = int(os.getenv("WS_PORT", 3001))
AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://localhost:3000")

app = FastAPI(title="WS Microservice")
logger = logging.getLogger("uvicorn.error")


@app.get("/")
async def health_check():
    return PlainTextResponse("WS Microservice is running.")


async def validate_token(token: str) -> Dict[str, Any]:
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.post(
            f"{AUTH_SERVICE_URL}/validate-token", json={"token": token}
        )

    if response.status_code != 200:
        raise ValueError("Token validation failed")

    data = response.json()
    if not data.get("isAuthenticated"):
        raise ValueError(data.get("reason", "Unauthenticated"))

    return data["user"]


async def _handle_ws_connection(websocket: WebSocket):
    cookies = websocket.cookies or {}
    auth_token = cookies.get("auth_token")

    if not auth_token:
        await websocket.close(code=4401)
        return

    try:
        user = await validate_token(auth_token)
    except Exception as exc:  # noqa: BLE001
        logger.error("[WS] Auth failed: %s", exc)
        await websocket.close(code=4401)
        return

    await websocket.accept()
    await websocket.send_json(
        {
            "type": "AUTH_SUCCESS",
            "message": f"Welcome, {user['username']}. You are authenticated via HttpOnly cookie.",
            "userId": user["userId"],
        }
    )
    logger.info(
        "[WS] New WebSocket connection established for user: %s (%s)",
        user["username"],
        user["userId"],
    )

    try:
        while True:
            payload = await websocket.receive_text()
            try:
                message = json.loads(payload)
            except json.JSONDecodeError:
                await websocket.send_json({"type": "ERROR", "message": "Invalid JSON payload"})
                continue

            if message.get("type") == "DATA_REQUEST":
                response_data = (
                    f"Private data stream for {user['username']} ({user['userId']}): "
                    f"{asyncio.get_running_loop().time()}"
                )
                await websocket.send_json({"type": "DATA_RESPONSE", "data": response_data})
                logger.info("[WS] Sent data response to %s", user["username"])
            else:
                await websocket.send_json(
                    {
                        "type": "ECHO",
                        "message": f"Echo from server: {message.get('content', payload)}",
                    }
                )
    except WebSocketDisconnect:
        logger.info("[WS] Connection closed for user: %s", user["username"])


@app.websocket("/")
async def websocket_root(websocket: WebSocket):
    await _handle_ws_connection(websocket)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await _handle_ws_connection(websocket)


if __name__ == "__main__":
    uvicorn.run("ws_microservice:app", host="0.0.0.0", port=PORT, reload=False)
