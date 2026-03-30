/**
 * AssetManager — IndexedDB cache for large binary assets
 * ========================================================
 * Stores VRM avatars (~20 MB each), MediaPipe WASM (~8 MB),
 * and the HolisticLandmarker model (~22 MB) persistently
 * so they only need to be downloaded once on first install.
 *
 * Uses IndexedDB (not localStorage) because:
 *  - localStorage has a 5 MB limit
 *  - IndexedDB supports binary blobs natively
 *  - Data persists across extension updates
 */

const DB_NAME = "duosign-assets";
const DB_VERSION = 1;
const STORE_NAME = "assets";

/** Default avatar to download on first install */
const DEFAULT_AVATAR_URL = "/avatars/DS-Proto-2.1.vrm";
const DEFAULT_AVATAR_KEY = "vrm:DS-Proto-2.1";

/** MediaPipe CDN URLs */
const MEDIAPIPE_WASM_BASE =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MEDIAPIPE_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/holistic_landmarker/holistic_landmarker/float16/latest/holistic_landmarker.task";

/** Available avatars for user selection */
const AVAILABLE_AVATARS = [
  {
    key: "vrm:DS-Proto-2.1",
    name: "DS-Proto-2.1",
    file: "DS-Proto-2.1.vrm",
    default: true,
  },
  { key: "vrm:Ashtra", name: "Ashtra", file: "Ashtra.vrm", default: false },
  {
    key: "vrm:DuoSign-G-Proto-2",
    name: "DuoSign-G-Proto-2",
    file: "DuoSign-G-Proto-2.vrm",
    default: false,
  },
  { key: "vrm:VAL", name: "VAL", file: "VAL.vrm", default: false },
];

class AssetManager {
  constructor() {
    /** @type {IDBDatabase|null} */
    this.db = null;
  }

  // ── Database lifecycle ──────────────────────────────────────────

  /** Open (or create) the IndexedDB database. */
  async init() {
    if (this.db) return;
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "key" });
        }
      };
      req.onsuccess = (e) => {
        this.db = e.target.result;
        resolve();
      };
      req.onerror = (e) => reject(e.target.error);
    });
  }

  // ── CRUD operations ─────────────────────────────────────────────

  /** Check if an asset exists in the store. */
  async hasAsset(key) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).count(key);
      req.onsuccess = () => resolve(req.result > 0);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  /** Retrieve an asset's data (ArrayBuffer) and metadata. */
  async getAsset(key) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  /** Store an asset. data can be ArrayBuffer or Blob. */
  async putAsset(key, data, metadata = {}) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_NAME, "readwrite");
      const record = {
        key,
        data,
        metadata: {
          ...metadata,
          storedAt: Date.now(),
          size: data.byteLength || data.size || 0,
        },
      };
      const req = tx.objectStore(STORE_NAME).put(record);
      req.onsuccess = () => resolve();
      req.onerror = (e) => reject(e.target.error);
    });
  }

  /** Delete one asset. */
  async deleteAsset(key) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_NAME, "readwrite");
      const req = tx.objectStore(STORE_NAME).delete(key);
      req.onsuccess = () => resolve();
      req.onerror = (e) => reject(e.target.error);
    });
  }

  /** List all stored assets (key + metadata only, not data blobs). */
  async listAssets() {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).getAll();
      req.onsuccess = () => {
        const list = (req.result || []).map((r) => ({
          key: r.key,
          metadata: r.metadata,
        }));
        resolve(list);
      };
      req.onerror = (e) => reject(e.target.error);
    });
  }

  // ── Download with progress ──────────────────────────────────────

  /**
   * Download a remote asset and store it in IndexedDB.
   * @param {string} url       — URL to fetch
   * @param {string} key       — IndexedDB key
   * @param {Function} onProgress — callback(loaded, total) for progress
   * @returns {Promise<ArrayBuffer>} the downloaded data
   */
  async downloadAsset(url, key, onProgress = null) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Download failed: ${url} (${response.status})`);
    }

    const contentLength = parseInt(
      response.headers.get("content-length") || "0",
      10,
    );
    const reader = response.body.getReader();
    const chunks = [];
    let loaded = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      loaded += value.length;
      if (onProgress) onProgress(loaded, contentLength || loaded);
    }

    // Merge chunks into single ArrayBuffer
    const buffer = new Uint8Array(loaded);
    let offset = 0;
    for (const chunk of chunks) {
      buffer.set(chunk, offset);
      offset += chunk.length;
    }

    await this.putAsset(key, buffer.buffer, { url, originalSize: loaded });
    return buffer.buffer;
  }

  // ── Convenience: first-install check ────────────────────────────

  /**
   * Check if essential assets are present.
   * Returns { ready: boolean, missing: string[] }
   */
  async checkFirstInstall() {
    await this.init();
    const missing = [];
    if (!(await this.hasAsset(DEFAULT_AVATAR_KEY))) missing.push("avatar");
    // MediaPipe assets are optional (only for 3D mode) — don't block first install
    return {
      ready: missing.length === 0,
      missing,
    };
  }

  /**
   * Run the first-install download sequence.
   * Downloads the default VRM avatar.
   * @param {Function} onProgress — callback({ phase, loaded, total, label })
   */
  async runFirstInstall(onProgress = null) {
    const API_BASE = "https://duosign.onrender.com";

    // Phase 1: Download default avatar
    if (!(await this.hasAsset(DEFAULT_AVATAR_KEY))) {
      if (onProgress)
        onProgress({
          phase: "avatar",
          loaded: 0,
          total: 0,
          label: "Downloading sign avatar…",
        });
      await this.downloadAsset(
        `${API_BASE}${DEFAULT_AVATAR_URL}`,
        DEFAULT_AVATAR_KEY,
        (loaded, total) => {
          if (onProgress)
            onProgress({
              phase: "avatar",
              loaded,
              total,
              label: "Downloading sign avatar…",
            });
        },
      );
    }

    // Mark installation as complete
    await chrome.storage.local.set({ firstInstallComplete: true });
  }

  /**
   * Get the VRM avatar binary as a Blob URL for Three.js loading.
   * @param {string} key — e.g. "vrm:DS-Proto-2.1"
   * @returns {Promise<string>} blob URL
   */
  async getAvatarBlobURL(key = DEFAULT_AVATAR_KEY) {
    const asset = await this.getAsset(key);
    if (!asset) throw new Error(`Avatar not found: ${key}`);
    const blob = new Blob([asset.data], { type: "model/gltf-binary" });
    return URL.createObjectURL(blob);
  }
}

// Export singleton
window.AssetManager = AssetManager;
window.AVAILABLE_AVATARS = AVAILABLE_AVATARS;
window.assetManager = new AssetManager();
