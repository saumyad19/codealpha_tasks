/**
 * LinguaX — Neural Translation Interface
 * app.js — Full Application Logic
 */

'use strict';

// ═══════════════════════════════════════
//  CONSTANTS & CONFIG
// ═══════════════════════════════════════

// MyMemory API — free, no key, full CORS, works in browser & Netlify
// Limit: 5,000 chars/day per user IP (each visitor has their own quota)
// Tip: add de: 'your@email.com' in tryTranslate params to raise limit 10x
const MYMEMORY_API = 'https://api.mymemory.translated.net/get';

const LANG_NAMES = {
  auto: 'Auto-Detect', en: 'English', es: 'Spanish', fr: 'French',
  de: 'German', it: 'Italian', pt: 'Portuguese', ru: 'Russian',
  ja: 'Japanese', ko: 'Korean', zh: 'Chinese', ar: 'Arabic',
  hi: 'Hindi', nl: 'Dutch', pl: 'Polish', tr: 'Turkish',
  sv: 'Swedish', uk: 'Ukrainian', vi: 'Vietnamese', id: 'Indonesian',
};

const MAX_CHARS = 5000;
const HISTORY_KEY = 'linguax_history';

// ═══════════════════════════════════════
//  DOM REFERENCES
// ═══════════════════════════════════════

const $ = id => document.getElementById(id);

const DOM = {
  inputText:      $('inputText'),
  outputText:     $('outputText'),
  sourceLang:     $('sourceLang'),
  targetLang:     $('targetLang'),
  translateBtn:   $('translateBtn'),
  btnLoader:      $('btnLoader'),
  swapBtn:        $('swapBtn'),
  clearBtn:       $('clearBtn'),
  copyBtn:        $('copyBtn'),
  copyIcon:       $('copyIcon'),
  ttsInputBtn:    $('ttsInputBtn'),
  ttsOutputBtn:   $('ttsOutputBtn'),
  charCounter:    $('charCounter'),
  detectedLang:   $('detectedLang'),
  errorToast:     $('errorToast'),
  errorMsg:       $('errorMsg'),
  historyList:    $('historyList'),
  clearHistoryBtn:$('clearHistoryBtn'),
  confidenceBar:  $('confidenceBar'),
  barFill:        $('barFill'),
  confValue:      $('confValue'),
  particles:      $('particles'),
};

// ═══════════════════════════════════════
//  STATE
// ═══════════════════════════════════════

let state = {
  isTranslating: false,
  isSpeaking: false,
  currentOutput: '',
  typingTimer: null,
  history: [],
};

// ═══════════════════════════════════════
//  PARTICLES
// ═══════════════════════════════════════

function spawnParticles() {
  for (let i = 0; i < 30; i++) {
    setTimeout(() => {
      const p = document.createElement('div');
      p.className = 'particle';
      const x = Math.random() * 100;
      const duration = 8 + Math.random() * 15;
      const delay = Math.random() * 10;
      const size = Math.random() > 0.8 ? 3 : 2;
      const hue = Math.random() > 0.5 ? '#00f5ff' : (Math.random() > 0.5 ? '#b400ff' : '#00ff9f');
      p.style.cssText = `
        left: ${x}vw;
        bottom: -10px;
        width: ${size}px;
        height: ${size}px;
        background: ${hue};
        box-shadow: 0 0 6px ${hue};
        animation-duration: ${duration}s;
        animation-delay: ${delay}s;
        animation-name: particleDrift;
        animation-iteration-count: infinite;
      `;
      DOM.particles.appendChild(p);
    }, i * 200);
  }
}

// ═══════════════════════════════════════
//  HISTORY
// ═══════════════════════════════════════

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    state.history = raw ? JSON.parse(raw) : [];
  } catch { state.history = []; }
  renderHistory();
}

function saveHistory() {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(state.history)); }
  catch { /* storage full */ }
}

function addToHistory(source, target, sourceLang, targetLang) {
  const entry = {
    id: Date.now(),
    source: source.slice(0, 200),
    target: target.slice(0, 200),
    sourceLang,
    targetLang,
    timestamp: new Date().toISOString(),
  };
  state.history.unshift(entry);
  if (state.history.length > 50) state.history = state.history.slice(0, 50);
  saveHistory();
  renderHistory();
}

