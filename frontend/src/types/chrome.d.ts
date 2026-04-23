/**
 * Minimal Chrome Extension API type stubs for the Next.js frontend.
 * The sign-in page calls chrome.runtime.sendMessage to pass the auth token
 * to the extension when the user completes login via the extension flow.
 *
 * Full types are in @types/chrome — these stubs cover only what we use.
 */

interface ChromeRuntimeLastError {
  message?: string;
}

interface ChromeRuntime {
  id?: string;
  sendMessage(
    extensionId: string,
    message: unknown,
    callback?: (response: { ok: boolean; session?: unknown; error?: string }) => void
  ): void;
  lastError?: ChromeRuntimeLastError;
}

interface Chrome {
  runtime: ChromeRuntime;
}

declare const chrome: Chrome | undefined;
