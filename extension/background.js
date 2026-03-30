/**
 * DuoSign Extension — Background Service Worker
 * ================================================
 * Handles context menus, keyboard shortcuts, message routing,
 * and page-type detection (YouTube / PDF).
 */

// ── Context Menu Setup ──────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "send-to-duosign",
    title: "Send to DuoSign",
    contexts: ["selection"],
  });

  // Initialize default settings
  chrome.storage.sync.get(
    ["userName", "animationSpeed", "renderMode"],
    (result) => {
      if (!result.userName) {
        chrome.storage.sync.set({
          userName: "User",
          animationSpeed: 1,
          renderMode: "skeleton",
        });
      }
    },
  );
});

// ── Context Menu Click ──────────────────────────────────────────────
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "send-to-duosign" && info.selectionText) {
    // Store selected text and open side panel
    chrome.storage.session.set({
      selectedText: info.selectionText,
      sourceMode: "text-selection",
    });
    chrome.sidePanel.open({ tabId: tab.id });
  }
});

// ── Keyboard Shortcut ───────────────────────────────────────────────
chrome.commands.onCommand.addListener((command, tab) => {
  if (command === "send-to-duosign") {
    // Ask content script for selected text
    chrome.tabs.sendMessage(tab.id, { type: "GET_SELECTION" }, (response) => {
      if (response?.text) {
        chrome.storage.session.set({
          selectedText: response.text,
          sourceMode: "text-selection",
        });
        chrome.sidePanel.open({ tabId: tab.id });
      }
    });
  }
});

// ── Message Routing ─────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case "OPEN_SIDE_PANEL":
      chrome.storage.session.set({
        sourceMode: message.mode || "text-selection",
        selectedText: message.text || "",
      });
      if (sender.tab) {
        chrome.sidePanel.open({ tabId: sender.tab.id });
      }
      break;

    case "YOUTUBE_CAPTION":
      // Forward caption text to the side panel
      chrome.storage.session.set({
        selectedText: message.text,
        sourceMode: "youtube",
      });
      break;

    case "PDF_DETECTED":
      chrome.storage.session.set({
        sourceMode: "pdf",
        pdfUrl: message.url || "",
      });
      break;

    case "TRANSLATE_TEXT":
      // Forward translation request — side panel handles API calls directly
      break;
  }

  sendResponse({ ok: true });
  return true;
});

// ── Side Panel Behavior ─────────────────────────────────────────────
// Enable side panel to open via the extension icon for all URLs
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: false })
  .catch(() => {});
