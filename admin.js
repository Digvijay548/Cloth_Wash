/* ═══════════════════════════════════════════════════════
   Wenni Skin Care Academy — admin.js
   Pure client-side Admin Panel controller with Supabase.
   ═══════════════════════════════════════════════════════ */

let supabaseClient = null;
let activeData = null; // Holds the currently active site JSON structure
let localBackupData = null; // Local copy of fallback data.json

// ── BRANDING / HEADER SYNCHRONIZATION ────────────────────
function updateAdminBranding(customName) {
  const name = customName || (activeData && activeData.site && activeData.site.name) || "Admin Portal";
  document.title = `${name} — Admin Panel`;
  const loginBrand = document.getElementById("loginBrandName");
  if (loginBrand) loginBrand.textContent = name;
  const adminHeader = document.getElementById("adminHeaderName");
  if (adminHeader) adminHeader.textContent = `${name} Admin`;
}

// ── TOAST NOTIFICATIONS ─────────────────────────────────
function showToast(message, type = "info", duration = 4000) {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  let icon = "ℹ️";
  if (type === "success") icon = "✅";
  if (type === "error") icon = "⚠️";

  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = window.innerWidth <= 768 ? "translateY(-16px) scale(0.95)" : "translateX(50px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ── SUPABASE KEEP-ALIVE TRIGGER & ADMIN CONTROLLER ─────
function getKeepAliveStatusText() {
  const lastTs = localStorage.getItem("supabase_last_keepalive_ping") 
    || (activeData?.keepAlive?.lastTriggered ? new Date(activeData.keepAlive.lastTriggered).getTime() : null);
  if (!lastTs) return "Last ping: Never";
  const date = new Date(parseInt(lastTs, 10) || lastTs);
  return `Last ping: ${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

window.toggleKeepAlive = async function (checked) {
  if (!activeData.keepAlive) {
    activeData.keepAlive = { enabled: true, intervalDays: 1, lastTriggered: null };
  }
  activeData.keepAlive.enabled = checked;
  showToast(checked ? "Keep-Alive trigger enabled" : "Keep-Alive trigger disabled", "info");
  await saveChanges();
  renderCurrentTab();
};

window.updateKeepAliveInterval = async function (val) {
  if (!activeData.keepAlive) {
    activeData.keepAlive = { enabled: true, intervalDays: 1, lastTriggered: null };
  }
  const days = Math.max(1, Math.min(6, parseInt(val, 10) || 1));
  activeData.keepAlive.intervalDays = days;
  showToast(`Keep-Alive interval updated to ${days} day(s). Saving...`, "info");
  await saveChanges();
};

window.triggerManualKeepAlivePing = async function () {
  const btn = document.getElementById("manualPingBtn");
  if (btn) { btn.disabled = true; btn.textContent = "⏳ Pinging..."; }
  try {
    const cfg = window.SUPABASE_CONFIG;
    if (!cfg || !cfg.url || !cfg.anonKey) throw new Error("Supabase is not configured.");
    const res = await fetch(`${cfg.url}/rest/v1/site_settings?select=id&limit=1`, {
      method: "GET",
      headers: {
        "apikey": cfg.anonKey,
        "Authorization": `Bearer ${cfg.anonKey}`
      }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const now = Date.now();
    localStorage.setItem("supabase_last_keepalive_ping", now.toString());
    if (activeData) {
      if (!activeData.keepAlive) activeData.keepAlive = { enabled: true, intervalDays: 1 };
      activeData.keepAlive.lastTriggered = new Date().toISOString();
      await saveChanges();
    }
    showToast("Keep-Alive ping sent successfully! Supabase is active.", "success");
    const badge = document.getElementById("keepAliveLastPingBadge");
    if (badge) badge.textContent = getKeepAliveStatusText();
  } catch (err) {
    showToast("Keep-Alive ping failed: " + err.message, "error");
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "🚀 Send Ping Now"; }
  }
};

// ── SUPABASE CONFIG RESOLVER ────────────────────────────
function getEffectiveSupabaseConfig() {
  try {
    const custom = localStorage.getItem("custom_supabase_config");
    if (custom) {
      const parsed = JSON.parse(custom);
      if (parsed.url && parsed.anonKey) {
        return {
          url: parsed.url.trim(),
          anonKey: parsed.anonKey.trim(),
          isCustom: true
        };
      }
    }
  } catch (e) {}
  const cfg = window.SUPABASE_CONFIG || {};
  return {
    url: (cfg.url || "").trim(),
    anonKey: (cfg.anonKey || "").trim(),
    isCustom: false
  };
}

function initSupabaseKeepAlive() {
  async function pingKeepAlive() {
    try {
      const cfg = getEffectiveSupabaseConfig();
      if (!cfg.url || !cfg.anonKey) return;
      const ka = activeData?.keepAlive || { enabled: true, intervalDays: 1 };
      if (ka.enabled === false) return;

      const intervalDays = Math.max(1, Math.min(6, parseInt(ka.intervalDays, 10) || 1));
      const intervalMs = intervalDays * 24 * 60 * 60 * 1000;
      const now = Date.now();
      const lastPing = parseInt(localStorage.getItem("supabase_last_keepalive_ping") || "0", 10);

      if (now - lastPing >= intervalMs) {
        await fetch(`${cfg.url}/rest/v1/site_settings?select=id&limit=1`, {
          method: "GET",
          headers: {
            "apikey": cfg.anonKey,
            "Authorization": `Bearer ${cfg.anonKey}`
          }
        });
        localStorage.setItem("supabase_last_keepalive_ping", now.toString());
        if (activeData && activeData.keepAlive) {
          activeData.keepAlive.lastTriggered = new Date().toISOString();
        }
        console.log(`Supabase keep-alive ping triggered (Interval: ${intervalDays} day(s)).`);
      }
    } catch (e) {
      console.warn("Supabase keep-alive ping error:", e);
    }
  }

  pingKeepAlive();
  setInterval(pingKeepAlive, 60 * 60 * 1000);
}

window.toggleLoginSupabaseModal = function () {
  const box = document.getElementById("loginSupabaseBox");
  if (!box) return;
  const isHidden = box.style.display === "none";
  box.style.display = isHidden ? "block" : "none";
  if (isHidden) {
    const cfg = getEffectiveSupabaseConfig();
    const urlEl = document.getElementById("loginSupabaseUrl");
    const keyEl = document.getElementById("loginSupabaseAnonKey");
    if (urlEl) urlEl.value = cfg.url || "";
    if (keyEl) keyEl.value = cfg.anonKey || "";
  }
};

window.saveLoginSupabaseConfig = function () {
  const url = document.getElementById("loginSupabaseUrl")?.value?.trim();
  const anonKey = document.getElementById("loginSupabaseAnonKey")?.value?.trim();
  if (!url || !anonKey) {
    showToast("Please enter both Supabase URL and Anon Key.", "error");
    return;
  }
  localStorage.setItem("custom_supabase_config", JSON.stringify({ url, anonKey }));
  showToast("Supabase configuration saved! Reloading...", "success");
  setTimeout(() => window.location.reload(), 600);
};

// ── BOOT & AUTH CHECK ──────────────────────────────────
(async function init() {
  initSupabaseKeepAlive();
  // Pre-load default name for login screen if available
  try {
    const res = await fetch("data.json", { cache: "no-store" });
    const defaultData = await res.json();
    if (defaultData && defaultData.site && defaultData.site.name) {
      updateAdminBranding(defaultData.site.name);
    }
  } catch (e) {}

  const cfg = getEffectiveSupabaseConfig();
  const hasConfig = cfg && cfg.url && cfg.anonKey;

  if (!hasConfig) {
    const statusBox = document.getElementById("loginStatusFallback");
    if (statusBox) {
      statusBox.style.display = "block";
      statusBox.innerHTML = `
        <div style="font-weight:600; margin-bottom:4px;">🟡 Local Fallback Mode (No Supabase Connected)</div>
        <div>Default Login: <strong>admin@example.com</strong> / <strong>admin</strong></div>
        <div style="font-size:11px; margin-top:4px; opacity:0.85;">Or configure your Supabase URL & Key below.</div>
      `;
    }
    setupFallbackLogin();
    return;
  }

  try {
    const { createClient } = window.supabase;
    supabaseClient = createClient(cfg.url, cfg.anonKey);

    // Check initial authentication status
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (session) {
      onLoginSuccess();
    } else {
      setupAuthListener();
    }
  } catch (err) {
    console.error("Supabase initialization error:", err);
    showToast("Error connecting to Supabase: " + err.message, "error");
    setupFallbackLogin();
  }
})();

function setupFallbackLogin() {
  const form = document.getElementById("loginForm");
  const emailInput = document.getElementById("adminEmail");
  const passwordInput = document.getElementById("adminPassword");
  if (emailInput && !emailInput.value) emailInput.value = "admin@example.com";
  if (passwordInput && !passwordInput.value) passwordInput.value = "admin";

  form.onsubmit = async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (email === "admin@example.com" && password === "admin") {
      showToast("Logged in to Local Fallback Admin!", "success");
      onLoginSuccess();
    } else {
      showToast("Fallback login failed. Use admin@example.com / admin, or connect Supabase credentials.", "error");
    }
  };
}

function setupAuthListener() {
  supabaseClient.auth.onAuthStateChange((event, session) => {
    if (session) {
      onLoginSuccess();
    } else {
      onLogout();
    }
  });

  // Login form handler
  const form = document.getElementById("loginForm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("adminEmail").value.trim();
    const password = document.getElementById("adminPassword").value;
    const btn = document.getElementById("loginBtn");

    btn.textContent = "Signing in...";
    btn.disabled = true;

    try {
      const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) throw error;
      showToast("Log in successful!", "success");
    } catch (err) {
      showToast(err.message, "error");
      btn.textContent = "Sign In";
      btn.disabled = false;
    }
  });
}

async function onLoginSuccess() {
  document.getElementById("loginWrapper").style.display = "none";
  document.getElementById("dashboardWrapper").style.display = "flex";

  showToast("Loading site configuration...", "info");
  await fetchConfig();
  initTabs();
}

function onLogout() {
  document.getElementById("loginWrapper").style.display = "flex";
  document.getElementById("dashboardWrapper").style.display = "none";
  document.getElementById("loginBtn").textContent = "Sign In";
  document.getElementById("loginBtn").disabled = false;
}

document.getElementById("logoutBtn").addEventListener("click", async () => {
  if (supabaseClient) {
    await supabaseClient.auth.signOut();
    showToast("Logged out successfully. Redirecting...", "info");
    setTimeout(() => {
      window.location.href = "index.html";
    }, 800);
  }
});

// ── CONFIG LOADER ──────────────────────────────────────
async function fetchConfig() {
  try {
    if (!supabaseClient) {
      const savedLocal = localStorage.getItem("local_site_data_override");
      if (savedLocal) {
        activeData = JSON.parse(savedLocal);
      } else {
        const res = await fetch("data.json", { cache: "no-store" });
        activeData = await res.json();
      }
      if (!activeData.pricing || !Array.isArray(activeData.pricing)) {
        activeData.pricing = activeData.services.map(svc => ({
          name: svc.name || "",
          desc: svc.desc || "",
          color: svc.color || "#00B4D8",
          image: svc.image || "",
          icon: svc.icon || "",
          price: svc.price || ""
        }));
        localStorage.setItem("local_site_data_override", JSON.stringify(activeData));
      }
      const connStatus = document.getElementById("connectionStatus");
      if (connStatus) {
        connStatus.className = "status-badge warning";
        connStatus.textContent = "Local Fallback Mode (Offline)";
      }
      showToast("Loaded data in local fallback mode.", "info");
      updateAdminBranding();
      renderCurrentTab();
      return;
    }

    // 1. Try to load from Supabase
    const { data, error } = await supabaseClient
      .from("site_settings")
      .select("content")
      .eq("id", 1)
      .maybeSingle();

    if (error) throw error;

    if (data && data.content) {
      activeData = data.content;

      let needsSave = false;
      if (!activeData.pricing || !Array.isArray(activeData.pricing)) {
        activeData.pricing = activeData.services.map(svc => ({
          name: svc.name || "",
          desc: svc.desc || "",
          color: svc.color || "#00B4D8",
          image: svc.image || "",
          icon: svc.icon || "",
          price: svc.price || ""
        }));
        needsSave = true;
      }

      // Auto-merge missing keys from local data.json if any are missing (like the new gallery)
      try {
        const res = await fetch("data.json", { cache: "no-store" });
        const defaultData = await res.json();

        for (const key in defaultData) {
          if (activeData[key] === undefined) {
            activeData[key] = defaultData[key];
            needsSave = true;
          }
        }
      } catch (mergeErr) {
        console.warn("Failed to fetch default data for merging:", mergeErr);
      }

      if (needsSave) {
        console.log("Database missing new section fields. Auto-merging and saving...");
        await supabaseClient
          .from("site_settings")
          .upsert({ id: 1, content: activeData, updated_at: new Date().toISOString() });
      }

      showToast("Configuration loaded from database.", "success");
    } else {
      // 2. Database table is empty! Let's bootstrap it with local data.json
      showToast("Database is empty. Bootstrapping with local data.json...", "info");
      const res = await fetch("data.json", { cache: "no-store" });
      const defaultData = await res.json();

      const { error: insertErr } = await supabaseClient
        .from("site_settings")
        .insert([{ id: 1, content: defaultData }]);

      if (insertErr) throw insertErr;

      activeData = defaultData;
      showToast("Database successfully initialized with default data!", "success");
    }

    // Safety check for keepAlive configuration
    if (!activeData.keepAlive) {
      activeData.keepAlive = {
        enabled: true,
        intervalDays: 1,
        lastTriggered: null
      };
    }

    // Safety check for customTheme configuration
    if (!activeData.site.customTheme) {
      activeData.site.customTheme = {
        background: "#1a0a2e",
        accent: "#0284C7",
        accentHover: "#DB2777"
      };
    }
    // Set initial admin body theme based on configuration toggle
    if (activeData.site.themeEnabled) {
      applyCustomThemeStyles(activeData.site.customTheme);
      document.body.className = "admin-body theme-" + (activeData.site.theme || "default");
    } else {
      applyCustomThemeStyles(null);
      document.body.className = "admin-body theme-default";
    }

    // Set initial live preview layout preference (by default OFF)
    const previewToggle = document.getElementById("livePreviewToggle");
    const splitWrapper = document.querySelector(".db-content-split");
    if (activeData.site.previewEnabled === true) {
      isPreviewEnabled = true;
      if (previewToggle) previewToggle.checked = true;
      if (splitWrapper) splitWrapper.classList.remove("preview-disabled");
    } else {
      isPreviewEnabled = false;
      if (previewToggle) previewToggle.checked = false;
      if (splitWrapper) splitWrapper.classList.add("preview-disabled");
    }

    updateAdminBranding();
    renderCurrentTab();
  } catch (err) {
    console.error("Config fetch error:", err);
    showToast("Error loading configuration: " + err.message, "error");
  }
}

// ── TABS NAVIGATION ─────────────────────────────────────
let currentTab = "site-info";

function initTabs() {
  const items = document.querySelectorAll(".tab-item");
  items.forEach(item => {
    item.addEventListener("click", async () => {
      // Clear any pending debounced auto-saves
      if (autoSaveTimeout) clearTimeout(autoSaveTimeout);

      // Save changes before leaving the current tab
      if (supabaseClient && activeData) {
        await saveChanges();
      }

      items.forEach(i => i.classList.remove("active"));
      item.classList.add("active");

      // Hide all panels
      document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));

      currentTab = item.getAttribute("data-tab");
      const targetPanel = document.getElementById(`panel-${currentTab}`);
      if (targetPanel) {
        targetPanel.classList.add("active");
        renderCurrentTab();
      }
    });
  });

  // Global Save Changes button click handler
  document.getElementById("saveAllBtn").addEventListener("click", saveChanges);
}

function renderCurrentTab() {
  if (!activeData) return;

  const panel = document.getElementById(`panel-${currentTab}`);
  if (!panel) return;

  switch (currentTab) {
    case "site-info":
      renderSiteInfo(panel);
      break;
    case "social-map":
      renderSocialMapTab(panel);
      break;
    case "hero":
      renderHeroTab(panel);
      break;
    case "about":
      renderAboutTab(panel);
      break;
    case "services":
      renderServicesTab(panel);
      break;
    case "pricing":
      renderPricingTab(panel);
      break;
    case "why-us":
      renderWhyUsTab(panel);
      break;
    case "academy":
      renderAcademyTab(panel);
      break;
    case "doctor":
      renderDoctorTab(panel);
      break;
    case "testimonials":
      renderTestimonialsTab(panel);
      break;
    case "gallery":
      renderGalleryTab(panel);
      break;
    case "experience":
      renderExperienceTab(panel);
      break;
    case "json-editor":
      renderJsonEditorTab(panel);
      break;
  }
}

// Helper to escape HTML values inside input boxes
function val(str) {
  return String(str ?? "").replace(/"/g, "&quot;");
}

// Helper to create basic card structures
function getSectionHeader(title, subtitle) {
  return `
    <h2 class="panel-title">${title}</h2>
    <p class="panel-subtitle">${subtitle}</p>
  `;
}

// ── IMAGE UPLOAD HANDLER ────────────────────────────────
async function handleImageUpload(inputEl, previewId, dataPath) {
  const file = inputEl.files[0];
  if (!file) return;

  const previewEl = document.getElementById(previewId);
  const loadingText = document.createElement("div");
  loadingText.className = "image-preview-placeholder";
  loadingText.textContent = "Uploading...";

  const originalPreviewContent = previewEl.innerHTML;
  previewEl.innerHTML = "";
  previewEl.appendChild(loadingText);

  try {
    const oldUrl = getNestedValue(activeData, dataPath);
    if (oldUrl) {
      await deleteFileFromStorage(oldUrl);
    }

    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const filePath = `uploads/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabaseClient.storage
      .from("cloth_wash_assets")
      .upload(filePath, file, { cacheControl: '3600', upsert: true });

    if (error) throw error;

    // Get public url
    const { data: urlData } = supabaseClient.storage
      .from("cloth_wash_assets")
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    // Update activeData
    updateNestedValue(activeData, dataPath, publicUrl);

    // Update preview
    previewEl.innerHTML = `<img src="${publicUrl}" alt="Preview" />`;
    showToast("Image uploaded successfully!", "success");
  } catch (err) {
    console.error("Upload error:", err);
    showToast("Upload failed: " + err.message, "error");
    previewEl.innerHTML = originalPreviewContent;
  }
}