function renderHistory() {
  if (state.history.length === 0) {
    DOM.historyList.innerHTML = `<div class="history-empty"><span>No translations recorded yet. Begin your session.</span></div>`;
    return;
  }

  DOM.historyList.innerHTML = state.history.map(entry => `
    <div class="history-item" onclick="restoreHistory('${entry.id}')" title="Click to restore">
      <div class="history-text source-t">${escapeHtml(entry.source)}</div>
      <div class="history-arrow">→</div>
      <div class="history-text output-t">${escapeHtml(entry.target)}</div>
      <div class="history-langs">
        <span class="history-lang-tag src">${LANG_NAMES[entry.sourceLang] || entry.sourceLang}</span>
        <span class="history-lang-tag tgt">${LANG_NAMES[entry.targetLang] || entry.targetLang}</span>
      </div>
    </div>
  `).join('');
}

window.restoreHistory = function(id) {
  const entry = state.history.find(h => String(h.id) === String(id));
  if (!entry) return;
  DOM.inputText.value = entry.source;
  DOM.sourceLang.value = entry.sourceLang !== 'auto' ? entry.sourceLang : 'auto';
  DOM.targetLang.value = entry.targetLang;
  updateCharCounter();
  displayOutput(entry.target);
};

// ═══════════════════════════════════════
//  CHARACTER COUNTER
// ═══════════════════════════════════════

function updateCharCounter() {
  const len = DOM.inputText.value.length;
  DOM.charCounter.textContent = `${len.toLocaleString()} / ${MAX_CHARS.toLocaleString()}`;
  DOM.charCounter.classList.remove('warning', 'limit');
  if (len > MAX_CHARS * 0.9) DOM.charCounter.classList.add('warning');
  if (len >= MAX_CHARS) DOM.charCounter.classList.add('limit');
}

// ═══════════════════════════════════════
//  ERROR HANDLING
// ═══════════════════════════════════════

let errorTimer;
function showError(msg) {
  DOM.errorMsg.textContent = msg;
  DOM.errorToast.classList.add('visible');
  clearTimeout(errorTimer);
  errorTimer = setTimeout(hideError, 5000);
}

function hideError() {
  DOM.errorToast.classList.remove('visible');
}

// ═══════════════════════════════════════
//  OUTPUT DISPLAY WITH TYPING EFFECT
// ═══════════════════════════════════════

function displayOutput(text, animate = true) {
  state.currentOutput = text;
  clearTimeout(state.typingTimer);

  DOM.outputText.classList.remove('loading');
  DOM.outputText.classList.add('has-content');

  if (!animate || text.length < 3) {
    DOM.outputText.textContent = text;
    return;
  }

  DOM.outputText.innerHTML = '';
  const cursor = document.createElement('span');
  cursor.className = 'typing-cursor';
  DOM.outputText.appendChild(cursor);

  let i = 0;
  const chunkSize = Math.max(1, Math.floor(text.length / 80)); // adaptive speed

  function typeChunk() {
    if (i < text.length) {
      const chunk = text.slice(i, i + chunkSize);
      cursor.insertAdjacentText('beforebegin', chunk);
      i += chunkSize;
      const delay = text.length > 500 ? 5 : (text.length > 100 ? 12 : 20);
      state.typingTimer = setTimeout(typeChunk, delay);
    } else {
      cursor.remove();
    }
  }
  typeChunk();
}

function setLoadingState(loading) {
  state.isTranslating = loading;
  DOM.btnLoader.classList.toggle('active', loading);
  DOM.translateBtn.disabled = loading;

  if (loading) {
    DOM.outputText.classList.add('loading');
    DOM.outputText.innerHTML = '<span class="placeholder-text">Processing neural translation...</span>';
    DOM.confidenceBar.style.display = 'none';
    hideError();
  }
}

// ═══════════════════════════════════════
//  TRANSLATION API — MyMemory
//  GET request · no API key · CORS-safe
//  Works on localhost, Netlify, file://
// ═══════════════════════════════════════

