# VISIO — Real-Time Object Detection Platform

> A portfolio-grade AI vision application powered by YOLOv8, Flask, and a
> futuristic glassmorphism UI. Detects 80 object classes from your webcam
> in real time with confidence scores, animated bounding boxes, and a live
> FPS counter.

---

## Features

- **Live object detection** — YOLOv8 nano model runs on every webcam frame
- **Animated bounding boxes** — neon corner-bracket overlays with glow effects
- **Confidence sidebar** — sorted live list with animated confidence bars
- **FPS counter** — color-coded (green ≥ 20, amber ≥ 10, red < 10)
- **Start / Stop toggle** — Space bar or the on-screen button
- **Error handling** — camera not found, backend unreachable, stream loss
- **Cyberpunk dashboard** — dark background, glassmorphism cards, ambient orbs

---

## Project Structure

```
object-detection-app/
├── app.py                 # Flask backend — YOLO inference + MJPEG stream
├── requirements.txt       # Python dependencies
├── templates/
│   └── index.html         # Dashboard UI (Jinja2 template)
├── static/
│   ├── style.css          # Cyberpunk / glassmorphism design system
│   └── script.js          # UI controller — polling, rendering, events
└── README.md
```

---

## Installation (VS Code)

### Prerequisites

| Tool | Minimum version | Check |
|------|----------------|-------|
| Python | 3.9 | `python --version` |
| pip | 23+ | `pip --version` |
| Webcam | any USB / built-in | Device Manager |

### Step-by-step

**1. Clone / copy the project folder**

```bash
# If from a ZIP, just extract it. Otherwise:
git clone <your-repo-url>
cd object-detection-app
```

**2. Open in VS Code**

```bash
code .
```

**3. Create and activate a virtual environment** (recommended)

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS / Linux
python -m venv venv
source venv/bin/activate
```

**4. Install dependencies**

```bash
pip install -r requirements.txt
```

> On first run, `ultralytics` will automatically download `yolov8n.pt`
> (~6 MB) from the internet. You need an internet connection the first time.

**5. Run the application**

```bash
python app.py
```

You should see:
```
[VISIO] YOLOv8n model loaded successfully.
[VISIO] Server starting at http://127.0.0.1:5000
```

**6. Open in browser**

Navigate to: **http://127.0.0.1:5000**

Click **START DETECTION** (or press **Space**) to activate the webcam.

---

## How to Use

| Action | How |
|--------|-----|
| Start detection | Click "START DETECTION" or press `Space` |
| Stop detection | Click "STOP DETECTION" or press `Space` |
| View detected objects | Sidebar → "LIVE DETECTIONS" panel |
| Monitor performance | Top-right FPS badge; green ≥ 20 fps |

---

## Troubleshooting

### Camera not found
- Make sure no other app (Zoom, Teams, OBS) is using the camera
- Try changing `cv2.VideoCapture(0)` to `cv2.VideoCapture(1)` in `app.py`
- On Linux: check permissions with `ls -la /dev/video*`

### Slow FPS (< 10)
- YOLOv8n is the fastest variant; it still needs a modern CPU
- Close other browser tabs and background apps
- For GPU acceleration: install `torch` with CUDA support before `ultralytics`
  ```bash
  pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
  pip install ultralytics
  ```

### Model download fails
- Check internet connectivity
- Manually download `yolov8n.pt` from https://github.com/ultralytics/assets/releases
  and place it in the project root

### Black / blank video feed
- Refresh the browser page after clicking START
- Check the terminal for Python errors
- Ensure the virtual environment is activated when running `python app.py`

### Port already in use
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <pid> /F

# macOS / Linux
lsof -i :5000
kill -9 <pid>
```

---

## Configuration

Edit the top of `app.py` to tweak detection:

```python
model = YOLO("yolov8n.pt")   # swap for yolov8s.pt / yolov8m.pt for better accuracy
results = model(frame, verbose=False, conf=0.4)  # lower conf = more detections
```

| Model | Speed | Accuracy |
|-------|-------|----------|
| yolov8n | ⚡⚡⚡ | ★★ |
| yolov8s | ⚡⚡ | ★★★ |
| yolov8m | ⚡ | ★★★★ |

---

## Tech Stack

- **Backend** — Python 3.11, Flask 3, OpenCV, Ultralytics YOLOv8
- **Stream** — MJPEG multipart over HTTP (no WebSocket needed)
- **Frontend** — Vanilla HTML/CSS/JS, Space Grotesk + JetBrains Mono
- **Design** — Glassmorphism cards, CSS backdrop-filter, animated CSS orbs

---

*Built as a portfolio showcase of real-time computer vision on the web.*
