/**
 * DuoSign Extension — popup.js
 * ─────────────────────────────
 * This is the JavaScript for popup.html.
 * It runs ONLY when the popup is open.
 *
 * Responsibilities:
 *  1. Check for pending text (selected on a webpage)
 *  2. Load history from storage
 *  3. Load + save settings
 *  4. Call background.js to translate
 *  5. Animate the gloss chips and avatar stage
 */

// ─── ELEMENTS ─────────────────────────────────────────────────────────────────
const inputArea    = document.getElementById("inputArea");
const charCount    = document.getElementById("charCount");
const glossStrip   = document.getElementById("glossStrip");
const glossCount   = document.getElementById("glossCount");
const pbFill       = document.getElementById("pbFill");
const selBanner    = document.getElementById("selBanner");
const selText      = document.getElementById("selText");
const authName     = document.getElementById("authName");
const authSub      = document.getElementById("authSub");

// ─── STATE ────────────────────────────────────────────────────────────────────
let isPlaying    = false;
let pbTimer      = null;
let pbVal        = 0;
let chipCycle    = null;
let currentGloss = [];
const SPEEDS     = ["0.5×", "1×", "1.5×", "2×"];
let spIdx        = 1;

// ─── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  await loadSettings();
  await checkPendingText();
  await loadHistory();
  setupListeners();
});

// ─── CHECK FOR PENDING SELECTION ─────────────────────────────────────────────
// If the user right-clicked selected text and chose "Translate with DuoSign",
// or clicked the floating button on a webpage, there'll be pending text waiting.
async function checkPendingText() {
  const response = await sendToBackground({ type: "GET_PENDING_TEXT" });
  if (response.ok && response.text) {
    inputArea.value = response.text;
    updateCharCount();
    // Show the banner telling user where the text came from
    selText.textContent = `"${truncate(response.text, 48)}"`;
    selBanner.style.display = "flex";
    // Auto-translate if setting is on
    const settings = await getSettings();
    if (settings.autoTranslate) {
      await doTranslate();
    }
  } else {
    selBanner.style.display = "none";
  }
}

// ─── TRANSLATE ────────────────────────────────────────────────────────────────
async function doTranslate() {
  const text = inputArea.value.trim();
  if (!text) return;

  setTranslateLoading(true);

  const response = await sendToBackground({ type: "TRANSLATE", text });

  setTranslateLoading(false);

  if (!response.ok) {
    showError(response.error || "Translation failed. Please try again.");
    return;
  }

  const { gloss, latency_ms } = response.data;
  currentGloss = gloss;
  renderGloss(gloss);

  // Show latency hint
  if (latency_ms) {
    glossCount.textContent = `${gloss.length} tokens · ${latency_ms}ms`;
  }

  // Auto-start animation
  startPlay();
}

// ─── GLOSS RENDERING ─────────────────────────────────────────────────────────
function renderGloss(tokens) {
  glossStrip.innerHTML = "";
  tokens.forEach((token, i) => {
    const chip = document.createElement("div");
    chip.className = "g-chip" + (i === 0 ? " on" : "");
    chip.textContent = token;
    chip.style.animationDelay = (i * 0.06) + "s";
    chip.addEventListener("click", () => seekToToken(i));
    glossStrip.appendChild(chip);
  });
  glossCount.textContent = `${tokens.length} tokens`;
}

function seekToToken(idx) {
  document.querySelectorAll(".g-chip").forEach((c, i) => {
    c.classList.toggle("on", i === idx);
  });
  pbVal = Math.round((idx / currentGloss.length) * 100);
  pbFill.style.width = pbVal + "%";
}

// ─── PLAYBAR ──────────────────────────────────────────────────────────────────
function togglePlay() {
  if (currentGloss.length === 0) return;
  isPlaying ? stopPlay() : startPlay();
}

