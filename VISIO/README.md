# VISIO Detect — Production-Ready AI Object Detection

A real-time object detection web app that runs **entirely in the browser** — no
desktop client, no OpenCV webcam capture. The browser streams frames from the
user's camera to a lightweight FastAPI backend running YOLOv8n, and renders
live bounding boxes on a canvas overlay.

```
Browser (any device)
  ↓  getUserMedia → <video>
  ↓  Canvas capture → base64 JPEG (640 px wide)
  ↓  POST /detect  →  FastAPI + YOLOv8n
  ↓  JSON detections
  ↑  Canvas overlay drawn
```

---

## Features

- Works on any browser that supports `getUserMedia` (Chrome, Firefox, Safari, Edge)
- Mobile-friendly responsive layout
- Live confidence threshold slider
- Adjustable frame send interval (200 ms – 2 s)
- FPS and latency display
- Per-class color-coded bounding boxes with corner bracket accents
- Sidebar detection list with animated confidence bars
- Backend URL field — paste your Render URL after deployment
- Ping button to verify backend connectivity
- Error handling: camera denied, backend down, network timeout

---

## Project Structure

```
visio-detect/
├── backend/
│   ├── app.py              # FastAPI app — /detect and /health endpoints
│   └── requirements.txt    # Python dependencies
├── frontend/
│   ├── index.html          # Single-page app shell
│   ├── style.css           # Design system + responsive layout
│   ├── script.js           # Camera, frame capture, API calls, canvas render
│   └── netlify.toml        # Netlify deploy config
├── render.yaml             # Render.com deploy config
└── README.md
```

---

## Local Development

### Prerequisites

| Tool | Version |
|------|---------|
| Python | 3.9 + |
| pip | 23 + |
| Any modern browser | Chrome / Firefox / Edge / Safari 15+ |

### 1. Start the backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
python app.py
```

On first run, `ultralytics` downloads `yolov8n.pt` (~6 MB). You need internet
access once. The server starts on **http://localhost:8000**.

Verify it's working:
```bash
curl http://localhost:8000/health
# → {"status":"ok","model":"yolov8n.pt"}
```

### 2. Open the frontend

The frontend is static HTML — just open the file:

**Option A — File directly in browser**
```
File → Open → visio-detect/frontend/index.html
```

**Option B — Tiny local server (recommended, avoids some browser quirks)**
```bash
cd frontend
python -m http.server 3000
# Open: http://localhost:3000
```

### 3. Use the app

1. The Backend URL field defaults to `http://localhost:8000` — leave it as-is
2. Click **Ping** to confirm the backend is reachable (should show green ✓)
3. Click **Enable camera** and grant permission
4. Detections appear in the sidebar; bounding boxes overlay the video

---

## Deployment

### Backend → Render.com

Render is a free-tier PaaS that runs Python web services.

**Steps:**

1. Push this repo to GitHub (the whole `visio-detect/` folder)

2. Go to [render.com](https://render.com) → **New → Web Service**

3. Connect your GitHub repo

4. Configure the service:

   | Field | Value |
   |-------|-------|
   | **Root Directory** | `backend` |
   | **Runtime** | Python 3 |
   | **Build Command** | `pip install -r requirements.txt` |
   | **Start Command** | `uvicorn app:app --host 0.0.0.0 --port $PORT` |

5. Under **Environment Variables**, optionally set:
   - `YOLO_MODEL` = `yolov8n.pt` (default)
   - `CONF_THRESHOLD` = `0.40`

6. Click **Create Web Service**

7. Wait for the build (2–4 min). Your URL will be:
   ```
   https://visio-detect-api.onrender.com
   ```

> **Note:** Render free tier spins down after 15 min of inactivity. The first
> request after sleep takes ~30 s. Upgrade to a paid instance to avoid cold starts.

**CORS:** The backend allows all origins (`*`) by default. For production,
edit `app.py` line with `allow_origins=["*"]` and replace `"*"` with your
Netlify URL, e.g. `["https://visio-detect.netlify.app"]`.

---

### Frontend → Netlify

Netlify hosts static sites for free with a CDN and HTTPS.

**Option A — Drag and drop (fastest)**

1. Go to [netlify.com](https://netlify.com) → **Add new site → Deploy manually**
2. Drag the entire `frontend/` folder into the upload zone
3. Done — you get a URL like `https://visio-detect-abc.netlify.app`

**Option B — Git-connected (recommended for updates)**

1. Go to **Add new site → Import from Git**
2. Select your repo
3. Set **Base directory** = `frontend`
4. Set **Publish directory** = `frontend`
5. Leave build command empty (no build step)
6. Deploy

**After deployment — connect the backend:**

Open your Netlify URL → paste your Render URL into the **Backend URL** field →
click **Ping**. The app remembers the URL in `localStorage`.

---

## API Reference

### `GET /health`

```json
{ "status": "ok", "model": "yolov8n.pt" }
```

### `POST /detect`

**Request body:**
```json
{
  "image": "<base64 JPEG string, with or without data-URI prefix>",
  "confidence": 0.40
}
```

**Response:**
```json
{
  "detections": [
    {
      "label": "person",
      "confidence": 0.9217,
      "box": [142.3, 88.0, 195.4, 420.1]
    }
  ],
  "inference_ms": 38.4,
  "model": "yolov8n.pt"
}
```

`box` is `[x, y, width, height]` in pixels relative to the input image size (640 wide).

---

## Performance Tips

| Goal | What to change |
|------|---------------|
| Higher accuracy | Change `YOLO_MODEL` env var to `yolov8s.pt` or `yolov8m.pt` |
| Lower latency | Reduce `captureInterval` slider; set `JPEG_Q = 0.6` in `script.js` |
| GPU inference | Install torch+CUDA before ultralytics on a GPU Render instance |
| Fewer false detections | Raise confidence slider to 60–70% |

---

## Troubleshooting

**Camera not appearing**
- Check browser permissions (lock icon in address bar)
- On iOS, only Safari supports `getUserMedia`
- HTTPS is required on Netlify — camera won't work on plain HTTP in production

**Detections not showing**
- Click **Ping** to confirm backend is reachable
- Check browser console for CORS errors
- On Render free tier, first request after sleep may take 30 s

**CORS error in console**
- Update `allow_origins` in `app.py` to include your Netlify domain
- Redeploy the backend after the change

**Bounding boxes misaligned**
- This can happen if the browser window is resized mid-session
- Resize the window slightly to trigger the canvas sync

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Camera capture | `navigator.mediaDevices.getUserMedia` |
| Frame encoding | HTML5 Canvas + `toDataURL('image/jpeg')` |
| Backend framework | FastAPI + Uvicorn |
| Object detection | Ultralytics YOLOv8n |
| Image decoding | Pillow + NumPy |
| Frontend hosting | Netlify (static) |
| Backend hosting | Render.com (Python) |

---

*VISIO Detect v2.0 — browser-native AI vision*