// Sets values in deep nested objects (e.g. "hero.image")
function updateNestedValue(obj, path, value) {
  const parts = path.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (part.includes('[') && part.includes(']')) {
      // Handles array accesses like "services[0]"
      const arrayName = part.split('[')[0];
      const index = parseInt(part.split('[')[1].replace(']', ''), 10);
      current = current[arrayName][index];
    } else {
      current = current[part];
    }
  }
  const lastPart = parts[parts.length - 1];
  current[lastPart] = value;
}

// Get deep nested value safely
function getNestedValue(obj, path) {
  try {
    const parts = path.split('.');
    let current = obj;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (part.includes('[') && part.includes(']')) {
        const arrayName = part.split('[')[0];
        const index = parseInt(part.split('[')[1].replace(']', ''), 10);
        if (!current[arrayName] || !current[arrayName][index]) return undefined;
        current = current[arrayName][index];
      } else {
        if (!current || current[part] === undefined) return undefined;
        current = current[part];
      }
    }
    return current;
  } catch (e) {
    return undefined;
  }
}

// Get path for storage deletion from public URL
function getStoragePathFromUrl(url) {
  if (!url || !url.includes("supabase.co/storage/v1/object/public/cloth_wash_assets/")) {
    return null;
  }
  const parts = url.split("/storage/v1/object/public/cloth_wash_assets/");
  if (parts.length > 1) {
    return decodeURIComponent(parts[1]);
  }
  return null;
}

// Delete physical file from storage
async function deleteFileFromStorage(url) {
  const filePath = getStoragePathFromUrl(url);
  if (!filePath) return;

  try {
    const { data, error } = await supabaseClient.storage
      .from("cloth_wash_assets")
      .remove([filePath]);
    if (error) throw error;
    console.log(`Deleted file from storage: ${filePath}`);
  } catch (err) {
    showToast(`Storage cleanup failed: ${err.message}`, "error");
  }
}

// Remove image from field, delete from storage, and auto-save
window.removeImageField = async function (dataPath, previewId) {
  if (confirm("Are you sure you want to delete this image?")) {
    const oldUrl = getNestedValue(activeData, dataPath);
    if (oldUrl) {
      showToast("Removing image file...", "info");
      await deleteFileFromStorage(oldUrl);
    }

    updateNestedValue(activeData, dataPath, "");

    const previewEl = document.getElementById(previewId);
    if (previewEl) {
      previewEl.innerHTML = `<div class="image-preview-placeholder">No Image</div>`;
    }

    showToast("Image removed. Saving database...", "info");
    await saveChanges();
    renderCurrentTab();
  }
};

// ── TAB RENDERING ──────────────────────────────────────

// 1. SITE INFO & CONTACT
function renderSiteInfo(panel) {
  panel.innerHTML = `
    ${getSectionHeader("Site Info & Contacts", "Manage basic site names, headers, contact email, WhatsApp, and Google Map details.")}
    
    <div class="form-section-card">
      <div class="form-section-title">Brand Info</div>
      <div class="form-group">
        <label>Website Name</label>
        <input type="text" value="${val(activeData.site.name)}" oninput="activeData.site.name = this.value; updateAdminBranding(this.value);">
      </div>
      <div class="form-row-2">
        <div class="form-group">
          <label>Sub-Header (e.g. Branch)</label>
          <input type="text" value="${val(activeData.site.branch)}" oninput="activeData.site.branch = this.value">
        </div>
        <div class="form-group">
          <label>Brand Tagline</label>
          <input type="text" value="${val(activeData.site.tagline)}" oninput="activeData.site.tagline = this.value">
        </div>
      </div>
    </div>

    <div class="form-section-card">
      <div class="form-section-title" style="display:flex; align-items:center; justify-content:space-between; width:100%;">
        <span style="display:flex; align-items:center; gap:8px;">
          <span>⚡ Supabase Database Keep-Alive Trigger</span>
        </span>
        <label class="switch" style="transform: scale(0.8); margin: 0;">
          <input type="checkbox" id="keepAliveEnabledToggle" ${activeData.keepAlive?.enabled !== false ? 'checked' : ''} onchange="toggleKeepAlive(this.checked)">
          <span class="slider"></span>
        </label>
      </div>
      <p style="font-size: 12px; color: var(--color-muted-foreground); margin-bottom: 16px;">
        Free-tier Supabase projects pause after 7 days of inactivity. This trigger automatically sends a periodic heartbeat query to keep your database and storage live.
      </p>

      ${activeData.keepAlive?.enabled !== false ? `
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:16px; align-items:flex-end;">
          <div class="form-group" style="margin:0;">
            <label>Trigger Interval (Days)</label>
            <div style="display:flex; align-items:center; gap:8px;">
              <input type="number" min="1" max="6" value="${activeData.keepAlive?.intervalDays || 1}" onchange="updateKeepAliveInterval(this.value)" oninput="activeData.keepAlive.intervalDays = Math.max(1, Math.min(6, parseInt(this.value) || 1));" style="max-width: 120px;">
              <span style="font-size:13px; color:var(--color-muted-foreground);">day(s) (1 – 6 days)</span>
            </div>
          </div>
          <div style="display:flex; flex-direction:column; gap:6px;">
            <label>Manual Test & Status</label>
            <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
              <button type="button" class="btn btn-outline btn-sm" id="manualPingBtn" onclick="triggerManualKeepAlivePing()">🚀 Send Ping Now</button>
              <span id="keepAliveLastPingBadge" style="font-size:12px; color:var(--color-muted-foreground); font-weight:500;">
                ${getKeepAliveStatusText()}
              </span>
            </div>
          </div>
        </div>
      ` : `
        <div style="color:var(--color-danger); font-size:12px;">⚠️ Auto keep-alive is currently disabled. Supabase may pause after 7 days of inactivity.</div>
      `}
    </div>

    <div class="form-section-card">
      <div class="form-section-title" style="display:flex; align-items:center; justify-content:space-between; width:100%;">
        <span>Brand Identity & Color Theme</span>
        <label class="switch" style="transform: scale(0.8); margin: 0;">
          <input type="checkbox" id="themeEnabledToggle" ${activeData.site.themeEnabled ? 'checked' : ''} onchange="toggleThemeCustomization(this.checked)">
          <span class="slider"></span>
        </label>
      </div>
      <p style="font-size: 12px; color: var(--color-muted-foreground); margin-bottom: 16px;">
        Toggle ON to enable branding theme presets or create your own custom theme. Toggle OFF to run on the default skincare theme.
      </p>
      
      ${activeData.site.themeEnabled ? `
        <div class="theme-swatch-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap:12px; animation: fadeIn 0.3s ease;">
          
          <!-- Default theme -->
          <div class="theme-swatch-card ${activeData.site.theme === 'default' || !activeData.site.theme ? 'active' : ''}" onclick="selectColorTheme('default')">
            <div class="swatch-preview" style="background:#090b11;">
              <span style="background:#0284C7;"></span>
              <span style="background:#1a0a2e;"></span>
            </div>
            <div class="swatch-label">Plum Blossom (Default)</div>
          </div>

          <!-- Royal Gold theme -->
          <div class="theme-swatch-card ${activeData.site.theme === 'royal' ? 'active' : ''}" onclick="selectColorTheme('royal')">
            <div class="swatch-preview" style="background:#050a12;">
              <span style="background:#F59E0B;"></span>
              <span style="background:#0F1E36;"></span>
            </div>
            <div class="swatch-label">Royal Sapphire</div>
          </div>

          <!-- Emerald Forest theme -->
          <div class="theme-swatch-card ${activeData.site.theme === 'emerald' ? 'active' : ''}" onclick="selectColorTheme('emerald')">
            <div class="swatch-preview" style="background:#020908;">
              <span style="background:#10B981;"></span>
              <span style="background:#064E3B;"></span>
            </div>
            <div class="swatch-label">Emerald Garden</div>
          </div>

          <!-- Sunset Glow theme -->
          <div class="theme-swatch-card ${activeData.site.theme === 'sunset' ? 'active' : ''}" onclick="selectColorTheme('sunset')">
            <div class="swatch-preview" style="background:#0c0301;">
              <span style="background:#F97316;"></span>
              <span style="background:#431407;"></span>
            </div>
            <div class="swatch-label">Sunset Glow</div>
          </div>

          <!-- Midnight Ocean theme -->
          <div class="theme-swatch-card ${activeData.site.theme === 'ocean' ? 'active' : ''}" onclick="selectColorTheme('ocean')">
            <div class="swatch-preview" style="background:#01080a;">
              <span style="background:#22D3EE;"></span>
              <span style="background:#0F373E;"></span>
            </div>
            <div class="swatch-label">Midnight Ocean</div>
          </div>

          <!-- Custom Theme -->
          <div class="theme-swatch-card ${activeData.site.theme === 'custom' ? 'active' : ''}" onclick="selectColorTheme('custom')">
            <div class="swatch-preview" style="background:linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border:1px dashed rgba(255,255,255,0.15)">
              <span style="background:linear-gradient(135deg, #0284C7 0%, #3b82f6 100%);"></span>
              <span style="background:linear-gradient(135deg, #3b82f6 0%, #10b981 100%);"></span>
            </div>
            <div class="swatch-label">🎨 Custom Theme</div>
          </div>

        </div>

        <!-- Custom Theme Builder Color Pickers -->
        ${activeData.site.theme === 'custom' ? `
          <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--color-border); animation: fadeIn 0.3s ease;">
            <h4 style="font-size: 13px; font-weight: 600; margin-bottom: 12px; color: var(--color-foreground)">🎨 Configure Custom Colors</h4>
            <div class="form-row-3">
              <div class="form-group" style="margin: 0">
                <label>Background Color</label>
                <div style="display:flex; gap:10px; align-items:center;">
                  <input type="color" value="${activeData.site.customTheme?.background || '#1a0a2e'}" oninput="updateCustomThemeColor('background', this.value)" style="width:40px; height:40px; padding:0; border:1px solid var(--color-border); border-radius:6px; cursor:pointer;">
                  <input type="text" value="${activeData.site.customTheme?.background || '#1a0a2e'}" oninput="updateCustomThemeColor('background', this.value)" style="flex:1;">
                </div>
              </div>
              <div class="form-group" style="margin: 0">
                <label>Accent Primary</label>
                <div style="display:flex; gap:10px; align-items:center;">
                  <input type="color" value="${activeData.site.customTheme?.accent || '#0284C7'}" oninput="updateCustomThemeColor('accent', this.value)" style="width:40px; height:40px; padding:0; border:1px solid var(--color-border); border-radius:6px; cursor:pointer;">
                  <input type="text" value="${activeData.site.customTheme?.accent || '#0284C7'}" oninput="updateCustomThemeColor('accent', this.value)" style="flex:1;">
                </div>
              </div>
              <div class="form-group" style="margin: 0">
                <label>Accent Hover / Secondary</label>
                <div style="display:flex; gap:10px; align-items:center;">
                  <input type="color" value="${activeData.site.customTheme?.accentHover || '#DB2777'}" oninput="updateCustomThemeColor('accentHover', this.value)" style="width:40px; height:40px; padding:0; border:1px solid var(--color-border); border-radius:6px; cursor:pointer;">
                  <input type="text" value="${activeData.site.customTheme?.accentHover || '#DB2777'}" oninput="updateCustomThemeColor('accentHover', this.value)" style="flex:1;">
                </div>
              </div>
            </div>
          </div>
        ` : ''}
      ` : ''}
    </div>

    <div class="form-section-card">
      <div class="form-section-title">WhatsApp & Contacts</div>
      <div class="form-row-3">
        <div class="form-group">
          <label>WhatsApp Number (With country code, no space)</label>
          <input type="text" value="${val(activeData.whatsapp.number)}" oninput="activeData.whatsapp.number = this.value">
        </div>
        <div class="form-group">
          <label>Display Phone Number</label>
          <input type="text" value="${val(activeData.whatsapp.display)}" oninput="activeData.whatsapp.display = this.value">
        </div>
        <div class="form-group">
          <label>Contact Email</label>
          <input type="email" value="${val(activeData.contact.email)}" oninput="activeData.contact.email = this.value">
        </div>
      </div>
      <div class="form-group">
        <label>WhatsApp Default Start Message</label>
        <input type="text" value="${val(activeData.whatsapp.message)}" oninput="activeData.whatsapp.message = this.value">
      </div>
      <div class="form-group" style="margin: 0">
        <label>Physical Address</label>
        <textarea oninput="activeData.contact.address = this.value">${activeData.contact.address}</textarea>
      </div>
    </div>

    <div class="form-section-card">
      <div class="form-section-title">Footer & Metadata</div>
      <div class="form-group">
        <label>SEO Meta Page Title</label>
        <input type="text" value="${val(activeData.site.pageTitle)}" oninput="activeData.site.pageTitle = this.value">
      </div>
      <div class="form-group">
        <label>SEO Meta Description</label>
        <textarea oninput="activeData.site.pageDescription = this.value">${activeData.site.pageDescription}</textarea>
      </div>
      <div class="form-group">
        <label>Footer Description Tagline</label>
        <textarea oninput="activeData.site.footerTagline = this.value">${activeData.site.footerTagline}</textarea>
      </div>
      <div class="form-row-2">
        <div class="form-group">
          <label>Copyright Text</label>
          <input type="text" value="${val(activeData.site.copyright)}" oninput="activeData.site.copyright = this.value">
        </div>
        <div class="form-group">
          <label>Credit Text</label>
          <input type="text" value="${val(activeData.site.credit)}" oninput="activeData.site.credit = this.value">
        </div>
      </div>
    </div>
  `;
}

