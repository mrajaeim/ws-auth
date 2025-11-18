# WS Auth Demo (Node.js & Python)

A small multi-service playground featuring parallel implementations in **Node.js** and **Python**:

- **Auth HTTP API**: Issues JWT tokens inside `HttpOnly` cookies  
  (Node: `main.js` / Python: `auth_service.py`)
- **WebSocket microservice**: Validates the `auth_token` cookie before allowing a WebSocket connection  
  (Node: `ws-microservice.js` / Python: `ws_microservice.py`)
- **Static client server**: Serves the demo frontend  
  (Node: `server.js` / Python: `static_server.py`)

Use either stack depending on your preference or deployment target.

---

## Prerequisites

| Requirement       | Node.js Stack            | Python Stack                  |
|-------------------|--------------------------|-------------------------------|
| Runtime           | Node.js 18+ and npm      | Python 3.11+                  |
| Extras            | —                        | `venv` / `virtualenv` recommended |

---

## Installation

### Node.js

```bash
npm install
```

### Python

```bash
python -m venv .venv
.venv\Scripts\activate    # Windows
# source .venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
```

> 💡 **Note:** On macOS/Linux, use `source .venv/bin/activate` instead of `.venv\Scripts\activate`.

---

## Running the Services

Run each service from the project root in its own terminal (or as a background process).

| Service                   | Purpose                                      | Node.js Command             | Python Command                 |
|---------------------------|----------------------------------------------|-----------------------------|--------------------------------|
| Auth API (port 3000)      | Handles `/login` and `/validate-token`       | `node main.js`              | `python auth_service.py`       |
| WebSocket Microservice (port 3001) | Validates `auth_token` cookie before WS upgrade | `node ws-microservice.js`   | `python ws_microservice.py`    |
| Static Client Server (port 8080) | Serves `index.html` and static assets      | `node server.js`            | `python static_server.py`      |

> **💡 Tip:** Override default ports using environment variables:  
> - **Python**: `AUTH_PORT`, `WS_PORT`, `FRONT_PORT`  
> - **Node.js**: Edit the constants at the top of the respective files  
>  
> The Python WebSocket service also honors `AUTH_SERVICE_URL` to connect to a remote auth instance.

---

## Typical Flow

1. Visit `http://localhost:8080` and log in (demo users are defined in `main.js` / `auth_service.py`).
2. The Auth Service issues a JWT inside an `HttpOnly` cookie named `auth_token`.
3. The frontend initiates a WebSocket connection to `ws://localhost:3001`. The browser automatically includes the `auth_token` cookie in the upgrade request.
4. The WebSocket microservice validates the token by calling the Auth Service. If valid, the connection is finalized and user-specific data is streamed.

---

## Useful Notes

- Adjust `JWT_SECRET`, demo users, or allowed origins in the respective Auth service implementation.
- Ensure the WebSocket service can reach the Auth Service — update `AUTH_SERVICE_URL` if hosting services separately.
- For production:
  - Enable HTTPS
  - Set the `Secure` flag on cookies
  - Move secrets to environment variables
  - Replace the in-memory user store with persistent storage (e.g., database)
