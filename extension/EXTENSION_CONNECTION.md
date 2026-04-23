# DuoSign Extension ↔ Server Connection Documentation

## Overview

The DuoSign Chrome extension communicates with the DuoSign backend (FastAPI) and frontend (Next.js) through a **service worker API proxy** pattern. All requests are routed through `background.js` to bypass CORS restrictions, since Chrome extensions use the origin `chrome-extension://<id>` which doesn't match the backend's CORS allowlist.

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│  Chrome Extension                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │ popup.js │  │sidepanel │  │ content.js       │   │
│  │          │  │   .js    │  │ youtube-overlay  │   │
│  └────┬─────┘  └────┬─────┘  └───────┬──────────┘   │
│       │              │                │               │
│       └──────┬───────┴────────────────┘               │
│              │ chrome.runtime.sendMessage              │
│       ┌──────▼──────┐                                 │
│       │background.js│  ← Service Worker (API Proxy)   │
│       └──────┬──────┘                                 │
└──────────────┼────────────────────────────────────────┘
               │ fetch (with host_permissions)
               │
    ┌──────────▼──────────────────────────────┐
    │  Backend (FastAPI)                       │
    │  https://duosign.onrender.com            │
    │  or http://localhost:8000 (dev)          │
    └─────────────────────────────────────────┘

    ┌─────────────────────────────────────────┐
    │  Frontend (Next.js / better-auth)        │
    │  http://localhost:3000 (dev)             │
    │  https://duosign.vercel.app (prod)      │
    └─────────────────────────────────────────┘

    ┌─────────────────────────────────────────┐
    │  Supabase Storage                        │
    │  VRM avatars (~20 MB each)              │
    │  https://yqhuvnbgtrbjrfmykznk           │
    │  .supabase.co/storage/v1/object/public  │
    │  /duosign-avatars/                      │
    └─────────────────────────────────────────┘
```

---

## REST API Endpoints

### Translation

| Endpoint | Method | Body | Response | Used By |
|---|---|---|---|---|
| `/api/translate/fast` | POST | `{ text: string }` | `{ input_text, gloss, tokens, method, confidence }` | Side panel (instant) |
| `/api/translate/stream` | POST (SSE) | `{ text: string }` | SSE events: `rule_based`, `llm_quality`, `done` | Side panel (progressive) |
| `/api/translate` | POST | `{ text: string }` | Full pipeline result | Side panel (full quality) |

### Media

| Endpoint | Method | Returns | Used By |
|---|---|---|---|
| `/api/pose/{gloss}` | GET | Binary `.pose` file (ArrayBuffer) | Skeleton renderer, VRM pose player |
| `/api/video/{gloss}` | GET | Video file (302 → Supabase) | Video engine (3D avatar) |

### System

| Endpoint | Method | Response | Used By |
|---|---|---|---|
| `/api/health` | GET | `{ status, version, gloss_count }` | Popup health dot |
| `/api/vocabulary` | GET | `{ total, glosses, has_full_alphabet }` | Future: autocomplete |

---

## Message Routing (background.js)

The service worker (`background.js`) acts as a proxy. Extension pages send messages via `chrome.runtime.sendMessage()`:

```javascript
// From sidepanel.js or popup.js:
chrome.runtime.sendMessage(
  { type: "TRANSLATE", text: "Hello world" },
  (response) => {
    if (response.ok) {
      console.log(response.data); // translation result
    }
  }
);

// From popup.js:
chrome.runtime.sendMessage(
  { type: "HEALTH_CHECK" },
  (response) => {
    console.log(response.data); // { status, version, gloss_count }
  }
);
```

### Supported Message Types

| Message Type | Payload | Proxied To |
|---|---|---|
| `TRANSLATE` | `{ text }` | `POST /api/translate/fast` |
| `TRANSLATE_FULL` | `{ text }` | `POST /api/translate` |
| `FETCH_POSE` | `{ gloss }` | `GET /api/pose/{gloss}` |
| `HEALTH_CHECK` | — | `GET /api/health` |
| `FETCH_VOCABULARY` | — | `GET /api/vocabulary` |

---

## Authentication Flow

DuoSign uses **better-auth** with email/password authentication. The auth session lives on the web app's domain.

### How It Works

1. **User opens popup** → extension checks `chrome.storage.local` for saved session
2. **No session found** → shows "Sign In" button → opens `http://localhost:3000/auth/sign-in?source=extension`
3. **User logs in on web app** → session cookie is set on the web app domain
4. **Extension reads session** → calls `GET /api/auth/get-session` on the web app domain using `host_permissions`
5. **Session saved** → stored in `chrome.storage.local` as `duosign_auth_session`
6. **API calls include auth** → background.js attaches `Authorization: Bearer <token>` header

### Auth Storage Schema

```javascript
// chrome.storage.local key: "duosign_auth_session"
{
  token: "session-token-string",
  user: {
    name: "Nana Amoako",
    email: "nana@example.com"
  },
  savedAt: 1711800000000 // timestamp
}
```

### Trusted Origins

The web app's `auth.ts` (better-auth config) has been updated to include:
```typescript
trustedOrigins: [
  "https://duosign.vercel.app",
  "http://localhost:3000",
  "chrome-extension://*",
]
```

---

## Asset Downloads

VRM avatars and MediaPipe assets are stored in **IndexedDB** (`duosign-assets` database).

| Asset | Source | Size | Key |
|---|---|---|---|
| DS-Proto-2.1 (default) | Supabase Storage | ~20 MB | `vrm:DS-Proto-2.1` |
| Ashtra | Supabase Storage | ~20 MB | `vrm:Ashtra` |
| DuoSign-G-Proto-2 | Supabase Storage | ~18.5 MB | `vrm:DuoSign-G-Proto-2` |
| VAL | Supabase Storage | ~19.5 MB | `vrm:VAL` |

**Supabase base URL:**
```
https://yqhuvnbgtrbjrfmykznk.supabase.co/storage/v1/object/public/duosign-avatars/
```

---

## Local Development

When developing locally:

1. Backend: `uvicorn api.main:app --reload` (port 8000)
2. Frontend: `npm run dev` (port 3000)
3. Extension: `chrome://extensions` → Load unpacked → select `extension/`

The extension's `background.js` currently points to `https://duosign.onrender.com` for the backend API. For local development, the `API_BASE_URL` would need to be changed to `http://localhost:8000`.

The auth module (`lib/auth.js`) uses `http://localhost:3000` as the app base URL for session management.

---

## CORS Notes

- The backend's CORS config allows `localhost:3000` and `localhost:5173`
- Chrome extensions use `chrome-extension://<id>` as their origin
- **Solution**: All API calls go through `background.js` which has `host_permissions` — fetch from the service worker bypasses CORS entirely
- **No backend changes needed** for CORS
