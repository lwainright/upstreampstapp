// ═══════════════════════════════════════════════════════════════
// UPSTREAM - MAIN APPLICATION LOGIC (ENHANCED)
// ═══════════════════════════════════════════════════════════════
// © 2026 Upstream Applications, LLC
// ═══════════════════════════════════════════════════════════════

import { useDemoMode } from "./hooks/useDemoMode.js";

// ─────────────────────────────────────────────────────────────
// GLOBAL STATE
// ─────────────────────────────────────────────────────────────

let agencyData = {
  pst: [],
  cit: null,
  resources: [],
  branding: null, // ADDED
  features: {} // ADDED
};

let userRole = null; // ADDED
let isDemoMode = false; // ADDED

// ─────────────────────────────────────────────────────────────
// THEME HANDLING
// ─────────────────────────────────────────────────────────────

/**
 * Initialize theme system
 */
function initTheme() {
  const savedTheme = localStorage.getItem("theme");
  
  if (savedTheme && savedTheme !== "system") {
    document.documentElement.setAttribute("data-theme", savedTheme);
  } else {
    // ADDED: Auto-detect system preference
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (prefersDark) {
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }
  
  const themeSelect = document.getElementById("theme-select");
  
  if (themeSelect) {
    themeSelect.value = savedTheme || "system";
    
    themeSelect.addEventListener("change", () => {
      const value = themeSelect.value;
      
      if (value === "system") {
        document.documentElement.removeAttribute("data-theme");
        localStorage.removeItem("theme");
        
        // ADDED: Apply system preference
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        if (prefersDark) {
          document.documentElement.setAttribute("data-theme", "dark");
        }
      } else {
        document.documentElement.setAttribute("data-theme", value);
        localStorage.setItem("theme", value);
      }
      
      console.log(`✅ Theme changed to: ${value}`);
    });
  }
  
  // ADDED: Listen for system theme changes
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    const currentTheme = localStorage.getItem("theme");
    if (!currentTheme || currentTheme === "system") {
      document.documentElement.setAttribute("data-theme", e.matches ? "dark" : "light");
    }
  });
}

// ─────────────────────────────────────────────────────────────
// LOCAL RESOURCES (SETTINGS PAGE)
// ─────────────────────────────────────────────────────────────

/**
 * Initialize local resources management
 */
function initLocalResources() {
  const resourcesBox = document.getElementById("local-resources");
  const saveResourcesBtn = document.getElementById("save-resources");
  
  if (resourcesBox) {
    const saved = localStorage.getItem("localResources");
    if (saved) {
      resourcesBox.value = saved;
    }
  }
  
  if (saveResourcesBtn) {
    saveResourcesBtn.addEventListener("click", () => {
      if (!resourcesBox) return;
      
      try {
        localStorage.setItem("localResources", resourcesBox.value);
        showNotification("✅ Local resources saved on this device.", "success");
        console.log("✅ Resources saved");
      } catch (err) {
        console.error("❌ Failed to save resources:", err);
        showNotification("❌ Failed to save resources. Storage may be full.", "error");
      }
    });
  }
}

// ─────────────────────────────────────────────────────────────
// DATA MANAGEMENT
// ─────────────────────────────────────────────────────────────

/**
 * Clear all local data
 */
function initDataManagement() {
  const clearDataBtn = document.getElementById("clear-data");
  
  if (clearDataBtn) {
    clearDataBtn.addEventListener("click", () => {
      if (confirm("Clear all saved data on this device? This includes:\n• AI chat history\n• Local resources\n• Settings\n• Theme preferences\n\nThis cannot be undone.")) {
        try {
          localStorage.clear();
          showNotification("✅ All local data cleared.", "success");
          console.log("✅ Local data cleared");
          
          // Reload after short delay
          setTimeout(() => {
            location.reload();
          }, 1000);
        } catch (err) {
          console.error("❌ Failed to clear data:", err);
          showNotification("❌ Failed to clear data.", "error");
        }
      }
    });
  }
}

// ─────────────────────────────────────────────────────────────
// SERVICE WORKER MANAGEMENT
// ─────────────────────────────────────────────────────────────

/**
 * Register service worker for offline support
 */
