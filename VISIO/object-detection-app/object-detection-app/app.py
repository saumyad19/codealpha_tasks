import cv2
import json
import time
import threading
from flask import Flask, Response, render_template, jsonify
from ultralytics import YOLO
import numpy as np

app = Flask(__name__)

# ─── Global State ────────────────────────────────────────────────────────────
camera = None
output_frame = None
lock = threading.Lock()
detection_active = False
detected_objects = []
fps_value = 0.0
camera_error = None

# YOLO model (loaded once)
model = None

# Neon color palette per class index (cycles through)
NEON_COLORS = [
    (0, 255, 255),    # Cyan
    (255, 0, 255),    # Magenta
    (0, 255, 128),    # Neon Green
    (255, 128, 0),    # Neon Orange
    (128, 0, 255),    # Purple
    (0, 128, 255),    # Blue
    (255, 255, 0),    # Yellow
    (255, 0, 128),    # Pink
]


def load_model():
    global model
    try:
        model = YOLO("yolov8n.pt")  # nano – fastest; auto-downloads on first run
        print("[VISIO] YOLOv8n model loaded successfully.")
    except Exception as e:
        print(f"[VISIO] Model load error: {e}")


def get_color(class_id: int):
    return NEON_COLORS[class_id % len(NEON_COLORS)]


def draw_detection(frame, box, label, conf, class_id):
    x1, y1, x2, y2 = map(int, box)
    color = get_color(class_id)

    # Glow effect: draw thick translucent rectangle first
    overlay = frame.copy()
    cv2.rectangle(overlay, (x1, y1), (x2, y2), color, 2)
    cv2.addWeighted(overlay, 0.6, frame, 0.4, 0, frame)

    # Main bounding box
    cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)

    # Corner accents
    corner_len = 12
    thickness = 3
    # Top-left
    cv2.line(frame, (x1, y1), (x1 + corner_len, y1), color, thickness)
    cv2.line(frame, (x1, y1), (x1, y1 + corner_len), color, thickness)
    # Top-right
    cv2.line(frame, (x2, y1), (x2 - corner_len, y1), color, thickness)
    cv2.line(frame, (x2, y1), (x2, y1 + corner_len), color, thickness)
    # Bottom-left
    cv2.line(frame, (x1, y2), (x1 + corner_len, y2), color, thickness)
    cv2.line(frame, (x1, y2), (x1, y2 - corner_len), color, thickness)
    # Bottom-right
    cv2.line(frame, (x2, y2), (x2 - corner_len, y2), color, thickness)
    cv2.line(frame, (x2, y2), (x2, y2 - corner_len), color, thickness)

    # Label background
    text = f"{label}  {conf:.0%}"
    (tw, th), _ = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 1)
    label_y = max(y1 - 6, th + 6)
    cv2.rectangle(frame, (x1, label_y - th - 6), (x1 + tw + 10, label_y + 2), color, -1)
    cv2.putText(frame, text, (x1 + 5, label_y - 2),
                cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 0, 0), 1, cv2.LINE_AA)

    return frame


def capture_frames():
    global camera, output_frame, detection_active, detected_objects, fps_value, camera_error

    camera_error = None
    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        camera_error = "Webcam not found. Please check your camera connection."
        return

    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    cap.set(cv2.CAP_PROP_FPS, 30)

    prev_time = time.time()
    frame_count = 0

    while detection_active:
        ret, frame = cap.read()
        if not ret:
            camera_error = "Failed to read frame from camera."
            break

        frame = cv2.flip(frame, 1)  # Mirror selfie-style
        current_time = time.time()
        frame_count += 1

        # FPS calculation (rolling average every 10 frames)
        if frame_count % 10 == 0:
            fps_value = round(10 / (current_time - prev_time), 1)
            prev_time = current_time

        # Run YOLO inference
        objects = []
        if model is not None:
            results = model(frame, verbose=False, conf=0.4)[0]
            for box in results.boxes:
                cls_id = int(box.cls[0])
                conf = float(box.conf[0])
                label = model.names[cls_id]
                xyxy = box.xyxy[0].tolist()
                frame = draw_detection(frame, xyxy, label, conf, cls_id)
                objects.append({"label": label, "confidence": round(conf * 100, 1)})

        # Deduplicate / sort detections for sidebar
        seen = {}
        for obj in objects:
            key = obj["label"]
            if key not in seen or obj["confidence"] > seen[key]["confidence"]:
                seen[key] = obj
        detected_objects = sorted(seen.values(), key=lambda x: -x["confidence"])

        # Encode frame as JPEG
        _, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
        with lock:
            output_frame = buffer.tobytes()

    cap.release()
    with lock:
        output_frame = None
    fps_value = 0.0
    detected_objects = []


def generate_stream():
    while True:
        with lock:
            frame = output_frame
        if frame is None:
            time.sleep(0.05)
            continue
        yield (b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + frame + b"\r\n")


# ─── Routes ──────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/video_feed")
def video_feed():
    return Response(generate_stream(),
                    mimetype="multipart/x-mixed-replace; boundary=frame")


@app.route("/start", methods=["POST"])
def start_detection():
    global detection_active, camera_error
    if detection_active:
        return jsonify({"status": "already_running"})
    detection_active = True
    camera_error = None
    t = threading.Thread(target=capture_frames, daemon=True)
    t.start()
    return jsonify({"status": "started"})


@app.route("/stop", methods=["POST"])
def stop_detection():
    global detection_active
    detection_active = False
    return jsonify({"status": "stopped"})


@app.route("/status")
def status():
    return jsonify({
        "active": detection_active,
        "fps": fps_value,
        "objects": detected_objects,
        "error": camera_error
    })


# ─── Entry Point ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    load_model()
    print("[VISIO] Server starting at http://127.0.0.1:5000")
    app.run(host="0.0.0.0", port=5000, debug=False, threaded=True)