function startPlay() {
  if (currentGloss.length === 0) return;
  isPlaying = true;
  updatePlayIcon(true);
  clearInterval(pbTimer);
  clearInterval(chipCycle);

  // Animate progress bar
  const duration = 900 * currentGloss.length * [2, 1, 0.67, 0.5][spIdx];
  const step = 100 / (duration / 40); // update every 40ms
  pbTimer = setInterval(() => {
    pbVal = Math.min(100, pbVal + step);
    pbFill.style.width = pbVal + "%";
    if (pbVal >= 100) {
      stopPlay();
      pbVal = 0;
      pbFill.style.width = "0%";
    }
  }, 40);

  // Cycle gloss chips to show which sign is playing
  let chipIdx = 0;
  chipCycle = setInterval(() => {
    document.querySelectorAll(".g-chip").forEach((c, i) => c.classList.toggle("on", i === chipIdx));
    chipIdx = (chipIdx + 1) % currentGloss.length;
  }, 900 * [2, 1, 0.67, 0.5][spIdx]);
}

function stopPlay() {
  isPlaying = false;
  clearInterval(pbTimer);
  clearInterval(chipCycle);
  updatePlayIcon(false);
}

function updatePlayIcon(playing) {
  const ico = document.getElementById("playIco");
  if (!ico) return;
  ico.innerHTML = playing
    ? '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>'
    : '<polygon points="5 3 19 12 5 21 5 3"/>';
}

function cycleSpeed(el) {
  spIdx = (spIdx + 1) % SPEEDS.length;
  el.textContent = SPEEDS[spIdx];
  // Restart if playing
  if (isPlaying) { stopPlay(); startPlay(); }
}

// ─── SETTINGS ────────────────────────────────────────────────────────────────
const DEFAULT_SETTINGS = {
  engine: "hybrid",
  speed: 1,
  autoTranslate: true,
  showGloss: true,
  loopAnimation: false,
  showFloatingButton: true,
  contextMenu: true,
  theme: "dark"
};

async function loadSettings() {
  const settings = await getSettings();

  // Apply theme
  document.documentElement.setAttribute("data-theme", settings.theme);
  updateThemeIcon(settings.theme === "dark");

  // Apply settings to the settings tab controls
  syncSettingsUI(settings);
}

async function getSettings() {
  const response = await sendToBackground({ type: "GET_SETTINGS" });
  return response.ok ? response.settings : DEFAULT_SETTINGS;
}

async function saveSetting(key, value) {
  const settings = await getSettings();
  settings[key] = value;
  await sendToBackground({ type: "SAVE_SETTINGS", settings });
}

function syncSettingsUI(settings) {
  // Wire up toggles in settings tab
  const toggleMap = {
    "tog-autoTranslate":    "autoTranslate",
    "tog-showGloss":        "showGloss",
    "tog-loopAnimation":    "loopAnimation",
    "tog-floatingButton":   "showFloatingButton",
    "tog-contextMenu":      "contextMenu",
  };
  Object.entries(toggleMap).forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.toggle("on", !!settings[key]);
      el.addEventListener("click", () => {
        el.classList.toggle("on");
        saveSetting(key, el.classList.contains("on"));
      });
    }
  });

  // Wire engine select
  const engineSel = document.getElementById("sel-engine");
  if (engineSel) {
    engineSel.value = settings.engine;
    engineSel.addEventListener("change", () => saveSetting("engine", engineSel.value));
  }

  // Wire speed select
  const speedSel = document.getElementById("sel-speed");
  if (speedSel) {
    speedSel.value = String(settings.speed);
    speedSel.addEventListener("change", () => saveSetting("speed", parseFloat(speedSel.value)));
  }
}

// ─── HISTORY ─────────────────────────────────────────────────────────────────
async function loadHistory() {
  const response = await sendToBackground({ type: "GET_HISTORY" });
  if (!response.ok) return;
  renderHistory(response.history || []);
}

