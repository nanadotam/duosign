/**
 * DuoSign Extension — Popup Script
 * ==================================
 * Loads user name from storage, handles mode button + settings clicks.
 */

document.addEventListener("DOMContentLoaded", () => {
  // ── Load user greeting ────────────────────────────────────────────
  chrome.storage.sync.get(["userName"], (result) => {
    const name = result.userName || "User";
    document.getElementById("greetingName").textContent = `Hello, ${name}!`;
  });

  // ── Mode buttons → open side panel in the correct mode ────────────
  document.getElementById("btnTextSelection").addEventListener("click", () => {
    chrome.runtime.sendMessage({
      type: "OPEN_SIDE_PANEL",
      mode: "text-selection",
    });
    window.close();
  });

  document.getElementById("btnYoutube").addEventListener("click", () => {
    chrome.runtime.sendMessage({
      type: "OPEN_SIDE_PANEL",
      mode: "youtube",
    });
    window.close();
  });

  document.getElementById("btnPdf").addEventListener("click", () => {
    chrome.runtime.sendMessage({
      type: "OPEN_SIDE_PANEL",
      mode: "pdf",
    });
    window.close();
  });

  // ── Settings ──────────────────────────────────────────────────────
  document.getElementById("btnSettings").addEventListener("click", () => {
    chrome.runtime.openOptionsPage
      ? chrome.runtime.openOptionsPage()
      : window.open("settings.html");
  });
});
