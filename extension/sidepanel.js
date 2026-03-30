/**
 * DuoSign Extension — Side Panel Controller
 * ============================================
 * Main orchestrator for the side panel. Handles:
 * - Canvas setup and skeleton rendering
 * - Translation API calls
 * - Playback controls (play/pause/stop/replay/speed)
 * - Communication with background/content scripts
 * - Session text from context menu / keyboard shortcut
 */

const API_BASE_URL = "https://duosign.onrender.com";

// ── DOM References ──────────────────────────────────────────────────
const canvas = document.getElementById("skeletonCanvas");
const ctx = canvas.getContext("2d");
const canvasArea = document.getElementById("canvasArea");
const glossLabel = document.getElementById("glossLabel");
const glossSequence = document.getElementById("glossSequence");
const emptyState = document.getElementById("emptyState");
const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");
const modeBadge = document.getElementById("modeBadge");
const loadingBar = document.getElementById("loadingBar");
const errorBanner = document.getElementById("errorBanner");
const errorText = document.getElementById("errorText");
const retryBtn = document.getElementById("retryBtn");
const textInput = document.getElementById("textInput");
const charCount = document.getElementById("charCount");
const translateBtn = document.getElementById("translateBtn");
const btnPlay = document.getElementById("btnPlay");
const btnStop = document.getElementById("btnStop");
const btnPrev = document.getElementById("btnPrev");
const btnNext = document.getElementById("btnNext");
const btnReplay = document.getElementById("btnReplay");

// ── State ───────────────────────────────────────────────────────────
let currentGlosses = [];
let currentSpeed = 1;
let lastTranslatedText = "";

