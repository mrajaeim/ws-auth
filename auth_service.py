import os
from datetime import datetime, timedelta

from flask import Flask, jsonify, request
from flask_cors import CORS
import jwt

PORT = int(os.getenv("AUTH_PORT", 3000))
JWT_SECRET = os.getenv("JWT_SECRET", "your_super_secret_key")
ALGORITHM = "HS256"

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:3001,http://localhost:8080",
).split(",")

app = Flask(__name__)
CORS(app, origins=ALLOWED_ORIGINS, supports_credentials=True)

USERS = {
    "user1": "password123",
    "admin": "securepass",
}


@app.get("/")
def health_check():
    return "Main Auth Service is running."


@app.post("/login")
def login():
    payload = request.get_json() or {}
    username = payload.get("username")
    password = payload.get("password")

    if USERS.get(username) != password:
        return jsonify({"message": "Invalid credentials."}), 401

    token_payload = {
        "username": username,
        "userId": f"u_{username}",
        "exp": datetime.utcnow() + timedelta(hours=1),
    }
    token = jwt.encode(token_payload, JWT_SECRET, algorithm=ALGORITHM)

    response = jsonify({"message": "Login successful. Cookie set."})
    response.set_cookie(
        "auth_token",
        token,
        httponly=True,
        secure=False,
        samesite="Lax",
        max_age=3600,
        path="/",
    )
    app.logger.info("[AUTH] User %s logged in. Token issued.", username)
    return response


@app.post("/validate-token")
def validate_token():
    payload = request.get_json() or {}
    token = payload.get("token")

    if not token:
        return jsonify({"isAuthenticated": False, "reason": "No token provided"}), 401

    try:
        decoded = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        return (
            jsonify({"isAuthenticated": False, "reason": "Token expired"}),
            401,
        )
    except jwt.InvalidTokenError:
        return (
            jsonify({"isAuthenticated": False, "reason": "Invalid token"}),
            401,
        )

    app.logger.info("[AUTH] Token validated for user: %s", decoded.get("username"))
    return jsonify({"isAuthenticated": True, "user": decoded})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, debug=False)
