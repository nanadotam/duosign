/**
 * DuoSign Extension — Settings Script
 * =====================================
 * Handles user preferences, keyboard shortcut display,
 * avatar management, and auth state.
 */

document.addEventListener("DOMContentLoaded", async () => {
  const userNameInput = document.getElementById("userName");
  const avatarModeSelect = document.getElementById("avatarMode");
  const speedSelect = document.getElementById("defaultSpeed");
  const saveBtn = document.getElementById("saveBtn");
  const toast = document.getElementById("toast");
  const avatarList = document.getElementById("avatarList");
  const storageInfo = document.getElementById("storageInfo");
  const authCard = document.getElementById("authCard");
  const loginBtn = document.getElementById("loginBtn");
  const remapLink = document.getElementById("remapLink");

  // ── Auth state ──────────────────────────────────────────────────
  if (window.DuoSignAuth) {
    const auth = await window.DuoSignAuth.checkAuthStatus();
    if (auth.authenticated && auth.user) {
      const initials = (auth.user.name || "U").charAt(0).toUpperCase();
      authCard.innerHTML = `
        <div class="auth-avatar">${initials}</div>
        <div class="auth-info">
          <div class="auth-name">${auth.user.name || "User"}</div>
          <div class="auth-email">${auth.user.email || ""}</div>
        </div>
        <button class="logout-btn" id="logoutBtn">Sign Out</button>
      `;
      document
        .getElementById("logoutBtn")
        ?.addEventListener("click", async () => {
          await window.DuoSignAuth.clearSession();
          location.reload();
        });
    }
  }

  loginBtn?.addEventListener("click", () => {
    window.DuoSignAuth?.openLoginPage();
  });

  // ── Shortcut remap link ─────────────────────────────────────────
  remapLink?.addEventListener("click", (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
  });

  // ── Load saved settings ─────────────────────────────────────────
  chrome.storage.sync.get(
    { userName: "", avatarMode: "skeleton", defaultSpeed: "1" },
    (result) => {
      userNameInput.value = result.userName || "";
      avatarModeSelect.value = result.avatarMode;
      speedSelect.value = result.defaultSpeed;
    },
  );

  // ── Save settings ──────────────────────────────────────────────
  saveBtn.addEventListener("click", () => {
    chrome.storage.sync.set(
      {
        userName: userNameInput.value.trim(),
        avatarMode: avatarModeSelect.value,
        defaultSpeed: speedSelect.value,
      },
      () => {
        toast.classList.add("visible");
        setTimeout(() => toast.classList.remove("visible"), 2000);
      },
    );
  });

  // ── Avatar management ─────────────────────────────────────────
  const mgr = window.assetManager;
  await mgr.init();

  async function renderAvatarList() {
    const stored = await mgr.listAssets();
    const storedKeys = new Set(stored.map((a) => a.key));

    let totalSize = 0;
    avatarList.innerHTML = "";

    for (const avatar of window.AVAILABLE_AVATARS) {
      const isDownloaded = storedKeys.has(avatar.key);
      const storedMeta = stored.find((a) => a.key === avatar.key)?.metadata;
      const size = storedMeta?.size || 0;
      if (isDownloaded) totalSize += size;

      const item = document.createElement("div");
      item.className = "avatar-item";
      item.innerHTML = `
        <div class="avatar-icon">🧑‍🎤</div>
        <div class="avatar-info">
          <div class="avatar-name">${avatar.name}</div>
          <div class="avatar-size">${isDownloaded ? formatSize(size) : "Not downloaded"}</div>
        </div>
        ${avatar.default ? '<span class="avatar-badge">DEFAULT</span>' : ""}
      `;

      if (isDownloaded && !avatar.default) {
        const delBtn = document.createElement("button");
        delBtn.textContent = "Delete";
        delBtn.addEventListener("click", async () => {
          await mgr.deleteAsset(avatar.key);
          renderAvatarList();
        });
        item.appendChild(delBtn);
      } else if (!isDownloaded) {
        const dlBtn = document.createElement("button");
        dlBtn.className = "download-btn";
        dlBtn.textContent = "Download";
        dlBtn.addEventListener("click", async () => {
          dlBtn.textContent = "Downloading…";
          dlBtn.disabled = true;
          try {
            const SUPABASE_BASE =
              "https://yqhuvnbgtrbjrfmykznk.supabase.co/storage/v1/object/public/duosign-avatars";
            await mgr.downloadAsset(
              `${SUPABASE_BASE}/${avatar.file}`,
              avatar.key,
              (loaded, total) => {
                const pct = total > 0 ? Math.round((loaded / total) * 100) : 0;
                dlBtn.textContent = `${pct}%`;
              },
            );
            renderAvatarList();
          } catch (err) {
            dlBtn.textContent = "Error";
            console.error("[Settings] Avatar download error:", err);
          }
        });
        item.appendChild(dlBtn);
      }

      avatarList.appendChild(item);
    }

    storageInfo.textContent = `Total storage used: ${formatSize(totalSize)}`;
  }

  function formatSize(bytes) {
    if (bytes === 0) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
  }

  renderAvatarList();
});
