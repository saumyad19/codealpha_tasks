/* ─── VISIO – Frontend Controller ─────────────────────────────────────────── */

let isRunning  = false;
let pollTimer  = null;
let fpsHistory = [];

// Confidence-to-color mapping (cyan → blue → violet → pink)
function confColor(pct) {
  if (pct >= 90) return '#00f5ff';
  if (pct >= 70) return '#3b82f6';
  if (pct >= 50) return '#8b5cf6';
  return '#ec4899';
}

// ─── Toggle Detection ────────────────────────────────────────────────────────
async function toggleDetection() {
  const btn = document.getElementById('toggleBtn');
  btn.disabled = true;

  try {
    if (!isRunning) {
      await fetch('/start', { method: 'POST' });
      activateUI();
    } else {
      await fetch('/stop', { method: 'POST' });
      deactivateUI();
    }
  } catch (err) {
    showError('Cannot reach the backend. Is app.py running?');
  }

  btn.disabled = false;
}

// ─── Activate ─────────────────────────────────────────────────────────────────
function activateUI() {
  isRunning = true;
  const feed    = document.getElementById('videoFeed');
  const idle    = document.getElementById('idleOverlay');
  const error   = document.getElementById('errorOverlay');
  const wrapper = document.getElementById('videoWrapper');
  const btn     = document.getElementById('toggleBtn');
  const scanLine  = document.getElementById('scanLine');
  const recInd    = document.getElementById('recIndicator');
  const statusPill = document.getElementById('statusPill');

  // Force reload the stream
  feed.src = '/video_feed?' + Date.now();

  idle.classList.add('hidden');
  error.classList.add('hidden');
  feed.classList.remove('hidden');

  wrapper.classList.add('active');
  btn.classList.add('running');
  document.getElementById('btnIcon').textContent  = '◼';
  document.getElementById('btnLabel').textContent = 'STOP DETECTION';

  scanLine.classList.add('scanning');
  recInd.classList.add('active');
  statusPill.classList.add('active');
  document.getElementById('statusText').textContent = 'LIVE';
  document.getElementById('liveBadge').classList.add('active');
  document.getElementById('liveBadge').textContent = 'ACTIVE';

  // Start polling status
  pollTimer = setInterval(pollStatus, 600);
}

// ─── Deactivate ───────────────────────────────────────────────────────────────
function deactivateUI() {
  isRunning = false;
  clearInterval(pollTimer);

  const feed    = document.getElementById('videoFeed');
  const idle    = document.getElementById('idleOverlay');
  const wrapper = document.getElementById('videoWrapper');
  const btn     = document.getElementById('toggleBtn');
  const scanLine  = document.getElementById('scanLine');
  const recInd    = document.getElementById('recIndicator');
  const statusPill = document.getElementById('statusPill');

  feed.classList.add('hidden');
  idle.classList.remove('hidden');

  wrapper.classList.remove('active');
  btn.classList.remove('running');
  document.getElementById('btnIcon').textContent  = '▶';
  document.getElementById('btnLabel').textContent = 'START DETECTION';

  scanLine.classList.remove('scanning');
  recInd.classList.remove('active');
  statusPill.classList.remove('active');
  document.getElementById('statusText').textContent = 'OFFLINE';
  document.getElementById('liveBadge').classList.remove('active');
  document.getElementById('liveBadge').textContent = 'IDLE';

  // Clear data
  updateFPS(0);
  renderDetections([]);
}

// ─── Poll Status Endpoint ─────────────────────────────────────────────────────
async function pollStatus() {
  try {
    const res  = await fetch('/status');
    const data = await res.json();

    if (data.error) {
      showError(data.error);
      deactivateUI();
      return;
    }

    updateFPS(data.fps || 0);
    renderDetections(data.objects || []);

  } catch (err) {
    // Transient network hiccup – don't stop
  }
}

// ─── FPS Display ─────────────────────────────────────────────────────────────
function updateFPS(val) {
  const el = document.getElementById('fpsCounter');
  el.textContent = val.toFixed(1);
  el.style.color = val >= 20 ? '#10ffb0' : val >= 10 ? '#f59e0b' : '#ef4444';
}

// ─── Detection List ───────────────────────────────────────────────────────────
function renderDetections(objects) {
  const list  = document.getElementById('detectionList');
  const count = document.getElementById('objectCount');
  const bar   = document.getElementById('countBar');

  count.textContent = objects.length;
  bar.style.width   = Math.min(objects.length * 10, 100) + '%';

  if (objects.length === 0) {
    list.innerHTML = `
      <div class="empty-list">
        <span class="empty-icon">◎</span>
        <span>Scanning environment…</span>
      </div>`;
    return;
  }

  list.innerHTML = objects.map(obj => {
    const color = confColor(obj.confidence);
    return `
      <div class="det-item">
        <div class="det-top">
          <span class="det-label">${escHtml(obj.label)}</span>
          <span class="det-conf" style="color:${color}">${obj.confidence}%</span>
        </div>
        <div class="det-bar-bg">
          <div class="det-bar-fill" style="width:${obj.confidence}%;background:${color}"></div>
        </div>
      </div>`;
  }).join('');
}

// ─── Error Display ────────────────────────────────────────────────────────────
function showError(msg) {
  const feed    = document.getElementById('videoFeed');
  const idle    = document.getElementById('idleOverlay');
  const errorOv = document.getElementById('errorOverlay');
  const errMsg  = document.getElementById('errorMsg');

  feed.classList.add('hidden');
  idle.classList.add('hidden');
  errorOv.classList.remove('hidden');
  errMsg.textContent = msg || 'Unknown error occurred.';
}

// ─── XSS guard ───────────────────────────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ─── Keyboard shortcut: Space = toggle ───────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.code === 'Space' && e.target.tagName !== 'BUTTON') {
    e.preventDefault();
    toggleDetection();
  }
});
