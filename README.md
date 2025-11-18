# WS Auth Demo (Node.js & Python)

A small multi-service playground that has parallel implementations in **Node.js** and **Python**:

- **Auth HTTP API**: issues JWT tokens inside HttpOnly cookies (Node: `main.js` / Python: `auth_service.py`).
- **WebSocket microservice**: validates the cookie before allowing a socket connection (Node: `ws-microservice.js` / Python: `ws_microservice.py`).
- **Static client server**: serves the demo front-end (Node: `server.js` / Python: `static_server.py`).

Use either stack depending on your preferences or deployment target.

## Prerequisites

| Requirement | Node.js stack | Python stack |
|-------------|---------------|--------------|
| Runtime     | Node.js 18+ and npm | Python 3.11+ |
| Extras      | — | `venv`/`virtualenv` recommended |

## Installation

| Step | Node.js | Python |
|------|---------|--------|
| Install deps | `npm install` | ```
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
``` |

## Running the services

Run each service from the project root in its own terminal (or background task).

| Service | Purpose | Node.js command | Python command |
|---------|---------|-----------------|-----------------|
| Auth API (port 3000) | Handles `/login` + `/validate-token` | `node main.js` | `python auth_service.py` |
| WebSocket microservice (port 3001) | Validates `auth_token` cookie before WS upgrade | `node ws-microservice.js` | `python ws_microservice.py` |
| Static client server (port 8080) | Serves `index.html` and assets | `node server.js` | `python static_server.py` |

> **Tip:** Override default ports via `AUTH_PORT`, `WS_PORT`, and `FRONT_PORT` (Python) or by editing the constants at the top of the Node files. `ws_microservice.py` also honors `AUTH_SERVICE_URL` for remote auth instances.

## Typical Flow

1. Visit `http://localhost:8080` and log in (demo users are defined in `main.js` / `auth_service.py`).
2. The Auth Service issues a JWT inside an HttpOnly cookie named `auth_token`.
3. The front-end initiates a WebSocket connection to `ws://localhost:3001`. During the upgrade request, the cookie is forwarded automatically.
4. The WS microservice validates the token via the Auth Service. If valid, it finalizes the connection and streams user-specific data.

## Useful Notes

- Adjust `JWT_SECRET`, demo users, or allowed origins in the respective Auth service implementation.
- Ensure both auth and WebSocket services can reach each other (update the `AUTH_SERVICE_URL` constant/env var if hosting separately).
- For production: enable HTTPS, set `secure` cookies, move secrets to environment variables, and add persistent storage instead of the demo in-memory user store.
