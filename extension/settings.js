/**
 * DuoSign Extension — Settings Script
 * ======================================
 * Read/write settings from/to chrome.storage.sync.
 */

document.addEventListener("DOMContentLoaded", () => {
  const userNameInput = document.getElementById("userName");
  const speedSlider = document.getElementById("speedSlider");
  const speedValue = document.getElementById("speedValue");
  const renderModeToggle = document.getElementById("renderModeToggle");
  const saveIndicator = document.getElementById("saveIndicator");

  // ── Load settings ─────────────────────────────────────────────────
  chrome.storage.sync.get(
    ["userName", "animationSpeed", "renderMode"],
    (result) => {
      userNameInput.value = result.userName || "User";
      speedSlider.value = result.animationSpeed || 1;
      speedValue.textContent = `${result.animationSpeed || 1}×`;

      // Set render mode toggle
      const mode = result.renderMode || "skeleton";
      renderModeToggle.querySelectorAll("button").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.value === mode);
      });
    },
  );

  // ── Save helper ───────────────────────────────────────────────────
  function save(key, value) {
    chrome.storage.sync.set({ [key]: value }, () => {
      // Flash save indicator
      saveIndicator.classList.add("visible");
      setTimeout(() => saveIndicator.classList.remove("visible"), 1500);
    });
  }

  // ── Event listeners ───────────────────────────────────────────────
  // Name
  let nameTimeout;
  userNameInput.addEventListener("input", () => {
    clearTimeout(nameTimeout);
    nameTimeout = setTimeout(() => {
      save("userName", userNameInput.value.trim() || "User");
    }, 500);
  });

  // Speed
  speedSlider.addEventListener("input", () => {
    const val = parseFloat(speedSlider.value);
    speedValue.textContent = `${val}×`;
    save("animationSpeed", val);
  });

  // Render mode
  renderModeToggle.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      renderModeToggle
        .querySelectorAll("button")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      save("renderMode", btn.dataset.value);
    });
  });
});
