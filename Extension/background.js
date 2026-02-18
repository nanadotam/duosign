/**
 * DuoSign Extension — background.js
 * ─────────────────────────────────
 * This is a service worker. It runs invisibly in the background.
 *
 * Responsibilities:
 *  1. Receive messages from content.js and popup.js
 *  2. Call the DuoSign API (it can do this freely, no CORS issues)
 *  3. Send results back to whoever asked
 *  4. Create the right-click context menu
 *  5. Handle keyboard shortcuts (commands)
 */

// ─── CONFIG ───────────────────────────────────────────────────────────────────
// Switch this to your production URL when you deploy
const API_BASE = "http://localhost:8000";

// ─── CONTEXT MENU ─────────────────────────────────────────────────────────────
// This creates the "Translate with DuoSign" option when user right-clicks
// selected text on any webpage.
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "duosign-translate",
    title: "Translate with DuoSign",
    contexts: ["selection"],   // only show when text is selected
  });
});

// When user clicks the context menu item
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "duosign-translate" && info.selectionText) {
    // Store the selected text so popup can read it when it opens
    chrome.storage.local.set({
      pendingText: info.selectionText.trim(),
      pendingSource: "context-menu"
    });
    // Open the popup (this simulates clicking the extension icon)
    // Note: chrome.action.openPopup() requires userGesture permission in MV3
    // So we just notify the content script to show a toast instead
    chrome.tabs.sendMessage(tab.id, {
      type: "CONTEXT_MENU_TRANSLATE",
      text: info.selectionText.trim()
    });
  }
});

// ─── KEYBOARD SHORTCUT ────────────────────────────────────────────────────────
chrome.commands.onCommand.addListener((command, tab) => {
  if (command === "translate-selection") {
    // Tell the content script to grab whatever text is selected
    chrome.tabs.sendMessage(tab.id, { type: "GRAB_SELECTION" });
  }
});

// ─── MESSAGE HANDLER ─────────────────────────────────────────────────────────
// This is the main hub. Both content.js and popup.js send messages here.
//
// Message format:
//   { type: "TRANSLATE", text: "Hello world" }
//   { type: "GET_HISTORY" }
//
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  if (message.type === "TRANSLATE") {
    // Call your DuoSign API and return the gloss tokens + pose data
    callTranslateAPI(message.text)
      .then(result => sendResponse({ ok: true, data: result }))
      .catch(err  => sendResponse({ ok: false, error: err.message }));

    // IMPORTANT: return true to keep the message channel open for async response
    return true;
  }

  if (message.type === "GET_HISTORY") {
    chrome.storage.local.get("history", (data) => {
      sendResponse({ ok: true, history: data.history || [] });
    });
    return true;
  }

  if (message.type === "SAVE_HISTORY_ITEM") {
    saveToHistory(message.item);
    sendResponse({ ok: true });
    return true;
  }

  if (message.type === "GET_PENDING_TEXT") {
    chrome.storage.local.get(["pendingText", "pendingSource"], (data) => {
      sendResponse({ ok: true, text: data.pendingText || null, source: data.pendingSource || null });
      // Clear it after reading
      chrome.storage.local.remove(["pendingText", "pendingSource"]);
    });
    return true;
  }

  if (message.type === "GET_SETTINGS") {
    chrome.storage.local.get("settings", (data) => {
      sendResponse({ ok: true, settings: data.settings || DEFAULT_SETTINGS });
    });
    return true;
  }

  if (message.type === "SAVE_SETTINGS") {
    chrome.storage.local.set({ settings: message.settings });
    sendResponse({ ok: true });
    return true;
  }

});

// ─── API CALL ────────────────────────────────────────────────────────────────
/**
 * Calls the DuoSign backend API.
 * Returns: { gloss: string[], poses: PoseSequence[], latency_ms: number }
 *
 * This matches your existing FastAPI endpoint:
 *   POST /api/v1/translate
 *   Body: { text: string, engine: "hybrid" | "rule" | "llm" }
 */
async function callTranslateAPI(text, engine = "hybrid") {
  const settings = await getSettings();
  const actualEngine = engine || settings.engine || "hybrid";

  const response = await fetch(`${API_BASE}/api/v1/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, engine: actualEngine })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `API error ${response.status}`);
  }

  const data = await response.json();

  // Save to local history after successful translation
  await saveToHistory({
    id: Date.now().toString(),
    text,
    gloss: data.gloss,
    timestamp: new Date().toISOString(),
    source: "extension",
    latency_ms: data.latency_ms
  });

  return data;
}

// ─── HISTORY ─────────────────────────────────────────────────────────────────
async function saveToHistory(item) {
  const data = await chrome.storage.local.get("history");
  const history = data.history || [];
  // Prepend new item, keep last 50
  history.unshift(item);
  if (history.length > 50) history.length = 50;
  await chrome.storage.local.set({ history });
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

async function getSettings() {
  const data = await chrome.storage.local.get("settings");
  return { ...DEFAULT_SETTINGS, ...(data.settings || {}) };
}
