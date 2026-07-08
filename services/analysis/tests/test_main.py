import io

import numpy as np
from fastapi.testclient import TestClient
from PIL import Image

from app.main import app

client = TestClient(app)

SAMPLE_SVG = b"""<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50">
  <path d="M0 0 L50 50" fill="red"/>
</svg>"""


def _sample_png_bytes() -> bytes:
    arr = np.zeros((32, 32, 4), dtype=np.uint8)
    arr[8:24, 8:24] = (200, 30, 30, 255)
    buf = io.BytesIO()
    Image.fromarray(arr, mode="RGBA").save(buf, format="PNG")
    return buf.getvalue()


def test_health() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_analyze_raster_png() -> None:
    response = client.post(
        "/analyze",
        files={"file": ("logo.png", _sample_png_bytes(), "image/png")},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["filename"] == "logo.png"
    assert body["kind"] == "raster"
    assert body["width"] == 32
    assert body["height"] == 32
    assert body["has_transparency"] is True
    assert len(body["palette"]) >= 1
    assert body["palette"][0]["rgb"] == [200, 30, 30]
    assert body["vector_structure"] is None
    assert "16" in body["scalability"]["by_size"]


def test_analyze_svg() -> None:
    response = client.post(
        "/analyze",
        files={"file": ("logo.svg", SAMPLE_SVG, "image/svg+xml")},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["kind"] == "vector"
    assert body["vector_structure"]["path_count"] == 1


def test_analyze_rejects_unsupported_content_type() -> None:
    response = client.post(
        "/analyze",
        files={"file": ("logo.txt", b"not an image", "text/plain")},
    )
    assert response.status_code == 400


def test_analyze_rejects_corrupt_image() -> None:
    response = client.post(
        "/analyze",
        files={"file": ("logo.png", b"not actually a png", "image/png")},
    )
    assert response.status_code == 400