function renderHistory(items) {
  const list = document.getElementById("recentList");
  if (!list) return;

  if (items.length === 0) {
    list.innerHTML = '<div class="rec-empty">No translations yet. Start translating!</div>';
    return;
  }

  list.innerHTML = "";
  items.slice(0, 10).forEach(item => {
    const el = document.createElement("div");
    el.className = "rec-item";
    el.innerHTML = `
      <div class="rec-icon ${item.source === 'voice' ? 'voiced' : 'typed'}">
        ${item.source === 'voice'
          ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>`
          : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 12h16M4 18h7"/></svg>`
        }
      </div>
      <div class="rec-main">
        <div class="rec-text">${escapeHtml(truncate(item.text, 40))}</div>
        <div class="rec-meta">${formatTime(item.timestamp)} · ${item.gloss?.length || 0} signs</div>
      </div>
      <div class="rec-replay" title="Re-translate">
        <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      </div>
    `;
    // Click the replay button
    el.querySelector(".rec-replay").addEventListener("click", (e) => {
      e.stopPropagation();
      inputArea.value = item.text;
      updateCharCount();
      switchTab(document.querySelector('[data-tab="translate"]'), "translate");
      doTranslate();
    });
    // Click the row to load text
    el.addEventListener("click", () => {
      inputArea.value = item.text;
      updateCharCount();
      switchTab(document.querySelector('[data-tab="translate"]'), "translate");
    });
    list.appendChild(el);
  });
}

// ─── TAB SWITCHING ────────────────────────────────────────────────────────────
function switchTab(el, tabId) {
  document.querySelectorAll(".pop-tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
  if (el) el.classList.add("active");
  const panel = document.getElementById("panel-" + tabId);
  if (panel) panel.classList.add("active");

  // Refresh history when switching to it
  if (tabId === "recent") loadHistory();
}

// ─── THEME ────────────────────────────────────────────────────────────────────
function toggleTheme() {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  const newTheme = isDark ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", newTheme);
  updateThemeIcon(!isDark);
  saveSetting("theme", newTheme);
}

function updateThemeIcon(isDark) {
  const moon = document.getElementById("moonIco");
  const sun  = document.getElementById("sunIco");
  if (moon) moon.style.display = isDark  ? "block" : "none";
  if (sun)  sun.style.display  = !isDark ? "block" : "none";
}

// ─── SELECTION BANNER ────────────────────────────────────────────────────────
function clearSel() {
  selBanner.style.display = "none";
  inputArea.value = "";
  updateCharCount();
}

// ─── MISC UI ─────────────────────────────────────────────────────────────────
function updateCharCount() {
  if (charCount) charCount.textContent = `${inputArea.value.length} / 500`;
}

function setTranslateLoading(loading) {
  const btn = document.getElementById("xlateBtn");
  if (!btn) return;
  btn.disabled = loading;
  btn.innerHTML = loading
    ? `<svg style="animation:spin .8s linear infinite" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M21 12a9 9 0 1 1-9-9"/></svg> Translating…`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg> Translate`;
}

function showError(msg) {
  const strip = glossStrip;
  strip.innerHTML = `<div style="color:var(--error);font-size:12px;font-style:italic">${escapeHtml(msg)}</div>`;
}

// ─── EVENT LISTENERS (set up in init) ────────────────────────────────────────
function setupListeners() {
  // Char count
  inputArea?.addEventListener("input", updateCharCount);

  // Translate button
  document.getElementById("xlateBtn")?.addEventListener("click", doTranslate);

  // Play button
  document.getElementById("playBtn")?.addEventListener("click", togglePlay);

  // Speed chip
  document.getElementById("speedChip")?.addEventListener("click", function() {
    cycleSpeed(this);
  });

  // Theme toggle
  document.getElementById("themeToggleBtn")?.addEventListener("click", toggleTheme);

  // Tab buttons
  document.querySelectorAll(".pop-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      switchTab(tab, tab.dataset.tab);
    });
  });

  // Clear selection
  document.getElementById("selClearBtn")?.addEventListener("click", clearSel);

  // Open full app button
  document.getElementById("openAppBtn")?.addEventListener("click", () => {
    chrome.tabs.create({ url: "https://app.duosign.com" });
  });

  // Enter key to translate
  inputArea?.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      doTranslate();
    }
  });
}

// ─── UTILS ────────────────────────────────────────────────────────────────────
async function sendToBackground(message) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ ok: false, error: chrome.runtime.lastError.message });
      } else {
        resolve(response || { ok: false });
      }
    });
  });
}

function truncate(str, max) {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

function escapeHtml(str) {
  return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

function formatTime(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1)   return "just now";
  if (diffMins < 60)  return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  return d.toLocaleDateString();
}