// 🌐 SOCIAL & MAP TAB
function renderSocialMapTab(panel) {
  panel.innerHTML = `
    ${getSectionHeader("Social Links & Google Map", "Configure your business page links, toggle footer icons, and set your Google Map share URL.")}
    
    <div class="form-section-card">
      <div class="form-section-title">Google Map Settings</div>
      <div class="form-group" style="margin: 0">
        <label>Google Maps Link (Embed URL or Share Link)</label>
        <input type="text" value="${val(activeData.contact.mapEmbed)}" oninput="activeData.contact.mapEmbed = this.value" placeholder="e.g., https://maps.app.goo.gl/xxx or https://www.google.com/maps/embed?pb=...">
        <p style="font-size: 12px; color: var(--muted); margin-top: 6px;">
          💡 <strong>Supports both</strong>: You can paste a simple share link (e.g. <code>https://maps.app.goo.gl/xxx</code>) or a full HTML embed source link.
        </p>
      </div>
    </div>

    <div class="form-section-card">
      <div class="form-section-title">Social Media Profiles</div>
      
      <!-- Instagram -->
      <div style="border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 12px; margin-bottom: 12px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <strong>Instagram Profile</strong>
          <label class="switch" style="transform: scale(0.8)">
            <input type="checkbox" ${activeData.footer.social[0].enabled !== false ? 'checked' : ''} onchange="activeData.footer.social[0].enabled = this.checked">
            <span class="slider"></span>
          </label>
        </div>
        <div class="form-group" style="margin: 0">
          <label>Instagram Page Link URL</label>
          <input type="text" value="${val(activeData.footer.social[0].href)}" oninput="activeData.footer.social[0].href = this.value" placeholder="e.g., https://instagram.com/yourbrand">
        </div>
      </div>

      <!-- Facebook -->
      <div style="border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 12px; margin-bottom: 12px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <strong>Facebook Profile</strong>
          <label class="switch" style="transform: scale(0.8)">
            <input type="checkbox" ${activeData.footer.social[1].enabled !== false ? 'checked' : ''} onchange="activeData.footer.social[1].enabled = this.checked">
            <span class="slider"></span>
          </label>
        </div>
        <div class="form-group" style="margin: 0">
          <label>Facebook Page Link URL</label>
          <input type="text" value="${val(activeData.footer.social[1].href)}" oninput="activeData.footer.social[1].href = this.value" placeholder="e.g., https://facebook.com/yourbrand">
        </div>
      </div>

      <!-- WhatsApp Footer Link -->
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <strong>WhatsApp Footer Shortcut</strong>
          <label class="switch" style="transform: scale(0.8)">
            <input type="checkbox" ${activeData.footer.social[2].enabled !== false ? 'checked' : ''} onchange="activeData.footer.social[2].enabled = this.checked">
            <span class="slider"></span>
          </label>
        </div>
        <p style="font-size: 12px; color: var(--muted); margin: 0">Uses the main contact WhatsApp phone number. Toggling this off hides it from the footer shortcuts.</p>
      </div>

    </div>
  `;
}

// 2. HERO
function renderHeroTab(panel) {
  const h = activeData.hero || {};
  if (!h.slides || !Array.isArray(h.slides)) {
    h.slides = [
      {
        image: h.image || "images/skin-hero.jpg",
        imageAlt: h.imageAlt || "Professional Cosmetology Training",
        title: "Empowering Your Passion in",
        titleAccent: "Cosmetology"
      }
    ];
    activeData.hero = h;
  }

  let slidesHTML = h.slides.map((slide, idx) => `
    <div class="item-card">
      <div class="item-card-header">
        <h4>Hero Slide #${idx + 1}</h4>
        ${h.slides.length > 1 ? `<button class="btn btn-danger btn-sm" onclick="deleteHeroSlide(${idx})">🗑️ Delete Slide</button>` : ''}
      </div>
      
      <div class="form-row-2">
        <div class="form-group">
          <label>Slide Title (Main Text)</label>
          <input type="text" value="${val(slide.title)}" oninput="activeData.hero.slides[${idx}].title = this.value">
        </div>
        <div class="form-group">
          <label>Slide Title Accent (Colored Text)</label>
          <input type="text" value="${val(slide.titleAccent)}" oninput="activeData.hero.slides[${idx}].titleAccent = this.value">
        </div>
      </div>

      <div class="form-group">
        <label>Image Alt Text (SEO)</label>
        <input type="text" value="${val(slide.imageAlt)}" oninput="activeData.hero.slides[${idx}].imageAlt = this.value">
      </div>

      <div class="form-group" style="margin: 0">
        <label>Background Image</label>
        <div class="image-upload-wrapper">
          <div class="image-preview" id="heroSlidePrev-${idx}">
            ${slide.image ? `<img src="${slide.image}" alt="Slide Preview">` : `<div class="image-preview-placeholder">No Image</div>`}
          </div>
          <div class="image-upload-controls">
            <div style="display:flex; gap:10px; flex-wrap: wrap;">
              <div class="btn btn-outline btn-sm file-input-btn">
                📤 Upload Image
                <input type="file" accept="image/*" onchange="handleImageUpload(this, 'heroSlidePrev-${idx}', 'hero.slides[${idx}].image')">
              </div>
              ${slide.image ? `<button type="button" class="btn btn-danger btn-sm" onclick="removeImageField('hero.slides[${idx}].image', 'heroSlidePrev-${idx}')">🗑️ Remove Image</button>` : ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  `).join("");

  panel.innerHTML = `
    ${getSectionHeader("Hero Section Settings", "Change hero slides, slide images, individual slide titles, subtitles, CTAs, and overlay trust badges.")}

    <div class="form-section-card">
      <div class="form-section-title">Hero Badge Settings</div>
      <div class="form-group" style="margin: 0">
        <label>Header Badge Label</label>
        <input type="text" value="${val(h.badge)}" oninput="activeData.hero.badge = this.value">
      </div>
    </div>

    <div class="form-section-card">
      <div class="form-section-title">Hero Subtitle & Description</div>
      <div class="form-group" style="margin: 0">
        <label>Hero Subtitle</label>
        <textarea oninput="activeData.hero.subtitle = this.value">${h.subtitle}</textarea>
      </div>
    </div>

    <h3 style="font-size: 16px; margin-bottom: 12px; font-weight:600">Hero Slideshow Settings</h3>
    <div class="items-list-grid">
      ${slidesHTML}
      <div class="add-item-card" onclick="addHeroSlide()">
        ➕ Add New Hero Slide
      </div>
    </div>

    <div class="form-section-card" style="margin-top: 24px;">
      <div class="form-section-title">Buttons & CTAs</div>
      <div class="form-row-2">
        <div class="form-group">
          <label>Primary Button Label</label>
          <input type="text" value="${val(h.btnPrimary.label)}" oninput="activeData.hero.btnPrimary.label = this.value">
        </div>
        <div class="form-group">
          <label>Secondary Button Label</label>
          <input type="text" value="${val(h.btnSecondary.label)}" oninput="activeData.hero.btnSecondary.label = this.value">
        </div>
      </div>
    </div>

    <div class="form-section-card">
      <div class="form-section-title">Consultation Overlay Card</div>
      <div class="form-row-3">
        <div class="form-group">
          <label>Card Title</label>
          <input type="text" value="${val(activeData.hero.consultCard.title)}" oninput="activeData.hero.consultCard.title = this.value">
        </div>
        <div class="form-group">
          <label>Sublabel</label>
          <input type="text" value="${val(activeData.hero.consultCard.label)}" oninput="activeData.hero.consultCard.label = this.value">
        </div>
        <div class="form-group">
          <label>Card Icon Emoji</label>
          <input type="text" value="${val(activeData.hero.consultCard.icon)}" oninput="activeData.hero.consultCard.icon = this.value">
        </div>
      </div>
      <div class="form-group">
        <label>Card Description</label>
        <textarea oninput="activeData.hero.consultCard.desc = this.value">${activeData.hero.consultCard.desc}</textarea>
      </div>
      <div class="form-group">
        <label>Bullet Tags (comma-separated)</label>
        <input type="text" value="${val(activeData.hero.consultCard.tags.join(', '))}" oninput="activeData.hero.consultCard.tags = this.value.split(',').map(s=>s.trim()).filter(Boolean)">
      </div>
    </div>
  `;
}

