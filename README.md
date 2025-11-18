# WS Auth Demo

A small multi-service Node.js playground that demonstrates:

- an **Auth HTTP API** (Express, port 3000) issuing JWT tokens inside HttpOnly cookies
- a **WebSocket microservice** (Express + `ws`, port 3001) that validates those cookies before allowing a socket connection
- a simple **static client server** (Express, port 8080) that serves the demo front-end files (e.g., `index.html`)

## Prerequisites

- [Node.js 18+](https://nodejs.org/) and npm

## Installation

From the project root:

```bash
npm install
```

## Running the services

Open three terminals (or run the commands in the background) from the project root.

### 1. Auth Service (HTTP, port 3000)

Handles `/login` and `/validate-token`.

```bash
npm run start:main
```

### 2. WebSocket Microservice (port 3001)

Upgrades incoming connections, reads the `auth_token` cookie, and calls the Auth Service to validate it before finalizing the WS handshake.

```bash
npm run start:ws
```

### 3. Client Server (static files, port 8080)

Serves the browser demo assets from the repository root.

```bash
npm run start:front
```

## Typical Flow

1. Visit `http://localhost:8080` and log in (the demo users are defined in `main.js`).
2. The Auth Service issues a JWT inside an HttpOnly cookie named `auth_token`.
3. The front-end initiates a WebSocket connection to `ws://localhost:3001`. During the upgrade request, the cookie is forwarded.
4. The WS microservice validates the token via the Auth Service. If valid, it finalizes the connection and streams user-specific data.

## Useful Notes

- Update `JWT_SECRET` or user credentials in `main.js` as needed for your environment.
- Ensure all services run on the same machine (or configure `AUTH_SERVICE_URL` inside `ws-microservice.js`).
- For production, enable HTTPS and set secure cookie flags appropriately.