// ── Canvas Resize ───────────────────────────────────────────────────
function resizeCanvas() {
  const rect = canvasArea.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// ── Pose Player ─────────────────────────────────────────────────────
const player = new PosePlayer({
  onFrame: (frame, header) => {
    const rect = canvasArea.getBoundingClientRect();
    drawSkeleton(ctx, frame, header, rect.width, rect.height);
  },
  onGlossChange: (gloss, index, total) => {
    glossLabel.textContent = gloss;
    glossLabel.classList.remove("hidden");

    // Highlight the active token in the sequence display
    const tokens = glossSequence.querySelectorAll(".gloss-token");
    tokens.forEach((t, i) => {
      t.classList.toggle("active", i === index);
    });
  },
  onComplete: () => {
    setStatus("idle", "Playback complete");
    glossLabel.textContent = "Done";
    btnPlay.innerHTML = "▶";
    setTimeout(() => {
      glossLabel.classList.add("hidden");
    }, 2000);
  },
  onStateChange: (state) => {
    if (state === "playing") {
      setStatus("active", "Signing...");
      btnPlay.innerHTML = "⏸";
      emptyState.style.display = "none";
    } else if (state === "paused") {
      setStatus("idle", "Paused");
      btnPlay.innerHTML = "▶";
    } else {
      setStatus("idle", "Ready");
      btnPlay.innerHTML = "▶";
    }
  },
});

// ── Status Helpers ──────────────────────────────────────────────────
function setStatus(type, text) {
  statusDot.className = "dot";
  if (type === "active") statusDot.classList.add("active");
  if (type === "error") statusDot.classList.add("error");
  statusText.textContent = text;
}

function showError(msg) {
  errorText.textContent = msg;
  errorBanner.classList.add("visible");
  setStatus("error", "Error");
}

function hideError() {
  errorBanner.classList.remove("visible");
}

function showLoading(show) {
  loadingBar.classList.toggle("visible", show);
}

// ── Translation ─────────────────────────────────────────────────────
async function translateAndPlay(text) {
  if (!text || !text.trim()) return;

  text = text.trim();
  lastTranslatedText = text;
  textInput.value = text;
  charCount.textContent = text.length;

  hideError();
  showLoading(true);
  translateBtn.disabled = true;
  setStatus("active", "Translating...");
  emptyState.style.display = "none";

  try {
    const res = await fetch(`${API_BASE_URL}/api/translate/fast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) throw new Error(`API error: ${res.status}`);

    const data = await res.json();
    const tokens = data.tokens || data.gloss.split(" ");

    // Filter out empty tokens
    currentGlosses = tokens.filter((t) => t && t.trim());

    if (currentGlosses.length === 0) {
      setStatus("idle", "No signs found for this text");
      showLoading(false);
      translateBtn.disabled = false;
      return;
    }

    // Display gloss sequence
    renderGlossSequence(currentGlosses);

    showLoading(false);
    setStatus("active", "Signing...");

    // Start playback
    player.speed = currentSpeed;
    player.playSequence(currentGlosses, 3);
  } catch (err) {
    console.error("[SidePanel] Translation error:", err);
    showError(`Translation failed: ${err.message}`);
    showLoading(false);
  } finally {
    translateBtn.disabled = false;
  }
}

function renderGlossSequence(glosses) {
  glossSequence.innerHTML = glosses
    .map((g, i) => `<span class="gloss-token" data-index="${i}">${g}</span>`)
    .join(" ");
}

// ── Playback Controls ───────────────────────────────────────────────
btnPlay.addEventListener("click", () => {
  if (player.isPlaying && !player.isPaused) {
    player.pause();
  } else if (player.isPaused) {
    player.resume();
  } else if (currentGlosses.length > 0) {
    player.speed = currentSpeed;
    player.playSequence(currentGlosses, 3);
  }
});

btnStop.addEventListener("click", () => {
  player.stop();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  glossLabel.classList.add("hidden");
  setStatus("idle", "Stopped");
});

btnReplay.addEventListener("click", () => {
  if (currentGlosses.length > 0) {
    player.speed = currentSpeed;
    player.playSequence(currentGlosses, 3);
  }
});

btnPrev.addEventListener("click", () => {
  // Not implemented for MVP — would need seek-by-gloss in the player
});

btnNext.addEventListener("click", () => {
  // Not implemented for MVP — would need seek-by-gloss in the player
});

// ── Speed Controls ──────────────────────────────────────────────────
document.querySelectorAll(".speed-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".speed-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentSpeed = parseFloat(btn.dataset.speed);
    player.speed = currentSpeed;
  });
});

// ── Text Input ──────────────────────────────────────────────────────
textInput.addEventListener("input", () => {
  charCount.textContent = textInput.value.length;
});

textInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    translateAndPlay(textInput.value);
  }
});

translateBtn.addEventListener("click", () => {
  translateAndPlay(textInput.value);
});

// ── Retry Button ────────────────────────────────────────────────────
retryBtn.addEventListener("click", () => {
  if (lastTranslatedText) {
    translateAndPlay(lastTranslatedText);
  }
});

// ── Mode Handling ───────────────────────────────────────────────────
const MODE_LABELS = {
  "text-selection": "Text Selection",
  youtube: "YouTube",
  pdf: "PDF Reader",
};

function setMode(mode) {
  modeBadge.textContent = MODE_LABELS[mode] || "Text Selection";
}

// ── Listen for Selected Text from Background ────────────────────────
function checkForSelectedText() {
  chrome.storage.session.get(["selectedText", "sourceMode"], (result) => {
    if (result.sourceMode) {
      setMode(result.sourceMode);
    }
    if (result.selectedText) {
      translateAndPlay(result.selectedText);
      // Clear it so we don't re-translate on panel reopen
      chrome.storage.session.remove(["selectedText"]);
    }
  });
}

// Check on load
checkForSelectedText();

// Also listen for changes (for YouTube captions and live updates)
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "session") {
    if (changes.selectedText?.newValue) {
      translateAndPlay(changes.selectedText.newValue);
      chrome.storage.session.remove(["selectedText"]);
    }
    if (changes.sourceMode?.newValue) {
      setMode(changes.sourceMode.newValue);
    }
  }
});

// ── Load Settings ───────────────────────────────────────────────────
chrome.storage.sync.get(["animationSpeed"], (result) => {
  if (result.animationSpeed) {
    currentSpeed = result.animationSpeed;
    player.speed = currentSpeed;
    document.querySelectorAll(".speed-btn").forEach((btn) => {
      btn.classList.toggle(
        "active",
        parseFloat(btn.dataset.speed) === currentSpeed,
      );
    });
  }
});