// 3. ABOUT
function renderAboutTab(panel) {
  panel.innerHTML = `
    ${getSectionHeader("About Us Settings", "Update the introduction section, academy overview process, features, and experience badge.")}
    
    <div class="form-section-card">
      <div class="form-section-title">Intro Headers</div>
      <div class="form-row-3">
        <div class="form-group">
          <label>Section Eyebrow</label>
          <input type="text" value="${val(activeData.about.eyebrow)}" oninput="activeData.about.eyebrow = this.value">
        </div>
        <div class="form-group">
          <label>Title Header</label>
          <input type="text" value="${val(activeData.about.title)}" oninput="activeData.about.title = this.value">
        </div>
        <div class="form-group">
          <label>Title Accent (Highlighted)</label>
          <input type="text" value="${val(activeData.about.titleAccent)}" oninput="activeData.about.titleAccent = this.value">
        </div>
      </div>
      <div class="form-group">
        <label>Description Paragraph 1</label>
        <textarea oninput="activeData.about.desc[0] = this.value">${activeData.about.desc[0]}</textarea>
      </div>
      <div class="form-group">
        <label>Description Paragraph 2</label>
        <textarea oninput="activeData.about.desc[1] = this.value">${activeData.about.desc[1]}</textarea>
      </div>
    </div>

    <div class="form-section-card">
      <div class="form-section-title">Features Checklist</div>
      <div class="form-group">
        <label>Checklist Items (One per line)</label>
        <textarea style="min-height: 120px" oninput="activeData.about.features = this.value.split('\\n').map(s=>s.trim()).filter(Boolean)">${activeData.about.features.join('\n')}</textarea>
      </div>
      <div class="form-row-2">
        <div class="form-group">
          <label>Experience Value (Badge)</label>
          <input type="text" value="${val(activeData.about.expBadge.value)}" oninput="activeData.about.expBadge.value = this.value">
        </div>
        <div class="form-group">
          <label>Experience Label</label>
          <input type="text" value="${val(activeData.about.expBadge.label.replace('<br/>', ' '))}" oninput="activeData.about.expBadge.label = this.value.replace(/\\n/g, '<br/>')">
        </div>
      </div>
    </div>

    <div class="form-section-card">
      <div class="form-section-title">Step-by-Step Care Process</div>
      <div class="form-row-2">
        <div class="form-group">
          <label>Process Header Label</label>
          <input type="text" value="${val(activeData.about.process.headLabel)}" oninput="activeData.about.process.headLabel = this.value">
        </div>
        <div class="form-group">
          <label>Process Header Title</label>
          <input type="text" value="${val(activeData.about.process.headTitle)}" oninput="activeData.about.process.headTitle = this.value">
        </div>
      </div>

      <div class="items-list-grid">
        ${activeData.about.process.steps.map((step, i) => `
          <div class="item-card">
            <div class="item-card-header">
              <h4>Step ${step.num}</h4>
            </div>
            <div class="form-row-2">
              <div class="form-group">
                <label>Step Title</label>
                <input type="text" value="${val(step.title)}" oninput="activeData.about.process.steps[${i}].title = this.value">
              </div>
              <div class="form-group">
                <label>Step Number</label>
                <input type="text" value="${val(step.num)}" oninput="activeData.about.process.steps[${i}].num = this.value">
              </div>
            </div>
            <div class="form-group" style="margin: 0">
              <label>Description</label>
              <textarea oninput="activeData.about.process.steps[${i}].desc = this.value">${step.desc}</textarea>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

// 4. SERVICES
function renderServicesTab(panel) {
  let listHTML = activeData.services.map((svc, i) => `
    <div class="item-card">
      <div class="item-card-header">
        <h4>Service #${i + 1}: ${svc.name || "Untitled Service"}</h4>
        <button class="btn btn-danger btn-sm" onclick="deleteService(${i})">🗑️ Delete</button>
      </div>

      <div class="form-row-2">
        <div class="form-group">
          <label>Service Name</label>
          <input type="text" value="${val(svc.name)}" oninput="activeData.services[${i}].name = this.value; renderCurrentTab();">
        </div>
        <div class="form-group">
          <label>Card Highlight Color (Hex code)</label>
          <input type="text" value="${val(svc.color)}" oninput="activeData.services[${i}].color = this.value">
        </div>
      </div>

      <div class="form-group">
        <label>Service Description</label>
        <textarea oninput="activeData.services[${i}].desc = this.value">${svc.desc}</textarea>
      </div>

      <div class="form-group">
        <label>SVG Icon Markup (Lucide / custom SVG)</label>
        <div class="icon-input-group">
          <textarea style="min-height: 50px" oninput="activeData.services[${i}].icon = this.value; document.getElementById('svc-icon-prev-${i}').innerHTML = this.value;">${svc.icon}</textarea>
          <div class="icon-preview-box" id="svc-icon-prev-${i}">${svc.icon || ""}</div>
        </div>
      </div>

      <div class="form-group" style="margin: 0">
        <label>Service Image</label>
        <div class="image-upload-wrapper">
          <div class="image-preview" id="svcImagePrev-${i}">
            ${svc.image ? `<img src="${svc.image}" alt="Service Image">` : `<div class="image-preview-placeholder">No Image</div>`}
          </div>
          <div class="image-upload-controls">
            <div style="display:flex; gap:10px; flex-wrap: wrap;">
              <div class="btn btn-outline btn-sm file-input-btn">
                📤 Upload Image
                <input type="file" accept="image/*" onchange="handleImageUpload(this, 'svcImagePrev-${i}', 'services[${i}].image')">
              </div>
              ${svc.image ? `<button type="button" class="btn btn-danger btn-sm" onclick="removeImageField('services[${i}].image', 'svcImagePrev-${i}')">🗑️ Remove Image</button>` : ''}
            </div>
            <p>Recommended: Square ratio, clean cosmetology theme.</p>
          </div>
        </div>
      </div>
    </div>
  `).join("");

  panel.innerHTML = `
    ${getSectionHeader("Manage Services", "Add, edit, or remove services offered on the website. Also configure the headers for the Services section.")}
    
    <div class="form-section-card">
      <div class="form-section-title">Services Headers</div>
      <div class="form-row-2">
        <div class="form-group">
          <label>Services Eyebrow</label>
          <input type="text" value="${val(activeData.sections.services.eyebrow)}" oninput="activeData.sections.services.eyebrow = this.value">
        </div>
        <div class="form-group">
          <label>Services Section Title</label>
          <input type="text" value="${val(activeData.sections.services.title)}" oninput="activeData.sections.services.title = this.value">
        </div>
      </div>
      <div class="form-row-2">
        <div class="form-group">
          <label>Title Accent</label>
          <input type="text" value="${val(activeData.sections.services.titleAccent)}" oninput="activeData.sections.services.titleAccent = this.value">
        </div>
        <div class="form-group">
          <label>Subtitle Description</label>
          <input type="text" value="${val(activeData.sections.services.subtitle)}" oninput="activeData.sections.services.subtitle = this.value">
        </div>
      </div>
    </div>

    <div class="items-list-grid">
      ${listHTML}
      <div class="add-item-card" onclick="addService()">
        ➕ Add New Service
      </div>
    </div>
  `;
}

window.deleteService = async function (index) {
  if (confirm("Are you sure you want to delete this service?")) {
    const oldUrl = activeData.services[index].image;
    activeData.services.splice(index, 1);
    showToast("Service deleted. Saving to database...", "info");
    if (oldUrl) await deleteFileFromStorage(oldUrl);
    await saveChanges();
    renderCurrentTab();
  }
};

window.addService = function () {
  const defaultIcon = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`;
  activeData.services.push({
    name: "New Service",
    desc: "Description of the new laundry or dry cleaning service.",
    color: "#00B4D8",
    image: "",
    icon: defaultIcon
  });
  showToast("Service added at the bottom. Fill details below.", "success");
  renderCurrentTab();

  // Scroll to bottom
  setTimeout(() => {
    const cards = document.querySelectorAll(".item-card");
    if (cards.length > 0) cards[cards.length - 1].scrollIntoView({ behavior: "smooth" });
  }, 100);
};

// 4.1 PRICING
function renderPricingTab(panel) {
  let listHTML = activeData.pricing.map((item, i) => `
    <div class="item-card">
      <div class="item-card-header">
        <h4>Pricing Package #${i + 1}: ${item.name || "Untitled Package"}</h4>
        <button class="btn btn-danger btn-sm" onclick="deletePricingItem(${i})">🗑️ Delete</button>
      </div>

      <div class="form-row-2">
        <div class="form-group">
          <label>Package Name</label>
          <input type="text" value="${val(item.name)}" oninput="activeData.pricing[${i}].name = this.value; renderCurrentTab();">
        </div>
        <div class="form-group">
          <label>Card Highlight Color (Hex code)</label>
          <input type="text" value="${val(item.color)}" oninput="activeData.pricing[${i}].color = this.value">
        </div>
      </div>

      <div class="form-group">
        <label>Package Price</label>
        <input type="text" value="${val(item.price)}" oninput="activeData.pricing[${i}].price = this.value" placeholder="e.g. ₹150 / kg">
      </div>

      <div class="form-group">
        <label>Package Description</label>
        <textarea oninput="activeData.pricing[${i}].desc = this.value">${item.desc}</textarea>
      </div>

      <div class="form-group">
        <label>SVG Icon Markup (Lucide / custom SVG)</label>
        <div class="icon-input-group">
          <textarea style="min-height: 50px" oninput="activeData.pricing[${i}].icon = this.value; document.getElementById('pricing-icon-prev-${i}').innerHTML = this.value;">${item.icon}</textarea>
          <div class="icon-preview-box" id="pricing-icon-prev-${i}">${item.icon || ""}</div>
        </div>
      </div>

      <div class="form-group" style="margin: 0">
        <label>Package Image</label>
        <div class="image-upload-wrapper">
          <div class="image-preview" id="pricingImagePrev-${i}">
            ${item.image ? `<img src="${item.image}" alt="Package Image">` : `<div class="image-preview-placeholder">No Image</div>`}
          </div>
          <div class="image-upload-controls">
            <div style="display:flex; gap:10px; flex-wrap: wrap;">
              <div class="btn btn-outline btn-sm file-input-btn">
                📤 Upload Image
                <input type="file" accept="image/*" onchange="handleImageUpload(this, 'pricingImagePrev-${i}', 'pricing[${i}].image')">
              </div>
              ${item.image ? `<button type="button" class="btn btn-danger btn-sm" onclick="removeImageField('pricing[${i}].image', 'pricingImagePrev-${i}')">🗑️ Remove Image</button>` : ''}
            </div>
            <p>Recommended: Square ratio, clean theme.</p>
          </div>
        </div>
      </div>
    </div>
  `).join("");

  if (!activeData.sections.pricing) {
    activeData.sections.pricing = {
      eyebrow: "Clear & Transparent",
      title: "Our",
      titleAccent: "Pricing",
      subtitle: "No hidden charges, just premium care for your clothes."
    };
  }

  panel.innerHTML = `
    ${getSectionHeader("Manage Pricing Packages", "Add, edit, or remove pricing packages and set their rates. Also configure the headers for the Pricing section.")}
    
    <div class="form-section-card">
      <div class="form-section-title">Pricing Headers</div>
      <div class="form-row-2">
        <div class="form-group">
          <label>Pricing Eyebrow</label>
          <input type="text" value="${val(activeData.sections.pricing.eyebrow)}" oninput="activeData.sections.pricing.eyebrow = this.value">
        </div>
        <div class="form-group">
          <label>Pricing Section Title</label>
          <input type="text" value="${val(activeData.sections.pricing.title)}" oninput="activeData.sections.pricing.title = this.value">
        </div>
      </div>
      <div class="form-row-2">
        <div class="form-group">
          <label>Title Accent</label>
          <input type="text" value="${val(activeData.sections.pricing.titleAccent)}" oninput="activeData.sections.pricing.titleAccent = this.value">
        </div>
        <div class="form-group">
          <label>Subtitle Description</label>
          <input type="text" value="${val(activeData.sections.pricing.subtitle)}" oninput="activeData.sections.pricing.subtitle = this.value">
        </div>
      </div>
    </div>

    <div class="items-list-grid">
      ${listHTML}
      <div class="add-item-card" onclick="addPricingItem()">
        ➕ Add New Pricing Item
      </div>
    </div>
  `;
}

window.deletePricingItem = async function (index) {
  if (confirm("Are you sure you want to delete this pricing item?")) {
    const oldUrl = activeData.pricing[index].image;
    activeData.pricing.splice(index, 1);
    showToast("Pricing item deleted. Saving to database...", "info");
    if (oldUrl) await deleteFileFromStorage(oldUrl);
    await saveChanges();
    renderCurrentTab();
  }
};

window.addPricingItem = function () {
  const defaultIcon = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`;
  activeData.pricing.push({
    name: "New Pricing Package",
    desc: "Description of the new pricing package.",
    price: "₹100 / item",
    color: "#00B4D8",
    image: "",
    icon: defaultIcon
  });
  showToast("Pricing item added at the bottom. Fill details below.", "success");
  renderCurrentTab();

  // Scroll to bottom
  setTimeout(() => {
    const cards = document.querySelectorAll(".item-card");
    if (cards.length > 0) cards[cards.length - 1].scrollIntoView({ behavior: "smooth" });
  }, 100);
};

// 5. WHY US
function renderWhyUsTab(panel) {
  panel.innerHTML = `
    ${getSectionHeader("Why Choose Us Features", "Control the text credentials listed in the why choose us grid.")}
    
    <div class="form-section-card">
      <div class="form-section-title">Section Headers</div>
      <div class="form-row-2">
        <div class="form-group">
          <label>Section Eyebrow</label>
          <input type="text" value="${val(activeData.sections.whyUs.eyebrow)}" oninput="activeData.sections.whyUs.eyebrow = this.value">
        </div>
        <div class="form-group">
          <label>Section Title</label>
          <input type="text" value="${val(activeData.sections.whyUs.title)}" oninput="activeData.sections.whyUs.title = this.value">
        </div>
      </div>
      <div class="form-row-2">
        <div class="form-group">
          <label>Title Accent</label>
          <input type="text" value="${val(activeData.sections.whyUs.titleAccent)}" oninput="activeData.sections.whyUs.titleAccent = this.value">
        </div>
        <div class="form-group">
          <label>Section Subtitle</label>
          <input type="text" value="${val(activeData.sections.whyUs.subtitle)}" oninput="activeData.sections.whyUs.subtitle = this.value">
        </div>
      </div>
    </div>

    <div class="items-list-grid">
      ${activeData.whyUs.map((item, i) => `
        <div class="item-card">
          <div class="item-card-header">
            <h4>Point ${item.num}</h4>
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label>Point Title</label>
              <input type="text" value="${val(item.title)}" oninput="activeData.whyUs[${i}].title = this.value">
            </div>
            <div class="form-group">
              <label>Point Number</label>
              <input type="text" value="${val(item.num)}" oninput="activeData.whyUs[${i}].num = this.value">
            </div>
          </div>
          <div class="form-group" style="margin: 0">
            <label>Short Description</label>
            <textarea oninput="activeData.whyUs[${i}].desc = this.value">${item.desc}</textarea>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

// 6. ACADEMY
function renderAcademyTab(panel) {
  const acad = activeData.academic || { enabled: false, stats: [], features: [], courses: [], eyebrow: "", title: "", titleAccent: "", subtitle: "", image: "", imageAlt: "", desc: [] };

  // Safeguard array references
  if (!acad.stats) acad.stats = [];
  if (!acad.features) acad.features = [];
  if (!acad.courses) acad.courses = [];
  if (!acad.desc) acad.desc = [""];
  activeData.academic = acad;

  let coursesHTML = acad.courses.map((course, i) => `
    <div class="item-card">
      <div class="item-card-header">
        <h4>Course #${course.num || i + 1}: ${course.title || "Untitled Course"}</h4>
        <button class="btn btn-danger btn-sm" onclick="deleteCourse(${i})">🗑️ Delete</button>
      </div>
      <div class="image-upload-wrapper" style="margin-bottom: 14px;">
        <div class="image-preview" id="courseImgPreview${i}" style="height: 140px;">
          ${course.image ? `<img src="${course.image}" alt="Course Image">` : `<div class="image-preview-placeholder">No Course Image</div>`}
        </div>
        <div class="image-upload-controls">
          <div style="display:flex; gap:10px; flex-wrap: wrap;">
            <div class="btn btn-outline btn-sm file-input-btn">
              📤 Upload Image
              <input type="file" accept="image/*" onchange="handleImageUpload(this, 'courseImgPreview${i}', 'academic.courses[${i}].image')">
            </div>
            ${course.image ? `<button type="button" class="btn btn-danger btn-sm" onclick="removeImageField('academic.courses[${i}].image', 'courseImgPreview${i}')">🗑️ Remove</button>` : ''}
          </div>
          <p>Upload a course-specific thumbnail or banner image.</p>
        </div>
      </div>
      <div class="form-row-2">
        <div class="form-group">
          <label>Course Title</label>
          <input type="text" value="${val(course.title)}" oninput="activeData.academic.courses[${i}].title = this.value">
        </div>
        <div class="form-group">
          <label>Course Index Num</label>
          <input type="text" value="${val(course.num)}" oninput="activeData.academic.courses[${i}].num = this.value">
        </div>
      </div>
      <div class="form-row-2">
        <div class="form-group">
          <label>Duration (e.g. 3 Months)</label>
          <input type="text" value="${val(course.duration)}" oninput="activeData.academic.courses[${i}].duration = this.value">
        </div>
        <div class="form-group">
          <label>Skill Level (e.g. Intermediate)</label>
          <input type="text" value="${val(course.level)}" oninput="activeData.academic.courses[${i}].level = this.value">
        </div>
      </div>
      <div class="form-group" style="margin: 0">
        <label>Course Description Summary</label>
        <textarea oninput="activeData.academic.courses[${i}].desc = this.value">${course.desc}</textarea>
      </div>
    </div>
  `).join("");

  panel.innerHTML = `
    ${getSectionHeader("Cosmetology Academy Section", "Enable or disable your student training course lists, details, and enrollment image.")}
    
    <div class="toggle-group">
      <div class="toggle-label">
        <strong>Enable Academy Section</strong>
        <span>Show or hide the Academy courses section on the homepage.</span>
      </div>
      <label class="switch">
        <input type="checkbox" id="academyToggleCheck" ${acad.enabled !== false ? 'checked' : ''} onchange="activeData.academic.enabled = this.checked">
        <span class="slider"></span>
      </label>
    </div>

    <div class="form-section-card">
      <div class="form-section-title">Academy Image Banner</div>
      <div class="image-upload-wrapper">
        <div class="image-preview" id="acadImagePreview">
          ${acad.image ? `<img src="${acad.image}" alt="Academy Banner">` : `<div class="image-preview-placeholder">No Image</div>`}
        </div>
        <div class="image-upload-controls">
          <div style="display:flex; gap:10px; flex-wrap: wrap;">
            <div class="btn btn-outline btn-sm file-input-btn">
              📤 Upload New Image
              <input type="file" accept="image/*" onchange="handleImageUpload(this, 'acadImagePreview', 'academic.image')">
            </div>
            ${acad.image ? `<button type="button" class="btn btn-danger btn-sm" onclick="removeImageField('academic.image', 'acadImagePreview')">🗑️ Remove Image</button>` : ''}
          </div>
          <p>Recommended: Landscape image, cosmetology classroom or students in action.</p>
          <div class="form-group" style="margin-top: 10px; width: 100%">
            <label>Image Alt (SEO)</label>
            <input type="text" value="${val(acad.imageAlt)}" oninput="activeData.academic.imageAlt = this.value">
          </div>
        </div>
      </div>
    </div>

    <div class="form-section-card">
      <div class="form-section-title">Academy Copy Headers</div>
      <div class="form-row-3">
        <div class="form-group">
          <label>Academy Eyebrow</label>
          <input type="text" value="${val(acad.eyebrow)}" oninput="activeData.academic.eyebrow = this.value">
        </div>
        <div class="form-group">
          <label>Title Header</label>
          <input type="text" value="${val(acad.title)}" oninput="activeData.academic.title = this.value">
        </div>
        <div class="form-group">
          <label>Title Accent</label>
          <input type="text" value="${val(acad.titleAccent)}" oninput="activeData.academic.titleAccent = this.value">
        </div>
      </div>
      <div class="form-group">
        <label>Section Subtitle</label>
        <textarea oninput="activeData.academic.subtitle = this.value">${acad.subtitle}</textarea>
      </div>
      <div class="form-group">
        <label>Description Paragraph</label>
        <textarea oninput="activeData.academic.desc[0] = this.value">${acad.desc[0] || ""}</textarea>
      </div>
      <div class="form-group">
        <label>Features Checklist (One per line)</label>
        <textarea style="min-height: 100px" oninput="activeData.academic.features = this.value.split('\\n').map(s=>s.trim()).filter(Boolean)">${acad.features.join('\n')}</textarea>
      </div>
    </div>

    <div class="form-section-card">
      <div class="form-section-title">Academy Statistics (4 metrics)</div>
      <div class="form-row-2">
        ${acad.stats.map((st, idx) => `
          <div class="form-group" style="border: 1px solid var(--color-border); padding: 12px; border-radius: 8px; background: rgba(0,0,0,0.1)">
            <label>Stat Metric #${idx + 1} (Value & Label)</label>
            <div class="form-row-2" style="gap: 10px">
              <input type="text" placeholder="Value (e.g. 100+)" value="${val(st.value)}" oninput="activeData.academic.stats[${idx}].value = this.value">
              <input type="text" placeholder="Label (e.g. Graduates)" value="${val(st.label)}" oninput="activeData.academic.stats[${idx}].label = this.value">
            </div>
          </div>
        `).join("")}
      </div>
    </div>

    <h3 style="font-size: 16px; margin-bottom: 12px; font-weight:600">Offered Courses List</h3>
    <div class="items-list-grid">
      ${coursesHTML}
      <div class="add-item-card" onclick="addCourse()">
        ➕ Add New Course
      </div>
    </div>
  `;
}

window.deleteCourse = async function (index) {
  if (confirm("Are you sure you want to delete this course?")) {
    activeData.academic.courses.splice(index, 1);
    showToast("Course deleted. Saving to database...", "info");
    await saveChanges();
    renderCurrentTab();
  }
};

window.addCourse = function () {
  activeData.academic.courses.push({
    num: String(activeData.academic.courses.length + 1).padStart(2, '0'),
    title: "New Cosmetology Course",
    desc: "Description details of what students learn and outcomes.",
    duration: "3 Months",
    level: "Beginner",
    image: ""
  });
  showToast("Course added at the bottom.", "success");
  renderCurrentTab();
};

// 7. DOCTOR / FOUNDER
function renderDoctorTab(panel) {
  const doc = activeData.doctor || {};
  if (!doc.bio) doc.bio = ["", ""];
  if (!doc.credentials) doc.credentials = [];
  if (!doc.expertise) doc.expertise = { title: "", points: [], note: "" };
  if (!doc.expertise.points) doc.expertise.points = [];
  activeData.doctor = doc;

  panel.innerHTML = `
    ${getSectionHeader("Founder / Trainer Profile", "Edit biological details, values, metrics, and training descriptions of the clinic head.")}
    
    <div class="form-section-card">
      <div class="form-section-title">Header & Profile Title</div>
      <div class="form-row-3">
        <div class="form-group">
          <label>Eyebrow Tag</label>
          <input type="text" value="${val(doc.eyebrow)}" oninput="activeData.doctor.eyebrow = this.value">
        </div>
        <div class="form-group">
          <label>Doctor's Full Name</label>
          <input type="text" value="${val(doc.name)}" oninput="activeData.doctor.name = this.value">
        </div>
        <div class="form-group">
          <label>Degree / Designation</label>
          <input type="text" value="${val(doc.degree)}" oninput="activeData.doctor.degree = this.value">
        </div>
      </div>
      <div class="form-group">
        <label>Bio Summary Paragraph 1</label>
        <textarea oninput="activeData.doctor.bio[0] = this.value">${doc.bio[0]}</textarea>
      </div>
      <div class="form-group">
        <label>Bio Summary Paragraph 2</label>
        <textarea oninput="activeData.doctor.bio[1] = this.value">${doc.bio[1]}</textarea>
      </div>
    </div>

    <div class="form-section-card">
      <div class="form-section-title">Credentials / Stats Counters</div>
      <div class="form-row-3">
        ${doc.credentials.map((cred, idx) => `
          <div class="form-group" style="border: 1px solid var(--color-border); padding: 10px; border-radius: 8px;">
            <label>Credential Counter #${idx + 1}</label>
            <input type="text" placeholder="Value (e.g. 15+)" value="${val(cred.value)}" oninput="activeData.doctor.credentials[${idx}].value = this.value" style="margin-bottom: 6px">
            <input type="text" placeholder="Label (e.g. Experience)" value="${val(cred.label)}" oninput="activeData.doctor.credentials[${idx}].label = this.value">
          </div>
        `).join("")}
      </div>
    </div>

    <div class="form-section-card">
      <div class="form-section-title">Expertise Points</div>
      <div class="form-group">
        <label>Expertise Subsection Title</label>
        <input type="text" value="${val(doc.expertise.title)}" oninput="activeData.doctor.expertise.title = this.value">
      </div>
      <div class="form-group">
        <label>Expertise Bullet Points (One per line)</label>
        <textarea style="min-height: 100px" oninput="activeData.doctor.expertise.points = this.value.split('\\n').map(s=>s.trim()).filter(Boolean)">${doc.expertise.points.join('\n')}</textarea>
      </div>
      <div class="form-group">
        <label>Honest Code Note (Bottom highlighted text)</label>
        <input type="text" value="${val(doc.expertise.note)}" oninput="activeData.doctor.expertise.note = this.value">
      </div>
    </div>
  `;
}

// 8. TESTIMONIALS
function renderTestimonialsTab(panel) {
  let testiHTML = activeData.testimonials.map((test, i) => `
    <div class="item-card">
      <div class="item-card-header">
        <h4>Reviewer: ${test.name || "Anonymous"}</h4>
        <button class="btn btn-danger btn-sm" onclick="deleteTestimonial(${i})">🗑️ Delete</button>
      </div>
      <div class="form-row-3">
        <div class="form-group">
          <label>Reviewer Name</label>
          <input type="text" value="${val(test.name)}" oninput="activeData.testimonials[${i}].name = this.value">
        </div>
        <div class="form-group">
          <label>Reviewer Role (e.g. Acne Client)</label>
          <input type="text" value="${val(test.role)}" oninput="activeData.testimonials[${i}].role = this.value">
        </div>
        <div class="form-group">
          <label>Star Rating (1 to 5)</label>
          <select onchange="activeData.testimonials[${i}].stars = parseInt(this.value, 10)">
            <option value="5" ${test.stars === 5 ? 'selected' : ''}>5 Stars</option>
            <option value="4" ${test.stars === 4 ? 'selected' : ''}>4 Stars</option>
            <option value="3" ${test.stars === 3 ? 'selected' : ''}>3 Stars</option>
            <option value="2" ${test.stars === 2 ? 'selected' : ''}>2 Stars</option>
            <option value="1" ${test.stars === 1 ? 'selected' : ''}>1 Star</option>
          </select>
        </div>
      </div>
      <div class="form-group" style="margin: 0">
        <label>Reviewer Feedback Text</label>
        <textarea oninput="activeData.testimonials[${i}].text = this.value">${test.text}</textarea>
      </div>
    </div>
  `).join("");

  panel.innerHTML = `
    ${getSectionHeader("Manage Client Reviews", "Edit, add, or remove feedback reviews shown in the testimonials slider.")}
    
    <div class="form-section-card">
      <div class="form-section-title">Section Title Headers</div>
      <div class="form-row-2">
        <div class="form-group">
          <label>Section Eyebrow</label>
          <input type="text" value="${val(activeData.sections.testimonials.eyebrow)}" oninput="activeData.sections.testimonials.eyebrow = this.value">
        </div>
        <div class="form-group">
          <label>Section Main Title</label>
          <input type="text" value="${val(activeData.sections.testimonials.title)}" oninput="activeData.sections.testimonials.title = this.value">
        </div>
      </div>
    </div>

    <div class="items-list-grid">
      ${testiHTML}
      <div class="add-item-card" onclick="addTestimonial()">
        ➕ Add New Review
      </div>
    </div>
  `;
}

window.deleteTestimonial = async function (index) {
  if (confirm("Are you sure you want to delete this review?")) {
    activeData.testimonials.splice(index, 1);
    showToast("Review deleted. Saving to database...", "info");
    await saveChanges();
    renderCurrentTab();
  }
};

window.addTestimonial = function () {
  activeData.testimonials.push({
    stars: 5,
    name: "Client Name",
    role: "Treatment Client",
    text: "Review text goes here describing the results they felt.",
    avatar: "#38BDF8",
    featured: false
  });
  showToast("Review added.", "success");
  renderCurrentTab();
};

// 9. CLIENT EXPERIENCE
function renderExperienceTab(panel) {
  let expHTML = activeData.experience.map((exp, i) => `
    <div class="item-card">
      <div class="item-card-header">
        <h4>Experience Item #${i + 1}: ${exp.title}</h4>
      </div>
      <div class="form-row-2">
        <div class="form-group">
          <label>Title</label>
          <input type="text" value="${val(exp.title)}" oninput="activeData.experience[${i}].title = this.value">
        </div>
        <div class="form-group">
          <label>Item Order Number</label>
          <input type="text" value="${val(exp.num)}" oninput="activeData.experience[${i}].num = this.value">
        </div>
      </div>
      <div class="form-group">
        <label>Detail Description Text</label>
        <textarea oninput="activeData.experience[${i}].desc = this.value">${exp.desc}</textarea>
      </div>

      <div class="form-group" style="margin: 0">
        <label>Grid Photo Image</label>
        <div class="image-upload-wrapper">
          <div class="image-preview" id="expImagePrev-${i}">
            ${exp.image ? `<img src="${exp.image}" alt="Experience Image">` : `<div class="image-preview-placeholder">No Image</div>`}
          </div>
          <div class="image-upload-controls">
            <div style="display:flex; gap:10px; flex-wrap: wrap;">
              <div class="btn btn-outline btn-sm file-input-btn">
                📤 Upload Image
                <input type="file" accept="image/*" onchange="handleImageUpload(this, 'expImagePrev-${i}', 'experience[${i}].image')">
              </div>
              ${exp.image ? `<button type="button" class="btn btn-danger btn-sm" onclick="removeImageField('experience[${i}].image', 'expImagePrev-${i}')">🗑️ Remove Image</button>` : ''}
            </div>
            <p>Recommended: Landscape spa theme.</p>
          </div>
        </div>
      </div>
    </div>
  `).join("");

  panel.innerHTML = `
    ${getSectionHeader("Premium Client Experiences", "Edit details and images that describe the clinic experience grids.")}
    
    <div class="form-section-card">
      <div class="form-section-title">Section Title Headers</div>
      <div class="form-row-3">
        <div class="form-group">
          <label>Eyebrow</label>
          <input type="text" value="${val(activeData.sections.experience.eyebrow)}" oninput="activeData.sections.experience.eyebrow = this.value">
        </div>
        <div class="form-group">
          <label>Title</label>
          <input type="text" value="${val(activeData.sections.experience.title)}" oninput="activeData.sections.experience.title = this.value">
        </div>
        <div class="form-group">
          <label>Accent</label>
          <input type="text" value="${val(activeData.sections.experience.titleAccent)}" oninput="activeData.sections.experience.titleAccent = this.value">
        </div>
      </div>
      <div class="form-group">
        <label>Subtitle Description</label>
        <input type="text" value="${val(activeData.sections.experience.subtitle)}" oninput="activeData.sections.experience.subtitle = this.value" style="width:100%">
      </div>
    </div>

    <div class="items-list-grid">
      ${expHTML}
    </div>
  `;
}

// 10. BACKUP, IMPORT, EXPORT & SUPABASE SETTINGS
function renderJsonEditorTab(panel) {
  const currentCfg = getEffectiveSupabaseConfig();
  const isCustomCfg = currentCfg.isCustom;

  panel.innerHTML = `
    ${getSectionHeader("Backup, Import/Export & Supabase Settings", "Export and import your complete website configurations, download offline JSON backups, or configure/test your connected Supabase project.")}
    
    <!-- 1. EXPORT & IMPORT CARD -->
    <div class="form-section-card">
      <div class="form-section-title">
        <span>📥 Export & 📤 Import Website Data</span>
      </div>
      <p style="font-size: 13px; color: var(--color-muted-foreground); margin-bottom: 16px;">
        Easily create an offline copy of your entire website data model or restore from a previously saved JSON backup file.
      </p>

      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:16px;">
        <!-- Export Box -->
        <div style="background:rgba(255,255,255,0.03); border:1px solid var(--color-border); border-radius:8px; padding:16px; display:flex; flex-direction:column; justify-content:space-between; gap:12px;">
          <div>
            <h4 style="font-size:14px; font-weight:600; color:var(--color-foreground); margin-bottom:6px;">📥 Export Data Backup</h4>
            <p style="font-size:12px; color:var(--color-muted-foreground); line-height:1.4;">
              Download a clean, formatted JSON file containing all active content, services, courses, testimonials, and gallery items.
            </p>
          </div>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button type="button" class="btn btn-primary btn-sm" onclick="downloadDataJson()">📥 Download JSON File</button>
            <button type="button" class="btn btn-outline btn-sm" onclick="copyJsonToClipboard()">📋 Copy JSON</button>
          </div>
        </div>

        <!-- Import Box -->
        <div style="background:rgba(255,255,255,0.03); border:1px solid var(--color-border); border-radius:8px; padding:16px; display:flex; flex-direction:column; justify-content:space-between; gap:12px;">
          <div>
            <h4 style="font-size:14px; font-weight:600; color:var(--color-foreground); margin-bottom:6px;">📤 Import & Restore Backup</h4>
            <p style="font-size:12px; color:var(--color-muted-foreground); line-height:1.4;">
              Upload a <code>.json</code> backup file to replace or restore your current active website configurations.
            </p>
          </div>
          <div>
            <input type="file" id="importJsonFileInput" accept=".json,application/json" style="display:none;" onchange="handleJsonFileImport(this)">
            <button type="button" class="btn btn-outline btn-sm" onclick="document.getElementById('importJsonFileInput').click()">📁 Select JSON File to Restore</button>
            <div id="importFileStatus" style="font-size:12px; color:var(--color-muted-foreground); margin-top:8px;"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. SUPABASE PROJECT CONFIGURATION CARD -->
    <div class="form-section-card">
      <div class="form-section-title" style="display:flex; justify-content:space-between; align-items:center;">
        <span>⚡ Supabase Database Connection & Switcher</span>
        <span class="status-badge ${isCustomCfg ? 'warning' : 'connected'}" style="font-size:11px;">
          ${isCustomCfg ? '⭐ Custom Admin Override' : '📁 File Config (supabase-config.js)'}
        </span>
      </div>
      <p style="font-size: 13px; color: var(--color-muted-foreground); margin-bottom: 16px;">
        Update or switch your connected Supabase project backend without modifying source code files.
      </p>

      <div class="form-group">
        <label>Supabase Project URL</label>
        <input type="text" id="supabaseUrlInput" value="${val(currentCfg.url)}" placeholder="https://your-project.supabase.co">
      </div>

      <div class="form-group">
        <label>Supabase Anon / Public Key</label>
        <input type="password" id="supabaseAnonKeyInput" value="${val(currentCfg.anonKey)}" placeholder="sb_publishable_... or your anon key">
        <small style="display:block; font-size:11px; color:var(--color-muted-foreground); margin-top:4px;">
          Your public/anon key is safe in client-side applications.
        </small>
      </div>

      <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center; margin-top:16px;">
        <button type="button" class="btn btn-primary btn-sm" onclick="saveCustomSupabaseConfig()">💾 Save & Connect Supabase</button>
        <button type="button" class="btn btn-outline btn-sm" id="testSupabaseConnBtn" onclick="testSupabaseCredentials()">🧪 Test Connection</button>
        ${isCustomCfg ? `<button type="button" class="btn btn-danger btn-sm" onclick="resetSupabaseConfigToDefault()">🔄 Reset to File Defaults</button>` : ''}
        <button type="button" class="btn btn-outline btn-sm" onclick="copySupabaseSqlScript()">📋 Copy Supabase SQL Setup</button>
      </div>

      <div id="supabaseTestResult" style="margin-top:12px; display:none; padding:10px 14px; border-radius:6px; font-size:12px;"></div>
    </div>

    <!-- 3. RAW JSON CODE EDITOR CARD -->
    <div class="form-section-card">
      <div class="form-section-title" style="display:flex; justify-content:space-between; align-items:center;">
        <span>💻 Raw JSON Code Editor</span>
        <div style="display:flex; gap:8px;">
          <button class="btn btn-outline btn-sm" onclick="formatRawJsonTextarea()">✨ Prettify</button>
          <button class="btn btn-primary btn-sm" onclick="applyRawJson()">💻 Apply Changes</button>
        </div>
      </div>
      <div class="form-group">
        <label>Live Data Tree (JSON format)</label>
        <textarea id="rawJsonTextarea" class="json-textarea" style="height:320px; font-family:var(--font-mono); font-size:12px; line-height:1.5;">${JSON.stringify(activeData, null, 2)}</textarea>
      </div>
      <div style="display:flex; gap:10px; flex-wrap:wrap;">
        <button class="btn btn-outline btn-sm" onclick="copyJsonToClipboard()">📋 Copy JSON</button>
        <button class="btn btn-outline btn-sm" onclick="resetJsonToDefault()">🔄 Reset to local data.json defaults</button>
      </div>
    </div>
  `;
}

window.downloadDataJson = function () {
  try {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activeData, null, 2));
    const downloadAnchor = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    const siteName = (activeData?.site?.name || "site-data").toLowerCase().replace(/[^a-z0-9]/g, "-");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${siteName}-backup-${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("Website data backup downloaded successfully!", "success");
  } catch (err) {
    showToast("Download failed: " + err.message, "error");
  }
};

window.handleJsonFileImport = function (inputEl) {
  const file = inputEl.files[0];
  if (!file) return;

  const statusEl = document.getElementById("importFileStatus");
  const reader = new FileReader();

  reader.onload = async function (e) {
    try {
      const content = e.target.result;
      const parsed = JSON.parse(content);

      if (!parsed.site) {
        throw new Error("Invalid structure: missing 'site' configuration object.");
      }

      const servicesCount = Array.isArray(parsed.services) ? parsed.services.length : 0;
      const coursesCount = Array.isArray(parsed.academic?.courses) ? parsed.academic.courses.length : 0;
      const galleryCount = Array.isArray(parsed.gallery?.items) ? parsed.gallery.items.length : 0;
      const siteName = parsed.site.name || "Unnamed Site";

      if (confirm(`Loaded "${file.name}" for "${siteName}":\n• Services: ${servicesCount}\n• Courses: ${coursesCount}\n• Gallery items: ${galleryCount}\n\nDo you want to restore this data and save it directly to Supabase?`)) {
        activeData = parsed;
        const txt = document.getElementById("rawJsonTextarea");
        if (txt) txt.value = JSON.stringify(activeData, null, 2);

        updateAdminBranding(parsed.site.name);
        showToast("Restoring configuration to database...", "info");
        await saveChanges();
        renderCurrentTab();
        showToast("Backup restored and saved to Supabase successfully!", "success");
      }
    } catch (err) {
      showToast("Import error: " + err.message, "error");
      if (statusEl) statusEl.innerHTML = `<span style="color:var(--color-destructive);">❌ Failed to parse: ${err.message}</span>`;
    } finally {
      inputEl.value = "";
    }
  };

  reader.readAsText(file);
};

window.saveCustomSupabaseConfig = async function () {
  const url = document.getElementById("supabaseUrlInput")?.value?.trim();
  const anonKey = document.getElementById("supabaseAnonKeyInput")?.value?.trim();

  if (!url || !anonKey) {
    showToast("Please provide both Supabase Project URL and Anon Key.", "error");
    return;
  }

  try {
    new URL(url);
  } catch (e) {
    showToast("Invalid Supabase URL format.", "error");
    return;
  }

  localStorage.setItem("custom_supabase_config", JSON.stringify({ url, anonKey }));
  showToast("Supabase credentials saved! Reconnecting...", "info");

  try {
    const { createClient } = window.supabase;
    supabaseClient = createClient(url, anonKey);
    await fetchConfig();
    showToast("Connected and configuration reloaded from new Supabase project!", "success");
    renderCurrentTab();
  } catch (err) {
    showToast("Connection warning: " + err.message, "error");
    renderCurrentTab();
  }
};

window.resetSupabaseConfigToDefault = async function () {
  if (confirm("Reset to default supabase-config.js credentials?")) {
    localStorage.removeItem("custom_supabase_config");
    showToast("Reset to file configuration! Reconnecting...", "info");
    const cfg = getEffectiveSupabaseConfig();
    if (cfg.url && cfg.anonKey) {
      const { createClient } = window.supabase;
      supabaseClient = createClient(cfg.url, cfg.anonKey);
      await fetchConfig();
    }
    renderCurrentTab();
  }
};

window.testSupabaseCredentials = async function () {
  const btn = document.getElementById("testSupabaseConnBtn");
  const resultEl = document.getElementById("supabaseTestResult");
  const url = (document.getElementById("supabaseUrlInput")?.value || "").trim();
  const anonKey = (document.getElementById("supabaseAnonKeyInput")?.value || "").trim();

  if (!url || !anonKey) {
    showToast("Please enter Supabase URL and Anon Key first.", "error");
    return;
  }

  if (btn) { btn.disabled = true; btn.textContent = "⏳ Testing..."; }
  if (resultEl) {
    resultEl.style.display = "block";
    resultEl.style.background = "rgba(56, 189, 248, 0.1)";
    resultEl.style.border = "1px solid rgba(56, 189, 248, 0.3)";
    resultEl.style.color = "#38BDF8";
    resultEl.textContent = "Connecting to Supabase REST API...";
  }

  try {
    const testUrl = `${url}/rest/v1/site_settings?select=id&limit=1`;
    const res = await fetch(testUrl, {
      method: "GET",
      headers: {
        "apikey": anonKey,
        "Authorization": `Bearer ${anonKey}`
      }
    });

    if (res.ok) {
      const json = await res.json();
      resultEl.style.background = "rgba(34, 197, 94, 0.1)";
      resultEl.style.border = "1px solid rgba(34, 197, 94, 0.3)";
      resultEl.style.color = "#22C55E";
      resultEl.innerHTML = `✅ Connection successful! Found <code>site_settings</code> table (${json.length} row(s) detected).`;
      showToast("Supabase connection verified!", "success");
    } else {
      const errorText = await res.text();
      resultEl.style.background = "rgba(239, 68, 68, 0.1)";
      resultEl.style.border = "1px solid rgba(239, 68, 68, 0.3)";
      resultEl.style.color = "#EF4444";
      resultEl.innerHTML = `⚠️ API reachable, but table check returned HTTP ${res.status}: ${esc(errorText)}. Make sure you ran the SQL setup script in your project.`;
      showToast("Connection issue: " + res.statusText, "error");
    }
  } catch (err) {
    resultEl.style.background = "rgba(239, 68, 68, 0.1)";
    resultEl.style.border = "1px solid rgba(239, 68, 68, 0.3)";
    resultEl.style.color = "#EF4444";
    resultEl.textContent = `❌ Network / Connection error: ${err.message}`;
    showToast("Connection test failed: " + err.message, "error");
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "🧪 Test Connection"; }
  }
};

