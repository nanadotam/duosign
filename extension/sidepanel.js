/**
 * DuoSign Extension — Side Panel Controller
 * ============================================
 * Main controller for the signing interface:
 *  - Text input → SSE streaming translation
 *  - Skeleton 2D rendering (default, lightweight)
 *  - Avatar 3D rendering (VRM, opt-in)
 *  - Gloss token chip display
 *  - Playback controls
 *  - Message handling from content script / background
 */

document.addEventListener("DOMContentLoaded", () => {
  // ── DOM refs ──────────────────────────────────────────────────────
  const textInput = document.getElementById("textInput");
  const charCount = document.getElementById("charCount");
  const translateBtn = document.getElementById("translateBtn");
  const canvas = document.getElementById("signCanvas");
  const ctx = canvas.getContext("2d");
  const emptyState = document.getElementById("emptyState");
  const currentGlossLabel = document.getElementById("currentGloss");
  const glossChips = document.getElementById("glossChips");
  const methodBadge = document.getElementById("methodBadge");
  const statusBar = document.getElementById("statusBar");
  const renderToggle = document.getElementById("renderToggle");
  const avatarContainer = document.getElementById("avatarContainer");

  // Playback controls
  const prevBtn = document.getElementById("prevBtn");
  const stopBtn = document.getElementById("stopBtn");
  const playBtn = document.getElementById("playBtn");
  const nextBtn = document.getElementById("nextBtn");
  const loopBtn = document.getElementById("loopBtn");
  const speedBtns = document.querySelectorAll(".speed-btn");

  // ── State ─────────────────────────────────────────────────────────
  let currentTokens = [];
  let currentTokenIndex = 0;
  let isPlaying = false;
  let isLooping = false;
  let speed = 1;
  let player = null; // PosePlayer (2D skeleton)
  let renderMode = "skeleton"; // "skeleton" or "avatar"
  let vrmPosePlayer = null; // VRM 3D pose player (lazy loaded)
  let avatarRenderer = null; // Three.js renderer (lazy loaded)

  // ── Canvas setup ──────────────────────────────────────────────────
  function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.setTransform(
      window.devicePixelRatio,
      0,
      0,
      window.devicePixelRatio,
      0,
      0,
    );
  }
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  // ── 2D Skeleton Player init ───────────────────────────────────────
  if (window.PosePlayer && window.drawSkeleton) {
    player = new window.PosePlayer({
      onFrame: (frame, header) => {
        const w = canvas.width / window.devicePixelRatio;
        const h = canvas.height / window.devicePixelRatio;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        window.drawSkeleton(ctx, frame, header, w, h);
      },
      onGlossChange: (gloss) => {
        currentGlossLabel.textContent = gloss;
        highlightActiveChip(gloss);
      },
      onComplete: () => {
        if (isLooping && currentTokens.length > 0) {
          player.playSequence(currentTokens, 1);
        } else {
          isPlaying = false;
          playBtn.textContent = "▶";
          currentGlossLabel.textContent = "";
        }
      },
      onStateChange: () => {},
    });
    player.speed = speed;
  }

  // ── Character count ───────────────────────────────────────────────
  textInput.addEventListener("input", () => {
    charCount.textContent = `${textInput.value.length}/500`;
  });

  // ── Render mode toggle ────────────────────────────────────────────
  renderToggle?.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      renderToggle
        .querySelectorAll("button")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderMode = btn.dataset.mode;

      if (renderMode === "skeleton") {
        canvas.style.display = "";
        avatarContainer.style.display = "none";
      } else {
        canvas.style.display = "none";
        avatarContainer.style.display = "block";
        initVRMRenderer();
      }
    });
  });

  /** Lazy-init the VRM 3D renderer */
  async function initVRMRenderer() {
    if (avatarRenderer) return;
    try {
      statusBar.textContent = "● Loading 3D avatar…";

      const { AvatarRenderer } = await import("./lib/avatar-renderer.js");
      const { VRMLoader } = await import("./lib/vrm-loader.js");
      const { VRMPosePlayer } = await import("./lib/vrm-pose-player.js");

      // Ensure VRM is in IndexedDB — download now if missing (handles first-install
      // race where user clicks Avatar 3D before background download finishes)
      await window.assetManager.init();
      const { ready } = await window.assetManager.checkFirstInstall();
      if (!ready) {
        statusBar.textContent = "● Downloading 3D avatar…";
        await window.assetManager.runFirstInstall(({ label, loaded, total }) => {
          const pct = total ? Math.round((loaded / total) * 100) : 0;
          statusBar.textContent = `● ${label}${pct ? " " + pct + "%" : ""}`;
        });
      }

      const blobUrl = await window.assetManager.getAvatarBlobURL();
      statusBar.textContent = "● Initialising 3D scene…";

      avatarRenderer = new AvatarRenderer(avatarContainer);
      const loader = new VRMLoader();
      const vrm = await loader.load(blobUrl, avatarRenderer.scene);

      vrmPosePlayer = new VRMPosePlayer();
      vrmPosePlayer.setVRM(vrm);
      vrmPosePlayer.onStateChange((state) => {
        currentGlossLabel.textContent = state.currentGloss || "";
        highlightActiveChip(state.currentGloss);
      });

      statusBar.textContent = "● 3D Avatar ready";
    } catch (err) {
      console.error("[SidePanel] VRM init error:", err);
      statusBar.textContent = "● 3D Avatar failed — using skeleton";
      renderMode = "skeleton";
      canvas.style.display = "";
      avatarContainer.style.display = "none";
      // Reset so the user can retry by clicking Avatar 3D again
      if (avatarRenderer) {
        try { avatarRenderer.dispose(); } catch (_) {}
        avatarRenderer = null;
      }
    }
  }

  // ── Translate ─────────────────────────────────────────────────────
  translateBtn.addEventListener("click", () => {
    const text = textInput.value.trim();
    if (!text) return;
    doTranslate(text);
  });

  textInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      translateBtn.click();
    }
  });

  async function doTranslate(text) {
    statusBar.textContent = "● Translating…";
    translateBtn.disabled = true;
    glossChips.innerHTML = "";
    methodBadge.textContent = "";
    emptyState.style.display = "none";

    try {
      // Use SSE streaming for progressive translation
      const controller = new AbortController();
      let bestResult = null;

      for await (const event of window.DuoSignAPI.translateStream(
        text,
        controller.signal,
      )) {
        if (event.event === "rule_based" || event.event === "llm_quality") {
          bestResult = event.data;
          currentTokens = bestResult.tokens || bestResult.gloss.split(" ");
          currentTokenIndex = 0;

          // Update chips
          renderGlossChips(currentTokens);
          methodBadge.textContent =
            bestResult.method === "llm_quality" ? "✨ LLM" : "⚡ Rule";
          methodBadge.className = `method-badge ${bestResult.method === "llm_quality" ? "llm" : "rule"}`;
          statusBar.textContent = `● Translated — ${currentTokens.length} signs`;
        }
      }

      if (bestResult && currentTokens.length > 0) {
        playSequence(currentTokens);
      }
    } catch (err) {
      // Fallback to fast endpoint
      try {
        const result = await window.DuoSignAPI.translateText(text);
        currentTokens = result.tokens || result.gloss.split(" ");
        currentTokenIndex = 0;
        renderGlossChips(currentTokens);
        methodBadge.textContent = "⚡ Rule";
        methodBadge.className = "method-badge rule";
        statusBar.textContent = `● Translated — ${currentTokens.length} signs`;
        playSequence(currentTokens);
      } catch (err2) {
        statusBar.textContent = "● Translation failed";
        console.error("[SidePanel] Translate error:", err2);
      }
    } finally {
      translateBtn.disabled = false;
    }
  }

  // ── Gloss chips ───────────────────────────────────────────────────
  function renderGlossChips(tokens) {
    glossChips.innerHTML = "";
    tokens.forEach((token, i) => {
      const chip = document.createElement("span");
      chip.className = "chip";
      chip.textContent = token;
      chip.dataset.index = i;
      chip.addEventListener("click", () => {
        currentTokenIndex = i;
        playGloss(token);
      });
      glossChips.appendChild(chip);
    });
  }

  function highlightActiveChip(gloss) {
    document
      .querySelectorAll(".chip")
      .forEach((c) => c.classList.remove("active"));
    if (!gloss) return;
    const match = [...document.querySelectorAll(".chip")].find(
      (c) => c.textContent === gloss,
    );
    if (match) match.classList.add("active");
  }

  // ── Playback ──────────────────────────────────────────────────────
  function playGloss(gloss) {
    currentGlossLabel.textContent = gloss;
    highlightActiveChip(gloss);

    if (renderMode === "avatar" && vrmPosePlayer) {
      vrmPosePlayer.playGloss(gloss);
    } else if (player) {
      player.playSequence([gloss], 1);
    }
  }

  function playSequence(tokens) {
    isPlaying = true;
    playBtn.textContent = "⏸";
    currentTokenIndex = 0;

    if (renderMode === "avatar" && vrmPosePlayer) {
      vrmPosePlayer.playSequence(tokens);
      vrmPosePlayer.onStateChange((state) => {
        currentGlossLabel.textContent = state.currentGloss || "";
        highlightActiveChip(state.currentGloss);
        if (!state.isPlaying && isLooping) {
          playSequence(tokens);
        } else if (!state.isPlaying) {
          isPlaying = false;
          playBtn.textContent = "▶";
        }
      });
    } else if (player) {
      // PosePlayer handles its own sequencing; looping is handled by onComplete
      player.playSequence(tokens, 1);
    }
  }

  // ── Playback controls ─────────────────────────────────────────────
  playBtn.addEventListener("click", () => {
    if (isPlaying) {
      if (renderMode === "avatar" && vrmPosePlayer) {
        vrmPosePlayer.pause();
      } else if (player) {
        player.pause();
      }
      isPlaying = false;
      playBtn.textContent = "▶";
    } else if (currentTokens.length > 0) {
      if (renderMode === "avatar" && vrmPosePlayer?.isPaused) {
        vrmPosePlayer.resume();
        isPlaying = true;
        playBtn.textContent = "⏸";
      } else if (player?.isPaused) {
        player.resume();
        isPlaying = true;
        playBtn.textContent = "⏸";
      } else {
        playSequence(currentTokens);
      }
    }
  });

  stopBtn.addEventListener("click", () => {
    isPlaying = false;
    playBtn.textContent = "▶";
    currentTokenIndex = 0;
    currentGlossLabel.textContent = "";
    if (renderMode === "avatar" && vrmPosePlayer) {
      vrmPosePlayer.stop();
    } else if (player) {
      player.stop();
    }
  });

  prevBtn.addEventListener("click", () => {
    if (currentTokens.length === 0) return;
    currentTokenIndex = Math.max(0, currentTokenIndex - 2);
    playGloss(currentTokens[currentTokenIndex]);
    currentTokenIndex++;
  });

  nextBtn.addEventListener("click", () => {
    if (currentTokenIndex < currentTokens.length) {
      playGloss(currentTokens[currentTokenIndex]);
      currentTokenIndex++;
    }
  });

  loopBtn.addEventListener("click", () => {
    isLooping = !isLooping;
    loopBtn.classList.toggle("active", isLooping);
  });

  speedBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      speedBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      speed = parseFloat(btn.dataset.speed);
      if (player) player.speed = speed;
    });
  });

  // ── Message listener (from background/content) ────────────────────
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "TRANSLATE_TEXT" && msg.text) {
      textInput.value = msg.text;
      charCount.textContent = `${msg.text.length}/500`;
      doTranslate(msg.text);
    }
  });

  // ── First-install: download VRM avatar into IndexedDB ────────────
  (async () => {
    try {
      const { ready } = await window.assetManager.checkFirstInstall();
      if (!ready) {
        statusBar.textContent = "● Downloading sign avatar (first install)…";
        await window.assetManager.runFirstInstall(({ label, loaded, total }) => {
          const pct = total ? Math.round((loaded / total) * 100) : 0;
          statusBar.textContent = `● ${label} ${pct ? pct + "%" : ""}`;
        });
        statusBar.textContent = "● Ready — highlight text on any page to sign";
      }
    } catch (err) {
      console.warn("[SidePanel] First-install check failed:", err);
    }
  })();

  // ── Load active mode from storage ─────────────────────────────────
  chrome.storage.local.get("activeMode", (result) => {
    const mode = result.activeMode || "text";
    const modeLabel = document.getElementById("modeLabel");
    const modeMap = {
      text: "TEXT SELECTION",
      youtube: "YOUTUBE",
      pdf: "PDF READER",
    };
    if (modeLabel) modeLabel.textContent = modeMap[mode] || "TEXT SELECTION";
  });
});
