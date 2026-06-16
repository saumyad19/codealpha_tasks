/**
 * VISIO Detect — Frontend Controller
 *
 * Flow:
 *  1. User clicks "Enable camera" → getUserMedia
 *  2. Video stream appears in <video>
 *  3. setInterval fires every `captureInterval` ms
 *  4. Frame is drawn to an offscreen <canvas>, scaled down, exported as base64 JPEG
 *  5. POST /detect with { image, confidence }
 *  6. Response detections are drawn on the overlay <canvas>
 *  7. Sidebar stats / list updated
 */

// ─── Config & state ───────────────────────────────────────────────────────────
const CAPTURE_W  = 640;   // Width sent to backend (height auto-scales)
const JPEG_Q     = 0.75;  // JPEG quality 0–1

let apiBase = 'https://visio-backend-ltmo.onrender.com';
let captureInterval = 1500;  // ms between frames
let confThreshold   = 0.25;

let videoStream   = null;
let detectTimer   = null;
let offscreenCanvas = null;
let offscreenCtx    = null;

// FPS tracking
let lastFrameTime = 0;
let frameCount    = 0;
let fpsInterval   = null;

// Detection label colours — 20 distinct hues cycling by class name hash
const PALETTE = [
  '#6366f1','#22d3a0','#f59e0b','#f43f5e','#3b82f6',
  '#a78bfa','#10b981','#fb923c','#e879f9','#06b6d4',
  '#84cc16','#ef4444','#8b5cf6','#14b8a6','#f97316',
  '#ec4899','#0ea5e9','#d97706','#7c3aed','#16a34a',
];

function labelColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return PALETTE[h % PALETTE.length];
}

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const videoEl       = document.getElementById('videoEl');
const overlayCanvas = document.getElementById('overlayCanvas');
const overlayCtx    = overlayCanvas.getContext('2d');
const gate          = document.getElementById('gate');
const gateError     = document.getElementById('gateError');
const startBtn      = document.getElementById('startBtn');
const stopBtn       = document.getElementById('stopBtn');
const viewerFrame   = document.getElementById('viewerFrame');
const sendFlash     = document.getElementById('sendFlash');
const statusDot     = document.getElementById('statusDot');
const statusLabel   = document.getElementById('statusLabel');
const fpsVal        = document.getElementById('fpsVal');
const latencyVal    = document.getElementById('latencyVal');
const countBig      = document.getElementById('countBig');
const detList       = document.getElementById('detList');
const liveBadge     = document.getElementById('liveBadge');
const confSlider    = document.getElementById('confSlider');
const confValEl     = document.getElementById('confVal');
const intervalSlider = document.getElementById('intervalSlider');
const intervalValEl  = document.getElementById('intervalVal');
const apiUrlInput   = document.getElementById('apiUrl');
const testBtn       = document.getElementById('testBtn');
const endpointHint  = document.getElementById('endpointHint');
const toast         = document.getElementById('toast');

// ─── Slider handlers ──────────────────────────────────────────────────────────
confSlider.addEventListener('input', () => {
  confThreshold = confSlider.value / 100;
  confValEl.textContent = confSlider.value + '%';
});

intervalSlider.addEventListener('input', () => {
  captureInterval = parseInt(intervalSlider.value, 10);
  intervalValEl.textContent = captureInterval + ' ms';
  // Restart timer with new interval if running
  if (detectTimer) {
    clearInterval(detectTimer);
    detectTimer = setInterval(captureAndDetect, captureInterval);
  }
});

apiUrlInput.addEventListener('change', () => {
  apiBase = apiUrlInput.value.replace(/\/$/, '');
});

// ─── Ping / test connection ───────────────────────────────────────────────────
testBtn.addEventListener('click', async () => {
  apiBase = apiUrlInput.value.replace(/\/$/, '');
  testBtn.textContent = '…';
  testBtn.disabled = true;
  try {
    const res = await fetch(`${apiBase}/health`, { signal: AbortSignal.timeout(4000) });
    const data = await res.json();
    endpointHint.textContent = `✓ Connected — model: ${data.model}`;
    endpointHint.style.color = 'var(--green)';
    showToast('Backend reachable ✓', 'ok');
  } catch {
    endpointHint.textContent = '✗ Cannot reach backend — check URL or CORS';
    endpointHint.style.color = 'var(--red)';
    showToast('Connection failed', 'error');
  } finally {
    testBtn.textContent = 'Ping';
    testBtn.disabled = false;
  }
});

// ─── Camera lifecycle ─────────────────────────────────────────────────────────
startBtn.addEventListener('click', startCamera);
stopBtn.addEventListener('click', stopCamera);