window.copySupabaseSqlScript = function () {
  const sql = `-- 1. Create table for site settings
CREATE TABLE IF NOT EXISTS public.site_settings (
  id BIGINT PRIMARY KEY,
  content JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- 3. Allow public reads
CREATE POLICY "Allow public read" ON public.site_settings FOR SELECT USING (true);

-- 4. Allow authenticated writes
CREATE POLICY "Allow authenticated insert" ON public.site_settings FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update" ON public.site_settings FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete" ON public.site_settings FOR DELETE USING (auth.role() = 'authenticated');

-- 5. Create storage bucket for uploaded assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('cloth_wash_assets', 'cloth_wash_assets', true)
ON CONFLICT (id) DO NOTHING;

-- 6. Storage Policies
CREATE POLICY "Public storage view" ON storage.objects FOR SELECT USING (bucket_id = 'cloth_wash_assets');
CREATE POLICY "Authenticated storage insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'cloth_wash_assets' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated storage update" ON storage.objects FOR UPDATE USING (bucket_id = 'cloth_wash_assets' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated storage delete" ON storage.objects FOR DELETE USING (bucket_id = 'cloth_wash_assets' AND auth.role() = 'authenticated');`;

  navigator.clipboard.writeText(sql).then(() => {
    showToast("Supabase SQL setup script copied to clipboard!", "success");
  }).catch(() => {
    const ta = document.createElement("textarea");
    ta.value = sql;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
    showToast("Supabase SQL setup script copied to clipboard!", "success");
  });
};

