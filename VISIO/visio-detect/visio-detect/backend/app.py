"""
VISIO Detect — Backend API
FastAPI + YOLOv8 object detection service.

POST /detect  → accepts base64 image, returns detections as JSON
GET  /health  → liveness check for deployment platforms
"""

import base64
import io
import logging
import os
import time
from contextlib import asynccontextmanager
from typing import List

import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from pydantic import BaseModel

# 🔥 FINAL FIX (important)
import torch

_original_torch_load = torch.load
def patched_load(*args, **kwargs):
    kwargs["weights_only"] = False
    return _original_torch_load(*args, **kwargs)

torch.load = patched_load

# 👇 normal import
from ultralytics import YOLO

# ─── Logging ─────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("visio")

# ─── Global model (loaded once at startup) ────────────────────────────────────
_model: YOLO | None = None

MODEL_PATH = os.getenv("YOLO_MODEL", "yolov8n.pt")  # override via env var
CONF_DEFAULT = float(os.getenv("CONF_THRESHOLD", "0.40"))


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load the YOLO model before the server starts accepting requests."""
    global _model
    log.info(f"Loading YOLO model: {MODEL_PATH}")
    _model = YOLO(MODEL_PATH)
    # Warm-up inference so the first real request isn't slow
    dummy = np.zeros((640, 640, 3), dtype=np.uint8)
    _model(dummy, verbose=False)
    log.info("Model ready ✓")
    yield
    log.info("Shutting down.")


# ─── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="VISIO Detect API",
    description="YOLOv8 real-time object detection via REST",
    version="2.0.0",
    lifespan=lifespan,
)

# Allow any origin during development; tighten in production by listing
# only your Netlify URL, e.g. ["https://your-app.netlify.app"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"],
)


# ─── Schemas ──────────────────────────────────────────────────────────────────
class DetectRequest(BaseModel):
    image: str          # base64-encoded JPEG/PNG (with or without data-URI prefix)
    confidence: float = CONF_DEFAULT   # 0–1 threshold, sent by the frontend slider


class Detection(BaseModel):
    label: str
    confidence: float
    box: List[float]    # [x, y, width, height] in pixels relative to sent image size


class DetectResponse(BaseModel):
    detections: List[Detection]
    inference_ms: float
    model: str


# ─── Helpers ──────────────────────────────────────────────────────────────────
def _decode_image(b64_string: str) -> np.ndarray:
    """Strip optional data-URI prefix and decode base64 → NumPy RGB array."""
    if "," in b64_string:
        b64_string = b64_string.split(",", 1)[1]
    raw = base64.b64decode(b64_string)
    img = Image.open(io.BytesIO(raw)).convert("RGB")
    return np.array(img)


# ─── Routes ───────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    """Liveness endpoint — Render and Railway poll this."""
    return {"status": "ok", "model": MODEL_PATH}


@app.post("/detect", response_model=DetectResponse)
def detect(req: DetectRequest):
    """
    Run YOLOv8 on the submitted frame and return bounding boxes.

    The frontend sends a frame every ~500 ms as base64 JPEG at reduced
    resolution (e.g. 640 wide) to keep the payload small and latency low.
    """
    if _model is None:
        raise HTTPException(503, "Model not loaded yet — please retry.")

    # 1. Decode image
    try:
        frame = _decode_image(req.image)
    except Exception as exc:
        raise HTTPException(400, f"Invalid image data: {exc}")

    # 2. Run inference
    t0 = time.perf_counter()
    results = _model(frame, verbose=False, conf=req.confidence)[0]
    inference_ms = round((time.perf_counter() - t0) * 1000, 1)

    # 3. Build response
    detections: List[Detection] = []
    for box in results.boxes:
        x1, y1, x2, y2 = box.xyxy[0].tolist()
        detections.append(Detection(
            label=_model.names[int(box.cls[0])],
            confidence=round(float(box.conf[0]), 4),
            box=[round(x1, 1), round(y1, 1),
                 round(x2 - x1, 1), round(y2 - y1, 1)],
        ))

    log.info(f"Detected {len(detections)} objects in {inference_ms} ms")
    return DetectResponse(
        detections=detections,
        inference_ms=inference_ms,
        model=MODEL_PATH,
    )


# ─── Local dev entry-point ────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=False)
