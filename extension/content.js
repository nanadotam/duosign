/**
 * DuoSign Extension — Content Script
 * =====================================
 * Runs on all pages. Handles:
 * - Text selection detection (responds to background requests)
 * - PDF detection (notifies background when viewing a PDF)
 */

// ── Respond to background requests for selected text ────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_SELECTION") {
    const text = window.getSelection()?.toString()?.trim() || "";
    sendResponse({ text });
  }
  return true;
});

// ── PDF Detection ───────────────────────────────────────────────────
// Detect if the current page is a PDF (Chrome built-in viewer or .pdf URL)
function detectPDF() {
  const url = window.location.href;
  const isPDF =
    url.endsWith(".pdf") ||
    url.includes("content-type=application/pdf") ||
    document.contentType === "application/pdf";

  if (isPDF) {
    chrome.runtime.sendMessage({
      type: "PDF_DETECTED",
      url: url,
    });
  }
}

// Run PDF detection after a short delay (let the page load)
setTimeout(detectPDF, 500);

// ── Floating Selection Indicator ────────────────────────────────────
// When text is selected, show a small DuoSign indicator near the selection
let fabEl = null;

function showFAB(x, y) {
  if (!fabEl) {
    fabEl = document.createElement("div");
    fabEl.id = "duosign-fab";
    fabEl.innerHTML = `
      <div style="
        position: fixed;
        z-index: 2147483647;
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: linear-gradient(135deg, #5b8ef0, #2dd4bf);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        font-size: 10px;
        font-weight: 700;
        color: #fff;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        transition: transform 0.15s;
        pointer-events: auto;
      " title="Send to DuoSign">DS</div>
    `;
    document.body.appendChild(fabEl);

    fabEl.addEventListener("click", () => {
      const text = window.getSelection()?.toString()?.trim();
      if (text) {
        chrome.runtime.sendMessage({
          type: "OPEN_SIDE_PANEL",
          mode: "text-selection",
          text: text,
        });
      }
      hideFAB();
    });
  }

  const inner = fabEl.firstElementChild;
  inner.style.left = `${Math.min(x, window.innerWidth - 48)}px`;
  inner.style.top = `${Math.max(y - 40, 8)}px`;
  fabEl.style.display = "block";
}

function hideFAB() {
  if (fabEl) fabEl.style.display = "none";
}

// Show FAB near text selection on mouseup
document.addEventListener("mouseup", (e) => {
  // Don't show on YouTube — it has its own overlay
  if (window.location.hostname === "www.youtube.com") return;

  setTimeout(() => {
    const text = window.getSelection()?.toString()?.trim();
    if (text && text.length > 0) {
      showFAB(e.clientX, e.clientY);
    } else {
      hideFAB();
    }
  }, 10);
});

// Hide FAB when clicking elsewhere
document.addEventListener("mousedown", (e) => {
  if (fabEl && !fabEl.contains(e.target)) {
    hideFAB();
  }
});