async function startCamera() {
  apiBase = apiUrlInput.value.replace(/\/$/, '');
  gateError.classList.add('hidden');
  startBtn.disabled = true;
  startBtn.textContent = 'Opening camera…';

  try {
    videoStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    });
  } catch (err) {
    const msg = err.name === 'NotAllowedError'
      ? 'Camera access was denied. Allow camera in your browser settings and refresh.'
      : `Could not open camera: ${err.message}`;
    gateError.textContent = msg;
    gateError.classList.remove('hidden');
    startBtn.disabled = false;
    startBtn.textContent = 'Enable camera';
    return;
  }

  // Wire stream to video element
  videoEl.srcObject = videoStream;
  await videoEl.play();

  // Show video layers, hide gate
  gate.classList.add('hidden');
  videoEl.classList.remove('hidden');
  overlayCanvas.classList.remove('hidden');
  stopBtn.classList.remove('hidden');
  viewerFrame.classList.add('active');

  // Sync canvas dimensions once video metadata known
  videoEl.addEventListener('loadedmetadata', syncCanvasSize, { once: true });
  syncCanvasSize();

  // Prepare offscreen canvas for frame capture
  offscreenCanvas = document.createElement('canvas');
  offscreenCanvas.width  = CAPTURE_W;
  offscreenCtx = offscreenCanvas.getContext('2d');

  // Start detection loop
  detectTimer = setInterval(captureAndDetect, captureInterval);

  // Start FPS counter
  lastFrameTime = performance.now();
  fpsInterval = setInterval(updateFPS, 1000);

  setStatus('live', 'LIVE');
}

function stopCamera() {
  // Stop detection loop
  if (detectTimer) { clearInterval(detectTimer); detectTimer = null; }
  if (fpsInterval) { clearInterval(fpsInterval);  fpsInterval = null; }

  // Stop webcam tracks
  if (videoStream) {
    videoStream.getTracks().forEach(t => t.stop());
    videoStream = null;
  }

  // Reset UI
  videoEl.srcObject = null;
  videoEl.classList.add('hidden');
  overlayCanvas.classList.add('hidden');
  clearCanvas();
  gate.classList.remove('hidden');
  stopBtn.classList.add('hidden');
  startBtn.disabled = false;
  startBtn.textContent = 'Enable camera';
  viewerFrame.classList.remove('active');

  setStatus('', 'OFFLINE');
  fpsVal.textContent = '—';
  latencyVal.textContent = '—';
  countBig.textContent = '0';
  detList.innerHTML = '<p class="det-empty">Start the camera to see detections.</p>';
  liveBadge.textContent = 'IDLE';
  liveBadge.classList.remove('live');
}

function syncCanvasSize() {
  // Make overlay canvas exactly match the displayed video size
  const rect = videoEl.getBoundingClientRect();
  overlayCanvas.width  = videoEl.videoWidth  || rect.width;
  overlayCanvas.height = videoEl.videoHeight || rect.height;
}

