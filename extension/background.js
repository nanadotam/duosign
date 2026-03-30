/**
 * DuoSign Extension — Service Worker (Background)
 * ==================================================
 * Manifest V3 service worker handling:
 *  - Context menu: "Send to DuoSign" on selected text
 *  - Message routing: relay API calls from content/popup/sidepanel
 *  - Keyboard shortcut: Ctrl+Shift+S
 *  - Side panel management
 */

const API_BASE_URL = "https://duosign.onrender.com";

// ── Context Menu ────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "duosign-translate",
    title: "Send to DuoSign",
    contexts: ["selection"],
  });

  // Check if first install
  chrome.storage.local.get("firstInstallComplete", (result) => {
    if (!result.firstInstallComplete) {
      console.log(
        "[DuoSign BG] First install detected — will show setup on popup open",
      );
    }
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "duosign-translate" && info.selectionText) {
    // Open the side panel and send the text
    chrome.sidePanel.open({ tabId: tab.id }).then(() => {
      // Small delay to let side panel mount
      setTimeout(() => {
        chrome.runtime.sendMessage({
          type: "TRANSLATE_TEXT",
          text: info.selectionText.trim(),
        });
      }, 300);
    });
  }
});

// ── Keyboard Shortcut ───────────────────────────────────────────────

chrome.commands.onCommand.addListener((command, tab) => {
  if (command === "translate-selection") {
    // Ask content script for selected text
    chrome.tabs.sendMessage(tab.id, { type: "GET_SELECTION" }, (response) => {
      if (response?.text) {
        chrome.sidePanel.open({ tabId: tab.id }).then(() => {
          setTimeout(() => {
            chrome.runtime.sendMessage({
              type: "TRANSLATE_TEXT",
              text: response.text.trim(),
            });
          }, 300);
        });
      }
    });
  }
});

// ── Message Routing (API Proxy) ─────────────────────────────────────
// All API calls from extension pages are routed through here to bypass CORS.

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.type) {
    case "TRANSLATE":
      fetch(`${API_BASE_URL}/api/translate/fast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: msg.text }),
      })
        .then((r) => r.json())
        .then((data) => sendResponse({ ok: true, data }))
        .catch((err) => sendResponse({ ok: false, error: err.message }));
      return true; // async

    case "TRANSLATE_FULL":
      fetch(`${API_BASE_URL}/api/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: msg.text }),
      })
        .then((r) => r.json())
        .then((data) => sendResponse({ ok: true, data }))
        .catch((err) => sendResponse({ ok: false, error: err.message }));
      return true;

    case "FETCH_POSE":
      fetch(`${API_BASE_URL}/api/pose/${encodeURIComponent(msg.gloss)}`)
        .then((r) => {
          if (!r.ok) throw new Error(`${r.status}`);
          return r.arrayBuffer();
        })
        .then((buf) =>
          sendResponse({ ok: true, data: Array.from(new Uint8Array(buf)) }),
        )
        .catch((err) => sendResponse({ ok: false, error: err.message }));
      return true;

    case "HEALTH_CHECK":
      fetch(`${API_BASE_URL}/api/health`)
        .then((r) => r.json())
        .then((data) => sendResponse({ ok: true, data }))
        .catch((err) => sendResponse({ ok: false, error: err.message }));
      return true;

    case "FETCH_VOCABULARY":
      fetch(`${API_BASE_URL}/api/vocabulary`)
        .then((r) => r.json())
        .then((data) => sendResponse({ ok: true, data }))
        .catch((err) => sendResponse({ ok: false, error: err.message }));
      return true;

    default:
      break;
  }
});

// ── Side Panel Config ───────────────────────────────────────────────

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