window.formatRawJsonTextarea = function () {
  try {
    const txt = document.getElementById("rawJsonTextarea");
    if (!txt) return;
    const parsed = JSON.parse(txt.value);
    txt.value = JSON.stringify(parsed, null, 2);
    showToast("JSON formatted cleanly!", "info");
  } catch (err) {
    showToast("Cannot format: " + err.message, "error");
  }
};

window.copyJsonToClipboard = function () {
  const txt = document.getElementById("rawJsonTextarea");
  if (txt) {
    txt.select();
    document.execCommand("copy");
    showToast("JSON copied to clipboard!", "success");
  }
};

window.applyRawJson = function () {
  try {
    const rawVal = document.getElementById("rawJsonTextarea").value;
    const parsed = JSON.parse(rawVal);
    activeData = parsed;
    showToast("JSON applied successfully to browser active data. Click Save Changes to save to database.", "success");
  } catch (err) {
    showToast("Invalid JSON syntax: " + err.message, "error");
  }
};

window.resetJsonToDefault = async function () {
  if (confirm("Resetting will replace active workspace configurations with data.json values. Are you sure?")) {
    try {
      const res = await fetch("data.json", { cache: "no-store" });
      const defaultData = await res.json();
      activeData = defaultData;

      const txt = document.getElementById("rawJsonTextarea");
      if (txt) txt.value = JSON.stringify(activeData, null, 2);

      showToast("Reset successfully! Click Save Changes to commit to database.", "success");
    } catch (err) {
      showToast("Failed to fetch defaults: " + err.message, "error");
    }
  }
};