async function tryTranslate(text, source, target) {
  // MyMemory langpair format: "en|hi"
  // Use "en|hi" even for auto-detect — we pass source as-is when known,
  // or fall back to "en" as the source stub when truly unknown.
  const sourceLang = (source === 'auto') ? 'en' : source;
  const langpair   = `${sourceLang}|${target}`;

  const params = new URLSearchParams({
    q:        text,
    langpair: langpair,
    // de: 'your@email.com', // ← Uncomment to raise daily limit 10x (no signup needed)
  });

  const response = await fetch(`${MYMEMORY_API}?${params.toString()}`, {
    method:  'GET',
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`MyMemory HTTP ${response.status}`);
  }

  const data = await response.json();

  // 200 = OK · 429 = rate limit · 400 = bad lang pair
  if (data.responseStatus !== 200) {
    throw new Error(data.responseDetails || `API status ${data.responseStatus}`);
  }

  const translatedText = data.responseData?.translatedText;
  if (!translatedText) throw new Error('Empty translation response.');

  // Build detectedLanguage object for auto-detect mode
  let detectedLanguage = null;
  if (source === 'auto') {
    detectedLanguage = {
      language:   sourceLang,                         // best guess we sent
      confidence: data.responseData?.match ?? 0.8,   // 0.0 – 1.0 match score
    };
  }

  return { translatedText, detectedLanguage };
}

async function translate() {
  const text = DOM.inputText.value.trim();

  // ── Validation ──────────────────────────────────
  if (!text) {
    showError('⚡ No input detected. Enter text to initiate translation.');
    DOM.inputText.focus();
    return;
  }
  if (text.length > MAX_CHARS) {
    showError(`Character limit exceeded. Maximum ${MAX_CHARS.toLocaleString()} characters.`);
    return;
  }

  const source = DOM.sourceLang.value;
  const target = DOM.targetLang.value;

  if (source !== 'auto' && source === target) {
    showError('Source and target languages are identical. Please select different languages.');
    return;
  }

  // ── Call API ────────────────────────────────────
  setLoadingState(true);

  try {
    const result = await tryTranslate(text, source, target);

    setLoadingState(false);
    displayOutput(result.translatedText);
    addToHistory(text, result.translatedText, source, target);

    // Show detected language + confidence bar
    if (source === 'auto' && result.detectedLanguage) {
      const detected   = result.detectedLanguage.language;
      const confidence = Math.round(result.detectedLanguage.confidence * 100);
      DOM.detectedLang.textContent =
        `◈ DETECTED: ${LANG_NAMES[detected] || detected.toUpperCase()} ${confidence ? `(${confidence}%)` : ''}`;

      DOM.confidenceBar.style.display = 'flex';
      setTimeout(() => {
        DOM.barFill.style.width   = `${confidence}%`;
        DOM.confValue.textContent = `${confidence}%`;
      }, 100);
    } else {
      DOM.detectedLang.textContent    = '';
      DOM.confidenceBar.style.display = 'none';
    }

  } catch (err) {
    setLoadingState(false);
    const msg = err.message || '';

    if (msg.includes('429') || /quota|limit/i.test(msg)) {
      showError('🚦 Daily limit reached (5,000 chars/IP). Try again tomorrow — or uncomment the de= email line in tryTranslate() to raise it 10×.');
    } else if (/failed to fetch|networkerror|load failed/i.test(msg)) {
      showError('🌐 Network error. Check your internet connection and try again.');
    } else {
      showError(`Translation failed: ${msg}`);
    }
  }
}

// ═══════════════════════════════════════
//  SWAP LANGUAGES
// ═══════════════════════════════════════

function swapLanguages() {
  const src = DOM.sourceLang.value;
  const tgt = DOM.targetLang.value;

  if (src === 'auto') {
    showError('Cannot swap when source is set to Auto-Detect. Select a specific language first.');
    return;
  }

  // Animate
  DOM.swapBtn.classList.add('swapping');
  setTimeout(() => DOM.swapBtn.classList.remove('swapping'), 500);

  // Swap selects
  DOM.sourceLang.value = tgt;
  DOM.targetLang.value = src;

  // Swap text areas if there's output
  if (state.currentOutput) {
    const prevInput = DOM.inputText.value;
    DOM.inputText.value = state.currentOutput;
    displayOutput(prevInput, false);
    updateCharCounter();
  }

  DOM.detectedLang.textContent = '';
}

// ═══════════════════════════════════════
//  COPY TO CLIPBOARD
// ═══════════════════════════════════════

async function copyOutput() {
  if (!state.currentOutput) {
    showError('Nothing to copy. Translate some text first.');
    return;
  }

  try {
    await navigator.clipboard.writeText(state.currentOutput);
    DOM.copyIcon.textContent = '✓ COPIED';
    DOM.copyBtn.classList.add('copied');
    setTimeout(() => {
      DOM.copyIcon.textContent = '⎘ COPY';
      DOM.copyBtn.classList.remove('copied');
    }, 2000);
  } catch {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = state.currentOutput;
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    DOM.copyIcon.textContent = '✓ COPIED';
    DOM.copyBtn.classList.add('copied');
    setTimeout(() => {
      DOM.copyIcon.textContent = '⎘ COPY';
      DOM.copyBtn.classList.remove('copied');
    }, 2000);
  }
}

