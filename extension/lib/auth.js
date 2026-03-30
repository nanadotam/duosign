/**
 * DuoSign Extension — Auth Module
 * ==================================
 * Handles authentication state between the extension and the main DuoSign web app.
 *
 * Flow:
 *  1. Check for saved session in chrome.storage.local
 *  2. If no session → show "Sign in" → opens DuoSign web app login
 *  3. After login, user clicks "Connect Extension" button in web app
 *  4. Extension reads session via better-auth API on the web app domain
 *  5. Session token stored in chrome.storage.local for API calls
 *
 * The web app uses better-auth (emailAndPassword) with session cookies.
 */

const AUTH_STORAGE_KEY = "duosign_auth_session";

// Resolve base URL: localhost in dev, production URL otherwise
function getAppBaseURL() {
  // In development, the frontend runs on localhost:3000
  return "http://localhost:3000";
}

/**
 * Check if user is authenticated.
 * @returns {Promise<{authenticated: boolean, user: object|null}>}
 */
async function checkAuthStatus() {
  const stored = await chrome.storage.local.get(AUTH_STORAGE_KEY);
  const session = stored[AUTH_STORAGE_KEY];

  if (!session || !session.token) {
    return { authenticated: false, user: null };
  }

  // Validate session is still alive by calling better-auth session endpoint
  try {
    const res = await fetch(`${getAppBaseURL()}/api/auth/get-session`, {
      headers: {
        Authorization: `Bearer ${session.token}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.session) {
        return { authenticated: true, user: data.user || session.user };
      }
    }
  } catch {
    // Network error — use cached session optimistically
    if (session.user) {
      return { authenticated: true, user: session.user };
    }
  }

  // Session expired
  await chrome.storage.local.remove(AUTH_STORAGE_KEY);
  return { authenticated: false, user: null };
}

/**
 * Save session to chrome.storage.local
 * @param {{ token: string, user: { name: string, email: string } }} session
 */
async function saveSession(session) {
  await chrome.storage.local.set({
    [AUTH_STORAGE_KEY]: {
      token: session.token,
      user: session.user,
      savedAt: Date.now(),
    },
  });
}

/**
 * Clear saved session (logout).
 */
async function clearSession() {
  await chrome.storage.local.remove(AUTH_STORAGE_KEY);
}

/**
 * Open the DuoSign web app login page.
 */
function openLoginPage() {
  const loginURL = `${getAppBaseURL()}/auth/sign-in?source=extension`;
  chrome.tabs.create({ url: loginURL });
}

/**
 * Get auth headers for API calls.
 * @returns {Promise<Record<string, string>>}
 */
async function getAuthHeaders() {
  const stored = await chrome.storage.local.get(AUTH_STORAGE_KEY);
  const session = stored[AUTH_STORAGE_KEY];
  if (session?.token) {
    return { Authorization: `Bearer ${session.token}` };
  }
  return {};
}

/**
 * Try to extract session from the web app via cookies.
 * This works because host_permissions includes localhost:3000.
 */
async function tryExtractSessionFromWebApp() {
  try {
    const res = await fetch(`${getAppBaseURL()}/api/auth/get-session`, {
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.session && data?.user) {
        await saveSession({
          token: data.session.token || data.session.id,
          user: {
            name: data.user.name,
            email: data.user.email,
          },
        });
        return { authenticated: true, user: data.user };
      }
    }
  } catch {
    // Web app not reachable
  }
  return { authenticated: false, user: null };
}

// Expose to window
window.DuoSignAuth = {
  checkAuthStatus,
  saveSession,
  clearSession,
  openLoginPage,
  getAuthHeaders,
  tryExtractSessionFromWebApp,
  getAppBaseURL,
};
