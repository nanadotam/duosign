/**
 * DuoSign Extension — content.js
 * ────────────────────────────────
 * Chrome injects this script into EVERY webpage the user visits.
 * It runs in the context of the page (has access to the DOM).
 *
 * Responsibilities:
 *  1. Watch for text selections on the page
 *  2. Show a small floating "Sign it" button near the selection
 *  3. On click → send text to background.js → open popup with result
 *  4. Listen for messages from background.js (keyboard shortcut trigger)
 *
 * IMPORTANT: This file cannot import anything. No npm packages.
 * It's plain vanilla JS injected raw into third-party pages.
 */

(function () {
  // Guard: don't inject twice
  if (window.__duosignInjected) return;
  window.__duosignInjected = true;

  // ─── STATE ────────────────────────────────────────────────────────────────
  let floatBtn = null;
  let hideTimer = null;
  let currentSelection = "";

  // ─── CREATE THE FLOATING BUTTON ───────────────────────────────────────────
  function createFloatBtn() {
    const btn = document.createElement("div");
    btn.id = "__duosign_float";
    btn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        <line x1="12" y1="19" x2="12" y2="23"/>
        <line x1="8" y1="23" x2="16" y2="23"/>
      </svg>
      <span>Sign it</span>
    `;

    // Styles — all scoped to this element to avoid conflicts with the page
    Object.assign(btn.style, {
      position: "fixed",
      zIndex: "2147483647",  // max z-index
      display: "flex",
      alignItems: "center",
      gap: "5px",
      padding: "5px 11px",
      borderRadius: "999px",
      background: "linear-gradient(180deg, #6B9CF2 0%, #3B6BD0 100%)",
      color: "#ffffff",
      fontSize: "12px",
      fontFamily: "'DM Sans', -apple-system, sans-serif",
      fontWeight: "600",
      cursor: "pointer",
      boxShadow: "0 2px 12px rgba(59,107,208,0.5), 0 1px 0 rgba(255,255,255,0.2) inset",
      border: "1px solid rgba(59,107,208,0.8)",
      userSelect: "none",
      transition: "opacity 0.15s, transform 0.15s",
      opacity: "0",
      transform: "translateY(4px)",
      pointerEvents: "none",
      letterSpacing: "0.01em",
      lineHeight: "1",
    });

    btn.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleSignIt(currentSelection);
    });

    // Prevent button hover from clearing the selection
    btn.addEventListener("mouseover", () => {
      clearTimeout(hideTimer);
    });

    document.body.appendChild(btn);
    return btn;
  }

  // ─── SHOW / HIDE ──────────────────────────────────────────────────────────
  function showBtn(x, y) {
    if (!floatBtn) floatBtn = createFloatBtn();

    // Position near selection — above it, centered
    const btnW = 90;
    const left = Math.max(8, Math.min(x - btnW / 2, window.innerWidth - btnW - 8));
    const top  = Math.max(8, y - 44);

    floatBtn.style.left = left + "px";
    floatBtn.style.top  = top  + "px";
    floatBtn.style.pointerEvents = "auto";

    // Trigger animation
    requestAnimationFrame(() => {
      floatBtn.style.opacity = "1";
      floatBtn.style.transform = "translateY(0)";
    });
  }

  function hideBtn() {
    if (!floatBtn) return;
    floatBtn.style.opacity = "0";
    floatBtn.style.transform = "translateY(4px)";
    floatBtn.style.pointerEvents = "none";
  }

  // ─── SELECTION DETECTION ─────────────────────────────────────────────────
  document.addEventListener("mouseup", (e) => {
    // Small delay so the selection is finalized
    setTimeout(() => {
      const sel = window.getSelection();
      const text = sel ? sel.toString().trim() : "";

      if (text.length > 2 && text.length < 500) {
        currentSelection = text;
        const range = sel.getRangeAt(0);
        const rect  = range.getBoundingClientRect();
        showBtn(
          rect.left + rect.width / 2 + window.scrollX,
          rect.top  + window.scrollY
        );
      } else {
        // Use a timer so clicking the button doesn't immediately hide it
        hideTimer = setTimeout(hideBtn, 200);
      }
    }, 10);
  });

  // Hide when user clicks elsewhere
  document.addEventListener("mousedown", (e) => {
    if (floatBtn && e.target !== floatBtn && !floatBtn.contains(e.target)) {
      hideTimer = setTimeout(hideBtn, 200);
    }
  });

  // ─── HANDLE TRANSLATE ────────────────────────────────────────────────────
  function handleSignIt(text) {
    if (!text) return;
    hideBtn();

    // Store the text so the popup can read it when it opens
    chrome.storage.local.set({
      pendingText: text,
      pendingSource: "page-selection"
    });

    // Show a small loading toast on the page
    showToast("Opening DuoSign…");

    // The popup will open when user clicks the extension icon.
    // We can't programmatically open it in MV3 without a user gesture on the icon.
    // Instead, show a badge on the icon to draw attention.
    chrome.runtime.sendMessage({
      type: "SELECTION_READY",
      text
    });
  }

  // ─── TOAST ───────────────────────────────────────────────────────────────
  function showToast(message, duration = 2500) {
    const existing = document.getElementById("__duosign_toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.id = "__duosign_toast";
    toast.textContent = message;
    Object.assign(toast.style, {
      position: "fixed",
      bottom: "24px",
      left: "50%",
      transform: "translateX(-50%) translateY(8px)",
      zIndex: "2147483646",
      background: "rgba(20,22,29,0.95)",
      color: "#EDF0FF",
      padding: "8px 18px",
      borderRadius: "999px",
      fontSize: "13px",
      fontFamily: "'DM Sans', -apple-system, sans-serif",
      fontWeight: "500",
      border: "1px solid #363A4E",
      boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
      backdropFilter: "blur(10px)",
      transition: "opacity 0.2s, transform 0.2s",
      opacity: "0",
      pointerEvents: "none",
    });
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateX(-50%) translateY(0)";
    });

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(-50%) translateY(8px)";
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  // ─── MESSAGE LISTENER ────────────────────────────────────────────────────
  // Background.js can send messages to this content script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    if (message.type === "GRAB_SELECTION") {
      // Keyboard shortcut was pressed — grab current selection
      const sel = window.getSelection();
      const text = sel ? sel.toString().trim() : "";
      if (text) {
        handleSignIt(text);
        sendResponse({ ok: true, text });
      } else {
        showToast("Select some text first, then press ⌘⇧S");
        sendResponse({ ok: false });
      }
      return true;
    }

    if (message.type === "CONTEXT_MENU_TRANSLATE") {
      showToast("Opening DuoSign…");
      sendResponse({ ok: true });
      return true;
    }

    if (message.type === "SHOW_TOAST") {
      showToast(message.text, message.duration);
      sendResponse({ ok: true });
      return true;
    }

  });

})();
