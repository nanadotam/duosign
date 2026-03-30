/**
 * DuoSign Extension — Popup Script
 * ===================================
 * Handles:
 *  - First-install detection and download flow
 *  - Backend health check indicator
 *  - Mode button navigation
 *  - Settings gear navigation
 */

document.addEventListener("DOMContentLoaded", async () => {
  const greeting = document.getElementById("greeting");
  const modeButtons = document.getElementById("modeButtons");
  const settingsBtn = document.getElementById("settingsBtn");
  const healthDot = document.getElementById("healthDot");
  const healthLabel = document.getElementById("healthLabel");
  const downloadOverlay = document.getElementById("downloadOverlay");
  const downloadProgress = document.getElementById("downloadProgress");
  const downloadLabel = document.getElementById("downloadLabel");
  const downloadBar = document.getElementById("downloadBar");

  // ── Load user name ──────────────────────────────────────────────
  chrome.storage.sync.get("userName", (result) => {
    const name = result.userName || "User";
    greeting.textContent = `👋 Hello, ${name}!`;
  });

  // ── Settings button ─────────────────────────────────────────────
  settingsBtn.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });

  // ── Health check ────────────────────────────────────────────────
  try {
    const result = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: "HEALTH_CHECK" }, resolve);
    });
    if (result?.ok) {
      healthDot.classList.add("online");
      healthLabel.textContent = `Connected — v${result.data.version}`;
    } else {
      healthDot.classList.add("offline");
      healthLabel.textContent = "Backend unreachable";
    }
  } catch {
    healthDot.classList.add("offline");
    healthLabel.textContent = "Backend unreachable";
  }

  // ── First-install check ─────────────────────────────────────────
  const { firstInstallComplete } = await chrome.storage.local.get(
    "firstInstallComplete",
  );

  if (!firstInstallComplete) {
    downloadOverlay.classList.add("visible");
    modeButtons.style.display = "none";

    try {
      await window.assetManager.init();
      const status = await window.assetManager.checkFirstInstall();

      if (!status.ready) {
        await window.assetManager.runFirstInstall((progress) => {
          downloadLabel.textContent = progress.label;
          if (progress.total > 0) {
            const pct = Math.round((progress.loaded / progress.total) * 100);
            downloadBar.style.width = `${pct}%`;
            downloadProgress.textContent = `${pct}%`;
          }
        });
      }

      downloadLabel.textContent = "Ready! 🎉";
      downloadBar.style.width = "100%";
      downloadProgress.textContent = "100%";

      await new Promise((r) => setTimeout(r, 800));
      downloadOverlay.classList.remove("visible");
      modeButtons.style.display = "";
    } catch (err) {
      downloadLabel.textContent = `Download failed: ${err.message}`;
      downloadProgress.textContent = "Error";
    }
  }

  // ── Mode buttons ────────────────────────────────────────────────
  document.querySelectorAll(".mode-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.mode;
      chrome.storage.local.set({ activeMode: mode });

      // Open the side panel
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.sidePanel.open({ tabId: tabs[0].id });
        }
      });
    });
  });
});