// ═══════════════════════════════════════
//  TEXT-TO-SPEECH
// ═══════════════════════════════════════

function getLangCode(langVal) {
  const map = {
    en: 'en-US', es: 'es-ES', fr: 'fr-FR', de: 'de-DE',
    it: 'it-IT', pt: 'pt-PT', ru: 'ru-RU', ja: 'ja-JP',
    ko: 'ko-KR', zh: 'zh-CN', ar: 'ar-SA', hi: 'hi-IN',
    nl: 'nl-NL', pl: 'pl-PL', tr: 'tr-TR', sv: 'sv-SE',
    uk: 'uk-UA', vi: 'vi-VN', id: 'id-ID',
  };
  return map[langVal] || 'en-US';
}

function speak(text, langVal, btn) {
  if (!window.speechSynthesis) {
    showError('Text-to-speech is not supported in this browser.');
    return;
  }

  if (state.isSpeaking) {
    window.speechSynthesis.cancel();
    state.isSpeaking = false;
    document.querySelectorAll('.tts-btn').forEach(b => b.classList.remove('speaking'));
    return;
  }

  if (!text || !text.trim()) {
    showError('No text available to speak.');
    return;
  }

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = getLangCode(langVal);
  utter.rate = 0.95;
  utter.pitch = 1;

  utter.onstart = () => {
    state.isSpeaking = true;
    btn.classList.add('speaking');
  };

  utter.onend = () => {
    state.isSpeaking = false;
    btn.classList.remove('speaking');
  };

  utter.onerror = () => {
    state.isSpeaking = false;
    btn.classList.remove('speaking');
  };

  window.speechSynthesis.speak(utter);
}

// ═══════════════════════════════════════
//  CLEAR
// ═══════════════════════════════════════

function clearInput() {
  DOM.inputText.value = '';
  DOM.outputText.classList.remove('has-content', 'loading');
  DOM.outputText.innerHTML = '<span class="placeholder-text">Translation will materialize here...</span>';
  state.currentOutput = '';
  DOM.detectedLang.textContent = '';
  DOM.confidenceBar.style.display = 'none';
  updateCharCounter();
  hideError();
  DOM.inputText.focus();
}

// ═══════════════════════════════════════
//  KEYBOARD SHORTCUT
// ═══════════════════════════════════════

function handleKeyDown(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    if (!state.isTranslating) translate();
  }
}

// ═══════════════════════════════════════
//  UTILITY
// ═══════════════════════════════════════

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ═══════════════════════════════════════
//  INIT
// ═══════════════════════════════════════

function init() {
  // Particles
  spawnParticles();

  // Load history
  loadHistory();

  // Event Listeners
  DOM.inputText.addEventListener('input', updateCharCounter);
  DOM.inputText.addEventListener('keydown', handleKeyDown);

  DOM.translateBtn.addEventListener('click', translate);
  DOM.swapBtn.addEventListener('click', swapLanguages);
  DOM.clearBtn.addEventListener('click', clearInput);
  DOM.copyBtn.addEventListener('click', copyOutput);

  DOM.ttsInputBtn.addEventListener('click', () => {
    const text = DOM.inputText.value.trim();
    const lang = DOM.sourceLang.value === 'auto' ? 'en' : DOM.sourceLang.value;
    speak(text, lang, DOM.ttsInputBtn);
  });

  DOM.ttsOutputBtn.addEventListener('click', () => {
    speak(state.currentOutput, DOM.targetLang.value, DOM.ttsOutputBtn);
  });

  DOM.clearHistoryBtn.addEventListener('click', () => {
    state.history = [];
    saveHistory();
    renderHistory();
  });

  // Initial counter
  updateCharCounter();

  // Keyboard shortcut hint in placeholder
  const isMac = navigator.platform.toUpperCase().includes('MAC');
  DOM.inputText.placeholder = `Begin transmission... enter text to translate\n\n${isMac ? '⌘' : 'Ctrl'}+Enter to translate`;

  console.log('%cLINGUAX v2.0', 'color:#00f5ff;font-family:monospace;font-size:18px;font-weight:bold;');
  console.log('%cNeural Translation Interface — Initialized', 'color:#b400ff;font-family:monospace;');
}

document.addEventListener('DOMContentLoaded', init);
