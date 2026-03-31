/**
 * DuoSign Extension — Service Worker (Background)
 * ==================================================
 * Manifest V3 service worker handling:
 *  - Context menu: "Send to DuoSign" on selected text
 *  - Message routing: relay API calls from content/popup/sidepanel
 *  - Keyboard shortcut: Ctrl+Shift+P / ⌘+Shift+P
 *  - Side panel management
 *  - Auth header injection for all API calls
 */

// ── Environment detection ────────────────────────────────────────────
// Dev: points to local FastAPI + Next.js. Prod: Render + Vercel.
const IS_DEV = !("update_url" in chrome.runtime.getManifest());

const API_BASE_URL = IS_DEV
  ? "http://localhost:8000"        // FastAPI dev server
  : "https://duosign.onrender.com"; // FastAPI on Render

const WEB_APP_URL = IS_DEV
  ? "http://localhost:3000"
  : "https://duosign.vercel.app";

const AUTH_STORAGE_KEY = "duosign_auth_session";

/** Get auth headers from stored session */
async function getAuthHeaders() {
  try {
    const stored = await chrome.storage.local.get(AUTH_STORAGE_KEY);
    const session = stored[AUTH_STORAGE_KEY];
    if (session?.token) {
      return { Authorization: `Bearer ${session.token}` };
    }
  } catch {}
  return {};
}

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
    chrome.sidePanel.open({ tabId: tab.id }).then(() => {
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
  if (command === "send-to-duosign") {
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
// Auth headers are automatically injected from stored session.

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.type) {
    case "TRANSLATE":
      (async () => {
        const auth = await getAuthHeaders();
        fetch(`${API_BASE_URL}/api/translate/fast`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...auth },
          body: JSON.stringify({ text: msg.text }),
        })
          .then((r) => r.json())
          .then((data) => sendResponse({ ok: true, data }))
          .catch((err) => sendResponse({ ok: false, error: err.message }));
      })();
      return true;

    case "TRANSLATE_FULL":
      (async () => {
        const auth = await getAuthHeaders();
        fetch(`${API_BASE_URL}/api/translate`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...auth },
          body: JSON.stringify({ text: msg.text }),
        })
          .then((r) => r.json())
          .then((data) => sendResponse({ ok: true, data }))
          .catch((err) => sendResponse({ ok: false, error: err.message }));
      })();
      return true;

    case "FETCH_POSE":
      (async () => {
        const auth = await getAuthHeaders();
        fetch(`${API_BASE_URL}/api/pose/${encodeURIComponent(msg.gloss)}`, {
          headers: auth,
        })
          .then((r) => {
            if (!r.ok) throw new Error(`${r.status}`);
            return r.arrayBuffer();
          })
          .then((buf) =>
            sendResponse({ ok: true, data: Array.from(new Uint8Array(buf)) }),
          )
          .catch((err) => sendResponse({ ok: false, error: err.message }));
      })();
      return true;

    case "HEALTH_CHECK":
      fetch(`${API_BASE_URL}/api/health`)
        .then((r) => r.json())
        .then((data) => sendResponse({ ok: true, data }))
        .catch((err) => sendResponse({ ok: false, error: err.message }));
      return true;

    case "FETCH_VOCABULARY":
      (async () => {
        const auth = await getAuthHeaders();
        fetch(`${API_BASE_URL}/api/vocabulary`, { headers: auth })
          .then((r) => r.json())
          .then((data) => sendResponse({ ok: true, data }))
          .catch((err) => sendResponse({ ok: false, error: err.message }));
      })();
      return true;

    case "SAVE_AUTH_SESSION":
      chrome.storage.local.set(
        {
          [AUTH_STORAGE_KEY]: msg.session,
        },
        () => sendResponse({ ok: true }),
      );
      return true;

    case "CLEAR_AUTH_SESSION":
      chrome.storage.local.remove(AUTH_STORAGE_KEY, () =>
        sendResponse({ ok: true }),
      );
      return true;

    case "GET_AUTH_SESSION":
      chrome.storage.local.get(AUTH_STORAGE_KEY, (stored) =>
        sendResponse({ ok: true, session: stored[AUTH_STORAGE_KEY] ?? null }),
      );
      return true;

    // Open the web-app sign-in page with extension context
    case "OPEN_SIGN_IN": {
      const signInUrl = `${WEB_APP_URL}/auth/sign-in?source=extension&ext_id=${chrome.runtime.id}`;
      chrome.tabs.create({ url: signInUrl });
      sendResponse({ ok: true });
      return true;
    }

    default:
      break;
  }
});

// ── External Messages (from web app pages) ──────────────────────────
// The sign-in page at /auth/sign-in?source=extension posts the session
// token via chrome.runtime.sendMessage(extId, msg) after successful login.
// Requires "externally_connectable" in manifest.json.

chrome.runtime.onMessageExternal.addListener((msg, sender, sendResponse) => {
  // Only accept messages from trusted web origins
  const trustedOrigins = [WEB_APP_URL, "http://localhost:3000"];
  if (!trustedOrigins.some((o) => sender.url?.startsWith(o))) {
    sendResponse({ ok: false, error: "Untrusted origin" });
    return;
  }

  if (msg.type === "SAVE_AUTH_SESSION" && msg.session) {
    chrome.storage.local.set({ [AUTH_STORAGE_KEY]: msg.session }, () => {
      console.log("[DuoSign BG] Auth session saved from web app for", msg.session.email);
      // Notify all extension pages that auth has changed
      chrome.runtime.sendMessage({ type: "AUTH_CHANGED", session: msg.session }).catch(() => {});
      sendResponse({ ok: true });
    });
    return true;
  }

  if (msg.type === "CLEAR_AUTH_SESSION") {
    chrome.storage.local.remove(AUTH_STORAGE_KEY, () => {
      chrome.runtime.sendMessage({ type: "AUTH_CHANGED", session: null }).catch(() => {});
      sendResponse({ ok: true });
    });
    return true;
  }

  sendResponse({ ok: false, error: "Unknown message type" });
});

// ── Side Panel Config ───────────────────────────────────────────────

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