// ─── Capture frame & call API ─────────────────────────────────────────────────
async function captureAndDetect() {
  if (!videoStream || videoEl.readyState < 2) return;

  // 1. Capture frame to offscreen canvas at reduced size
  const vw = videoEl.videoWidth;
  const vh = videoEl.videoHeight;
  if (!vw || !vh) return;

  const scale = CAPTURE_W / vw;
  offscreenCanvas.width  = CAPTURE_W;
  offscreenCanvas.height = Math.round(vh * scale);
  // Mirror transform so bounding boxes match the CSS-mirrored video
  offscreenCtx.save();
  offscreenCtx.scale(-1, 1);
  offscreenCtx.drawImage(videoEl, -CAPTURE_W, 0, CAPTURE_W, offscreenCanvas.height);
  offscreenCtx.restore();

  const base64 = offscreenCanvas.toDataURL('image/jpeg', JPEG_Q);

  // Flash border
  flashSend();
  frameCount++;

  // 2. POST to backend
  const t0 = performance.now();
  let data;
  try {
    const res = await fetch(`${apiBase}/detect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64, confidence: confThreshold }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
  } catch (err) {
    setStatus('error', 'ERR');
    latencyVal.textContent = 'failed';
    return;
  }

  const latency = Math.round(performance.now() - t0);
  latencyVal.textContent = latency + ' ms';
  setStatus('live', 'LIVE');

  // 3. Render detections
  renderDetections(data.detections || [], vw, vh);
  updateSidebar(data.detections || []);
}

// ─── Canvas rendering ─────────────────────────────────────────────────────────
function renderDetections(detections, videoW, videoH) {
  // Sync canvas to actual rendered video dimensions
  syncCanvasSize();
  clearCanvas();

  const cw = overlayCanvas.width;
  const ch = overlayCanvas.height;

  // Scale factors: detections are relative to CAPTURE_W × capture_h
  // but canvas is at full video resolution
  // The backend receives a CAPTURE_W-wide image and returns pixel coords in that space
  const captureH = Math.round(videoH * (CAPTURE_W / videoW));
  const sx = cw / CAPTURE_W;
  const sy = ch / captureH;

  overlayCtx.save();

  detections.forEach(det => {
    const [bx, by, bw, bh] = det.box;
    const x = bx * sx;
    const y = by * sy;
    const w = bw * sx;
    const h = bh * sy;
    const color = labelColor(det.label);
    const conf  = Math.round(det.confidence * 100);

    // Glow
    overlayCtx.shadowColor  = color;
    overlayCtx.shadowBlur   = 10;

    // Bounding box
    overlayCtx.strokeStyle = color;
    overlayCtx.lineWidth   = 2;
    overlayCtx.strokeRect(x, y, w, h);

    // Corner accents
    overlayCtx.shadowBlur = 0;
    const cl = 12, ct = 2.5;
    const corners = [
      [x, y, x+cl, y, x, y+cl],           // TL
      [x+w, y, x+w-cl, y, x+w, y+cl],     // TR
      [x, y+h, x+cl, y+h, x, y+h-cl],     // BL
      [x+w, y+h, x+w-cl, y+h, x+w, y+h-cl], // BR
    ];
    overlayCtx.lineWidth = ct;
    corners.forEach(([ax,ay,bx2,by2,cx2,cy2]) => {
      overlayCtx.beginPath();
      overlayCtx.moveTo(ax,ay); overlayCtx.lineTo(bx2,by2);
      overlayCtx.moveTo(ax,ay); overlayCtx.lineTo(cx2,cy2);
      overlayCtx.strokeStyle = color;
      overlayCtx.stroke();
    });

    // Label background
    overlayCtx.font = '600 12px Inter, sans-serif';
    const label = `${det.label}  ${conf}%`;
    const tw    = overlayCtx.measureText(label).width;
    const lh    = 20;
    const lx    = x;
    const ly    = y > lh + 4 ? y - lh - 4 : y + 2;

    overlayCtx.fillStyle = color + 'cc';   // slightly transparent fill
    roundRect(overlayCtx, lx, ly, tw + 12, lh, 4);
    overlayCtx.fill();

    overlayCtx.fillStyle = '#000';
    overlayCtx.fillText(label, lx + 6, ly + 13);
  });

  overlayCtx.restore();
}

function clearCanvas() {
  overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
}

/** Helper: draw a rounded rect path (CanvasRenderingContext2D.roundRect is not universal) */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x+w, y, x+w, y+r, r);
  ctx.lineTo(x+w, y+h-r);
  ctx.arcTo(x+w, y+h, x+w-r, y+h, r);
  ctx.lineTo(x+r, y+h);
  ctx.arcTo(x, y+h, x, y+h-r, r);
  ctx.lineTo(x, y+r);
  ctx.arcTo(x, y, x+r, y, r);
  ctx.closePath();
}

// ─── Sidebar update ───────────────────────────────────────────────────────────
function updateSidebar(detections) {
  countBig.textContent = detections.length;

  if (detections.length === 0) {
    detList.innerHTML = '<p class="det-empty">No objects detected.</p>';
    liveBadge.textContent = 'SCANNING';
    liveBadge.classList.remove('live');
    return;
  }

  liveBadge.textContent = 'LIVE';
  liveBadge.classList.add('live');

  // Sort by confidence desc, deduplicate by label (keep highest conf)
  const seen = {};
  detections.forEach(d => {
    if (!seen[d.label] || d.confidence > seen[d.label].confidence) seen[d.label] = d;
  });
  const unique = Object.values(seen).sort((a,b) => b.confidence - a.confidence);

  detList.innerHTML = unique.map(det => {
    const conf  = Math.round(det.confidence * 100);
    const color = labelColor(det.label);
    return `
      <div class="det-item">
        <span class="det-name">${esc(det.label)}</span>
        <span class="det-conf" style="color:${color}">${conf}%</span>
        <div class="det-bar-wrap">
          <div class="det-bar" style="width:${conf}%;background:${color}"></div>
        </div>
      </div>`;
  }).join('');
}

// ─── FPS ──────────────────────────────────────────────────────────────────────
function updateFPS() {
  fpsVal.textContent = frameCount;
  frameCount = 0;
}

// ─── Status & UI helpers ──────────────────────────────────────────────────────
function setStatus(state, label) {
  statusDot.className = 'status-dot' + (state ? ' ' + state : '');
  statusLabel.textContent = label;
}

function flashSend() {
  sendFlash.classList.add('active');
  setTimeout(() => sendFlash.classList.remove('active'), 100);
}

let toastTimer;
function showToast(msg, type = '') {
  toast.textContent = msg;
  toast.className = 'toast' + (type ? ` toast-${type}` : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.classList.add('hidden'); }, 3000);
}

function esc(str) {
  return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ─── Resize handler ───────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  if (videoStream) syncCanvasSize();
});

// ─── On load: restore saved API URL ──────────────────────────────────────────
(function init() {
  const saved = localStorage.getItem('visio_api_url');
  if (saved) {
    apiUrlInput.value = saved;
    apiBase = saved;
  }
  apiUrlInput.addEventListener('change', () => {
    localStorage.setItem('visio_api_url', apiUrlInput.value.replace(/\/$/, ''));
  });
})();