// ── SAVE CHANGES TO DATABASE ────────────────────────────
let isSaving = false;
async function saveChanges() {
  if (!supabaseClient || !activeData) {
    showToast("Cannot save. Database connection not configured or data not loaded.", "error");
    return;
  }

  if (isSaving) {
    console.log("Save already in progress, skipping duplicate save invocation.");
    return;
  }

  isSaving = true;
  const btn = document.getElementById("saveAllBtn");
  if (btn) {
    btn.innerHTML = "⏳ Saving...";
    btn.disabled = true;
  }

  try {
    if (!supabaseClient) {
      localStorage.setItem("local_site_data_override", JSON.stringify(activeData));
      showToast("Saved in local browser memory! (Connect Supabase in Backup tab to save to cloud database).", "success");
      return;
    }

    const { error } = await supabaseClient
      .from("site_settings")
      .upsert({
        id: 1,
        content: activeData,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;

    showToast("All changes saved to database successfully!", "success");
  } catch (err) {
    console.error("Save error:", err);
    showToast("Failed to save changes: " + err.message, "error");
  } finally {
    isSaving = false;
    if (btn) {
      btn.innerHTML = "💾 Save Changes";
      btn.disabled = false;
    }
  }
}

// ── MIGRATE LOCAL IMAGES TO SUPABASE ─────────────────────
window.migrateAllLocalImages = async function () {
  if (!supabaseClient || !activeData) {
    showToast("Database not connected or configurations not loaded.", "error");
    return;
  }

  const btn = document.getElementById("migrateImagesBtn");
  const originalText = btn.innerHTML;
  btn.innerHTML = "⏳ Migrating...";
  btn.disabled = true;

  try {
    showToast("Starting image migration...", "info");

    // Find all images in activeData
    const imageTargets = [];

    // 1. Hero slideshow images
    if (activeData.hero && activeData.hero.slides && Array.isArray(activeData.hero.slides)) {
      activeData.hero.slides.forEach((slide, i) => {
        if (slide.image) {
          imageTargets.push({ path: `hero.slides[${i}].image`, val: slide.image });
        }
      });
    }
    // 2. Academy image
    if (activeData.academic && activeData.academic.image) {
      imageTargets.push({ path: "academic.image", val: activeData.academic.image });
    }
    // 3. Services images
    if (activeData.services && Array.isArray(activeData.services)) {
      activeData.services.forEach((svc, i) => {
        if (svc.image) {
          imageTargets.push({ path: `services[${i}].image`, val: svc.image });
        }
      });
    }
    // 4. Experience images
    if (activeData.experience && Array.isArray(activeData.experience)) {
      activeData.experience.forEach((exp, i) => {
        if (exp.image) {
          imageTargets.push({ path: `experience[${i}].image`, val: exp.image });
        }
      });
    }
    // 5. Gallery images
    if (activeData.gallery && activeData.gallery.items && Array.isArray(activeData.gallery.items)) {
      activeData.gallery.items.forEach((item, i) => {
        if (item.image) {
          imageTargets.push({ path: `gallery.items[${i}].image`, val: item.image });
        }
      });
    }

    // Filter to keep only local images (e.g., starting with "images/")
    const locals = imageTargets.filter(t => t.val && !t.val.startsWith("http") && !t.val.startsWith("data:"));

    if (locals.length === 0) {
      showToast("No local images to migrate! All images are already stored in Supabase.", "success");
      return;
    }

    showToast(`Found ${locals.length} local images to migrate. Please wait...`, "info");

    let successCount = 0;
    for (let i = 0; i < locals.length; i++) {
      const target = locals[i];
      try {
        showToast(`Migrating (${i + 1}/${locals.length}): ${target.val}`, "info");

        // Fetch file over HTTP
        const res = await fetch(target.val);
        if (!res.ok) throw new Error(`HTTP status ${res.status}`);
        const blob = await res.blob();

        // Extract filename
        const filename = target.val.split('/').pop() || "image.jpg";
        const cleanName = `${Date.now()}_migrated_${filename}`;
        const filePath = `uploads/${cleanName}`;

        // Upload to Storage
        const { data, error } = await supabaseClient.storage
          .from("cloth_wash_assets")
          .upload(filePath, blob, { contentType: blob.type, cacheControl: '3600', upsert: true });

        if (error) throw error;

        // Get public URL
        const { data: urlData } = supabaseClient.storage
          .from("cloth_wash_assets")
          .getPublicUrl(filePath);

        const publicUrl = urlData.publicUrl;

        // Update local object
        updateNestedValue(activeData, target.path, publicUrl);
        successCount++;
      } catch (uploadErr) {
        console.error(`Failed to migrate image ${target.val}:`, uploadErr);
        showToast(`Failed to migrate ${target.val}: ${uploadErr.message}`, "error");
      }
    }

    // Auto-save changes to the database
    if (successCount > 0) {
      showToast(`Successfully migrated ${successCount} images. Saving changes to database...`, "info");
      await saveChanges();
      renderCurrentTab();
    }
  } catch (err) {
    showToast("Migration error: " + err.message, "error");
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
};

// ── RENDER: GALLERY TAB ──────────────────────────────────
function renderGalleryTab(panel) {
  const g = activeData.gallery || { eyebrow: "", title: "", titleAccent: "", subtitle: "", categories: [], items: [] };

  if (!g.categories) g.categories = ["All", "Treatments", "Academy", "Transformations"];
  if (!g.items) g.items = [];
  activeData.gallery = g;

  let criteriaHTML = g.categories.filter(c => c !== "All").map((cat, idx) => `
    <div style="display: flex; gap: 10px; margin-bottom: 8px; align-items: center;">
      <input type="text" value="${val(cat)}" onchange="updateCriteria(${idx}, this.value)" style="flex: 1; padding: 8px 12px; margin-bottom: 0;">
      <button class="btn btn-danger btn-sm" onclick="deleteCriteria(${idx})">🗑️ Delete</button>
    </div>
  `).join("");

  let itemsHTML = g.items.map((item, i) => `
    <div class="item-card">
      <div class="item-card-header">
        <h4>Showcase Photo #${i + 1}</h4>
        <button class="btn btn-danger btn-sm" onclick="deleteGalleryItem(${i})">🗑️ Delete</button>
      </div>

      <div class="form-row-2">
        <div class="form-group">
          <label>Photo Title / Caption</label>
          <input type="text" value="${val(item.title)}" oninput="activeData.gallery.items[${i}].title = this.value">
        </div>
        <div class="form-group">
          <label>Category Tag</label>
          <select onchange="activeData.gallery.items[${i}].category = this.value">
            ${g.categories.filter(c => c !== "All").map(cat => `
              <option value="${val(cat)}" ${item.category === cat ? 'selected' : ''}>${cat}</option>
            `).join("")}
          </select>
        </div>
      </div>

      <div class="form-group" style="margin: 0">
        <label>Showcase Image</label>
        <div class="image-upload-wrapper">
          <div class="image-preview" id="galleryImagePrev-${i}">
            ${item.image ? `<img src="${item.image}" alt="Gallery Image">` : `<div class="image-preview-placeholder">No Image</div>`}
          </div>
          <div class="image-upload-controls">
            <div style="display:flex; gap:10px; flex-wrap: wrap;">
              <div class="btn btn-outline btn-sm file-input-btn">
                📤 Upload Photo
                <input type="file" accept="image/*" onchange="handleImageUpload(this, 'galleryImagePrev-${i}', 'gallery.items[${i}].image')">
              </div>
              ${item.image ? `<button type="button" class="btn btn-danger btn-sm" onclick="removeImageField('gallery.items[${i}].image', 'galleryImagePrev-${i}')">🗑️ Remove Image</button>` : ''}
            </div>
            <p>Recommended: landscape aspect ratio.</p>
          </div>
        </div>
      </div>
    </div>
  `).join("");

  panel.innerHTML = `
    ${getSectionHeader("Showcase Gallery Settings", "Add, edit, or delete criteria and photos shown in the showcase gallery.")}
    
    <div class="toggle-group">
      <div class="toggle-label">
        <strong>Enable Gallery Section</strong>
        <span>Show or hide the showcase gallery grid on the homepage.</span>
      </div>
      <label class="switch">
        <input type="checkbox" id="galleryToggleCheck" ${g.enabled !== false ? 'checked' : ''} onchange="activeData.gallery.enabled = this.checked">
        <span class="slider"></span>
      </label>
    </div>

    <div class="form-section-card">
      <div class="form-section-title">Showcase Criteria / Categories</div>
      <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px;">
        ${criteriaHTML}
      </div>
      <button class="btn btn-outline btn-sm" onclick="addCriteria()">➕ Add New Criteria</button>
    </div>

    <h3 style="font-size: 16px; margin-bottom: 12px; font-weight:600">Gallery Items</h3>
    <div class="items-list-grid">
      ${itemsHTML}
      <div class="add-item-card" onclick="addGalleryItem()">
        ➕ Add New Gallery Photo
      </div>
    </div>
  `;
}

window.deleteGalleryItem = async function (index) {
  if (confirm("Are you sure you want to delete this gallery image?")) {
    const oldUrl = activeData.gallery.items[index].image;
    activeData.gallery.items.splice(index, 1);
    showToast("Photo deleted. Saving to database...", "info");
    if (oldUrl) await deleteFileFromStorage(oldUrl);
    await saveChanges();
    renderCurrentTab();
  }
};

window.addGalleryItem = function () {
  const g = activeData.gallery;
  const firstCat = g.categories.filter(c => c !== "All")[0] || "Treatments";
  g.items.push({
    image: "",
    title: "New Showcase Image",
    category: firstCat
  });
  showToast("Photo added at the bottom.", "success");
  renderCurrentTab();

  setTimeout(() => {
    const cards = document.querySelectorAll(".item-card");
    if (cards.length > 0) cards[cards.length - 1].scrollIntoView({ behavior: "smooth" });
  }, 100);
};

// Criteria managers
window.updateCriteria = function (idx, value) {
  const g = activeData.gallery;
  const cats = g.categories.filter(c => c !== "All");
  const oldVal = cats[idx];
  const newVal = value.trim();
  if (!newVal) return;

  cats[idx] = newVal;
  g.categories = ["All", ...cats];

  // Update gallery items utilizing this category
  if (g.items) {
    g.items.forEach(item => {
      if (item.category === oldVal) {
        item.category = newVal;
      }
    });
  }

  showToast("Criteria updated successfully.", "success");
  renderCurrentTab();
};

window.deleteCriteria = async function (idx) {
  const g = activeData.gallery;
  const cats = g.categories.filter(c => c !== "All");
  const catToDelete = cats[idx];

  if (confirm(`Are you sure you want to delete the criteria "${catToDelete}"? This will map existing photos under this criteria to another category.`)) {
    cats.splice(idx, 1);
    g.categories = ["All", ...cats];

    const firstCat = cats[0] || "Treatments";
    if (g.items) {
      g.items.forEach(item => {
        if (item.category === catToDelete) {
          item.category = firstCat;
        }
      });
    }

    showToast(`Criteria "${catToDelete}" removed. Saving to database...`, "info");
    await saveChanges();
    renderCurrentTab();
  }
};

window.addCriteria = function () {
  const g = activeData.gallery;
  const cats = g.categories.filter(c => c !== "All");
  cats.push("New Category");
  g.categories = ["All", ...cats];

  showToast("Criteria added.", "success");
  renderCurrentTab();
};

// Hero slide helper functions
window.deleteHeroSlide = async function (idx) {
  const h = activeData.hero;
  if (h.slides.length <= 1) {
    showToast("You must keep at least one slide.", "error");
    return;
  }
  if (confirm("Are you sure you want to delete this hero slide?")) {
    const oldUrl = h.slides[idx].image;
    h.slides.splice(idx, 1);
    showToast("Hero slide deleted. Saving changes...", "info");
    if (oldUrl) await deleteFileFromStorage(oldUrl);
    await saveChanges();
    renderCurrentTab();
  }
};

window.addHeroSlide = function () {
  const h = activeData.hero;
  h.slides.push({
    image: "",
    imageAlt: "Hero Banner",
    title: "New Slide Title",
    titleAccent: "Accent"
  });
  showToast("New hero slide added.", "success");
  renderCurrentTab();

  setTimeout(() => {
    const cards = document.querySelectorAll(".item-card");
    if (cards.length > 0) cards[cards.length - 1].scrollIntoView({ behavior: "smooth" });
  }, 100);
};

// ── REALTIME PREVIEW FUNCTIONS ──────────────────────────
let previewZoom = 1;

window.refreshPreview = function () {
  const iframe = document.getElementById("previewIframe");
  if (iframe) {
    iframe.src = iframe.src;
  }
};

window.previewMobile = function () {
  const iframe = document.getElementById("previewIframe");
  if (iframe) {
    iframe.style.width = "375px";
    iframe.style.height = "667px";
    iframe.style.borderRadius = "24px";
    iframe.style.border = "12px solid #334155";
  }
};

window.previewDesktop = function () {
  const iframe = document.getElementById("previewIframe");
  if (iframe) {
    previewMobileMode = false;
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.borderRadius = "8px";
    iframe.style.border = "none";
  }
};

window.previewZoomIn = function () {
  if (previewZoom < 1.5) {
    previewZoom = parseFloat((previewZoom + 0.1).toFixed(1));
    updatePreviewZoom();
  }
};

window.previewZoomOut = function () {
  if (previewZoom > 0.5) {
    previewZoom = parseFloat((previewZoom - 0.1).toFixed(1));
    updatePreviewZoom();
  }
};

function updatePreviewZoom() {
  const iframe = document.getElementById("previewIframe");
  const zoomText = document.getElementById("previewZoomVal");
  if (iframe) {
    iframe.style.transform = `scale(${previewZoom})`;
  }
  if (zoomText) {
    zoomText.textContent = `${Math.round(previewZoom * 100)}%`;
  }
}

let isPreviewEnabled = false;

window.toggleLivePreview = async function (enabled) {
  isPreviewEnabled = enabled;
  if (activeData && activeData.site) {
    activeData.site.previewEnabled = enabled;
  }

  const splitWrapper = document.querySelector(".db-content-split");
  if (splitWrapper) {
    if (enabled) {
      splitWrapper.classList.remove("preview-disabled");
      sendDataToPreview();
    } else {
      splitWrapper.classList.add("preview-disabled");
    }
  }

  // Save preview toggle state immediately to Supabase
  if (supabaseClient && activeData) {
    await saveChanges();
  }
};

// Post current activeData config to iframe preview
function sendDataToPreview() {
  if (!isPreviewEnabled) return;
  const iframe = document.getElementById("previewIframe");
  if (iframe && iframe.contentWindow) {
    iframe.contentWindow.postMessage({
      type: "UPDATE_PREVIEW_DATA",
      data: activeData
    }, "*");
  }
}

let autoSaveTimeout = null;
function triggerAutoSave() {
  if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
  autoSaveTimeout = setTimeout(async () => {
    if (supabaseClient && activeData) {
      console.log("Debounced auto-save triggered.");
      await saveChanges();
    }
  }, 1200);
}

// Event listeners to sync data on edits
document.addEventListener("input", () => {
  sendDataToPreview();
  triggerAutoSave();
});
document.addEventListener("change", async () => {
  if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
  sendDataToPreview();
  if (supabaseClient && activeData) {
    await saveChanges();
  }
});

// Send initial load data when iframe finishes loading
document.addEventListener("DOMContentLoaded", () => {
  const iframe = document.getElementById("previewIframe");
  if (iframe) {
    iframe.addEventListener("load", () => {
      if (activeData) sendDataToPreview();
    });
  }
});

// Select and apply color themes
window.selectColorTheme = async function (themeName) {
  activeData.site.theme = themeName;

  if (themeName === 'custom' && !activeData.site.customTheme) {
    activeData.site.customTheme = {
      background: "#1a0a2e",
      accent: "#0284C7",
      accentHover: "#DB2777"
    };
  }

  if (activeData.site.themeEnabled) {
    applyCustomThemeStyles(activeData.site.customTheme);
    document.body.className = "admin-body theme-" + themeName;
  } else {
    applyCustomThemeStyles(null);
    document.body.className = "admin-body theme-default";
  }
  await saveChanges();
  renderCurrentTab();
  sendDataToPreview();
};

// Dynamic custom theme override styles helper
function applyCustomThemeStyles(themeObj) {
  let styleEl = document.getElementById("custom-theme-style");
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "custom-theme-style";
    document.head.appendChild(styleEl);
  }

  if (themeObj && (activeData.site.theme === 'custom') && activeData.site.themeEnabled) {
    const bg = themeObj.background || "#1a0a2e";
    const acc = themeObj.accent || "#0284C7";
    const accHover = themeObj.accentHover || "#DB2777";

    const hexToRgb = (hex) => {
      const bigint = parseInt(hex.replace("#", ""), 16);
      if (isNaN(bigint)) return "2, 132, 199"; // fallback blue
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;
      return `${r}, ${g}, ${b}`;
    };

    const bgRgb = hexToRgb(bg);
    const accRgb = hexToRgb(acc);

    const escapedAcc = encodeURIComponent(acc);
    styleEl.innerHTML = `
      body.theme-custom {
        --plum: ${bg};
        --plum-rgb: ${bgRgb};
        --rose: ${acc};
        --rose-rgb: ${accRgb};
        --rose2: ${accHover};
        --purple: ${acc};
        --ring-rgb: ${accRgb};
        --blush: rgba(${accRgb}, 0.08);
        --border: rgba(${accRgb}, 0.2);
        --text: ${acc};
        --select-arrow: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='${escapedAcc}' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
      }
      body.admin-body.theme-custom {
        --color-primary: ${bg};
        --color-ring: ${acc};
        --color-background: ${bg};
        --color-card: rgba(255, 255, 255, 0.02);
        --color-border: rgba(255, 255, 255, 0.08);
      }
    `;
  } else {
    styleEl.innerHTML = "";
  }
}

// Enable/Disable theme customization globally
window.toggleThemeCustomization = async function (enabled) {
  activeData.site.themeEnabled = enabled;

  if (enabled) {
    applyCustomThemeStyles(activeData.site.customTheme);
    document.body.className = "admin-body theme-" + (activeData.site.theme || "default");
  } else {
    applyCustomThemeStyles(null);
    document.body.className = "admin-body theme-default";
  }

  await saveChanges();
  renderCurrentTab();
  sendDataToPreview();
};

// Live-update specific custom theme hex code or color picker
window.updateCustomThemeColor = function (key, value) {
  if (!activeData.site.customTheme) {
    activeData.site.customTheme = { background: "#1a0a2e", accent: "#0284C7", accentHover: "#DB2777" };
  }
  activeData.site.customTheme[key] = value;

  // Re-apply styles instantly
  applyCustomThemeStyles(activeData.site.customTheme);

  // Dynamic element updates to avoid reset input focus
  const textInput = document.querySelector(`input[oninput="updateCustomThemeColor('${key}', this.value)"][type="text"]`);
  const colorInput = document.querySelector(`input[oninput="updateCustomThemeColor('${key}', this.value)"][type="color"]`);
  if (textInput) textInput.value = value;
  if (colorInput) colorInput.value = value;

  sendDataToPreview();
};