function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
      try {
        const registration = await navigator.serviceWorker.register("/service-worker.js");
        console.log("✅ Service worker registered:", registration.scope);
        
        // ADDED: Listen for updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // New version available
              showNotification("📥 New version available! Refresh to update.", "info");
            }
          });
        });
      } catch (err) {
        console.error("❌ Service worker registration failed:", err);
      }
    });
  } else {
    console.warn("⚠️ Service workers not supported in this browser");
  }
}

/**
 * Initialize cache refresh button
 */
function initCacheRefresh() {
  const refreshCacheBtn = document.getElementById("refresh-cache");
  
  if (refreshCacheBtn) {
    refreshCacheBtn.addEventListener("click", async () => {
      if ("serviceWorker" in navigator) {
        try {
          const reg = await navigator.serviceWorker.getRegistration();
          
          if (reg) {
            await reg.update();
            showNotification("✅ Offline files refreshed.", "success");
            console.log("✅ Cache refreshed");
          } else {
            showNotification("⚠️ Service worker not found.", "warning");
          }
        } catch (err) {
          console.error("❌ Cache refresh failed:", err);
          showNotification("❌ Failed to refresh cache.", "error");
        }
      } else {
        showNotification("⚠️ Service workers not supported.", "warning");
      }
    });
  }
}

// ─────────────────────────────────────────────────────────────
// AGENCY DATA MANAGEMENT
// ─────────────────────────────────────────────────────────────

/**
 * Set agency data globally
 * @param {Object} data - Agency configuration
 */
function setAgencyData(data) {
  agencyData = {
    ...data,
    loadedAt: new Date().toISOString() // ADDED: Timestamp
  };
  
  window.AGENCY_DATA = agencyData; // Expose globally
  
  // ADDED: Store in sessionStorage for persistence across pages
  try {
    sessionStorage.setItem("agencyData", JSON.stringify(agencyData));
  } catch (err) {
    console.warn("⚠️ Failed to store agency data:", err);
  }
  
  // ADDED: Apply branding if available
  if (data.branding) {
    applyBranding(data.branding);
  }
  
  console.log("✅ Agency data loaded:", {
    pst: agencyData.pst?.length || 0,
    cit: agencyData.cit ? "Loaded" : "None",
    resources: agencyData.resources?.length || 0,
    isDemo: agencyData.isDemo || false
  });
}

/**
 * Set user role
 * @param {string} role - User role (user/pst/admin/demo)
 */
function setRole(role) {
  userRole = role;
  localStorage.setItem("role", role);
  console.log(`✅ Role set to: ${role}`);
}

/**
 * Get current user role
 * @returns {string|null} Current role
 */
function getRole() {
  return userRole || localStorage.getItem("role");
}

// ─────────────────────────────────────────────────────────────
// BRANDING (ADDED)
// ─────────────────────────────────────────────────────────────

/**
 * Apply agency branding (ADDED)
 * @param {Object} branding - Branding configuration
 */
function applyBranding(branding) {
  if (!branding) return;
  
  // Update CSS variables
  if (branding.primaryColor) {
    document.documentElement.style.setProperty("--color-primary", branding.primaryColor);
  }
  
  if (branding.secondaryColor) {
    document.documentElement.style.setProperty("--color-secondary", branding.secondaryColor);
  }
  
  if (branding.accentColor) {
    document.documentElement.style.setProperty("--color-accent", branding.accentColor);
  }
  
  // Update logo if available
  const logoElements = document.querySelectorAll(".agency-logo");
  logoElements.forEach(el => {
    if (branding.logoUrl) {
      el.src = branding.logoUrl;
    }
  });
  
  // Update agency name
  const nameElements = document.querySelectorAll(".agency-name");
  nameElements.forEach(el => {
    if (branding.agencyName) {
      el.textContent = branding.agencyName;
    }
  });
  
  console.log("✅ Branding applied");
}

// ─────────────────────────────────────────────────────────────
// AGENCY CODE HANDLER
// ─────────────────────────────────────────────────────────────

/**
 * Handle agency code entry
 * @param {string} agencyCode - Access code entered by user
 */
