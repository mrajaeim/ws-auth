import os
from pathlib import Path

from flask import Flask, send_from_directory

PORT = int(os.getenv("FRONT_PORT", 8080))
BASE_DIR = Path(__file__).resolve().parent

app = Flask(
    __name__,
    static_folder=str(BASE_DIR),
    static_url_path="",
)


@app.route("/", defaults={"path": "index.html"})
@app.route("/<path:path>")
def serve_static(path):
    target = Path(path)
    if target.is_dir():
        target = target / "index.html"
    return send_from_directory(BASE_DIR, target)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT)