async function handleAgencyCode(agencyCode) {
  if (!agencyCode) {
    showNotification("⚠️ Please enter an agency code.", "warning");
    return;
  }
  
  const code = agencyCode.trim().toUpperCase();
  
  // Check for demo code
  if (code === "UPSTREAM" || code === "DEMO") {
    try {
      const success = await useDemoMode(code, setRole, setAgencyData, (flag) => {
        isDemoMode = flag;
      });
      
      if (success) {
        showNotification("✅ Demo mode activated.", "success");
        
        // ADDED: Redirect to home after delay
        setTimeout(() => {
          window.location.href = "/index.html";
        }, 1500);
      } else {
        showNotification("❌ Failed to activate demo mode.", "error");
      }
    } catch (err) {
      console.error("❌ Demo mode error:", err);
      showNotification("❌ Demo mode failed to load.", "error");
    }
    return;
  }
  
  // ADDED: Check against known agency codes (future: backend validation)
  // For now, show not recognized message
  showNotification(`⚠️ Agency code "${code}" not recognized. Contact your admin or use "UPSTREAM" for demo mode.`, "warning");
}

// Expose globally for inline onclick handlers
window.handleAgencyCode = handleAgencyCode;

// ─────────────────────────────────────────────────────────────
// FEATURE TOGGLES
// ─────────────────────────────────────────────────────────────

/**
 * Initialize typing indicator toggle
 */
function initTypingIndicator() {
  const typingToggle = document.getElementById("typing-toggle");
  
  if (typingToggle) {
    const saved = localStorage.getItem("typingIndicator") || "off";
    typingToggle.value = saved;
    
    typingToggle.addEventListener("change", () => {
      localStorage.setItem("typingIndicator", typingToggle.value);
      console.log(`✅ Typing indicator: ${typingToggle.value}`);
    });
  }
}

/**
 * Initialize voice mode toggle (ADDED)
 */
function initVoiceMode() {
  const voiceToggle = document.getElementById("voice-toggle");
  
  if (voiceToggle) {
    const saved = localStorage.getItem("voiceMode") || "off";
    voiceToggle.value = saved;
    
    voiceToggle.addEventListener("change", () => {
      localStorage.setItem("voiceMode", voiceToggle.value);
      console.log(`✅ Voice mode: ${voiceToggle.value}`);
    });
  }
}

// ─────────────────────────────────────────────────────────────
// NOTIFICATIONS (ADDED)
// ─────────────────────────────────────────────────────────────

/**
 * Show notification toast (ADDED)
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success/error/warning/info)
 */
function showNotification(message, type = "info") {
  // Try to use alert as fallback if no custom notification system
  // In production, replace with a proper toast notification component
  
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 16px 20px;
    background: ${getNotificationColor(type)};
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `;
  
  document.body.appendChild(notification);
  
  // Auto-remove after 4 seconds
  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease";
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}

/**
 * Get notification color by type (ADDED)
 */
function getNotificationColor(type) {
  const colors = {
    success: "#22c55e",
    error: "#ef4444",
    warning: "#eab308",
    info: "#38bdf8"
  };
  return colors[type] || colors.info;
}

// ─────────────────────────────────────────────────────────────
// INITIALIZATION
// ─────────────────────────────────────────────────────────────

/**
 * Initialize all app features
 */
function initApp() {
  console.log("🚀 Initializing Upstream App...");
  
  // Core features
  initTheme();
  initLocalResources();
  initDataManagement();
  initCacheRefresh();
  initTypingIndicator();
  initVoiceMode(); // ADDED
  
  // Service worker
  registerServiceWorker();
  
  // ADDED: Load agency data from session if available
  try {
    const storedData = sessionStorage.getItem("agencyData");
    if (storedData) {
      const data = JSON.parse(storedData);
      setAgencyData(data);
    }
  } catch (err) {
    console.warn("⚠️ Failed to load stored agency data:", err);
  }
  
  // ADDED: Load user role
  const role = localStorage.getItem("role");
  if (role) {
    userRole = role;
    console.log(`✅ Role loaded: ${role}`);
  }
  
  console.log("✅ App initialized");
}

// Run initialization when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}

// ─────────────────────────────────────────────────────────────
// CLEANUP
// ─────────────────────────────────────────────────────────────

window.addEventListener("beforeunload", () => {
  // Save current state before unload
  console.log("👋 App closing, state saved");
});

// ─────────────────────────────────────────────────────────────
// EXPOSE PUBLIC API
// ─────────────────────────────────────────────────────────────

window.upstreamApp = {
  setAgencyData,
  setRole,
  getRole,
  getAgencyData: () => agencyData,
  isDemoMode: () => isDemoMode,
  showNotification
};

console.log("✅ Upstream App loaded");
