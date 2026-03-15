import { useDemoMode } from "./hooks/useDemoMode.js"
/* --------------------------------------------------
   Theme Handling
-------------------------------------------------- */

// Load saved theme or default to system
const savedTheme = localStorage.getItem("theme");

if (savedTheme) {
  document.documentElement.setAttribute("data-theme", savedTheme);
}

// Theme selector (if present on page)
const themeSelect = document.getElementById("theme-select");

if (themeSelect) {
  themeSelect.value = savedTheme || "system";

  themeSelect.addEventListener("change", () => {
    const value = themeSelect.value;

    if (value === "system") {
      document.documentElement.removeAttribute("data-theme");
      localStorage.removeItem("theme");
    } else {
      document.documentElement.setAttribute("data-theme", value);
      localStorage.setItem("theme", value);
    }
  });
}

/* --------------------------------------------------
   Local Resources (Settings Page)
-------------------------------------------------- */

const resourcesBox = document.getElementById("local-resources");
const saveResourcesBtn = document.getElementById("save-resources");

// Load saved resources
if (resourcesBox) {
  const saved = localStorage.getItem("localResources");
  if (saved) resourcesBox.value = saved;
}

// Save resources
if (saveResourcesBtn) {
  saveResourcesBtn.addEventListener("click", () => {
    localStorage.setItem("localResources", resourcesBox.value);
    alert("Local resources saved on this device.");
  });
}

/* --------------------------------------------------
   Clear Local Data
-------------------------------------------------- */

const clearDataBtn = document.getElementById("clear-data");

if (clearDataBtn) {
  clearDataBtn.addEventListener("click", () => {
    if (confirm("Clear all saved data on this device?")) {
      localStorage.clear();
      alert("All local data cleared.");
      location.reload();
    }
  });
}

/* --------------------------------------------------
   Refresh Offline Files (Service Worker Update)
-------------------------------------------------- */

const refreshCacheBtn = document.getElementById("refresh-cache");

if (refreshCacheBtn) {
  refreshCacheBtn.addEventListener("click", () => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg) {
          reg.update();
          alert("Offline files refreshed.");
        } else {
          alert("Service worker not found.");
        }
      });
    }
  });
}

/* --------------------------------------------------
   Register Service Worker
-------------------------------------------------- */

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/upstreampstapp/service-worker.js");
  });
}
/* --------------------------------------------------
   Demo Mode Data Storage
-------------------------------------------------- */

let agencyData = {
  pst: [],
  cit: null,
  resources: []
};

function setAgencyData(data) {
  agencyData = data;
  console.log("Demo data loaded:", agencyData);
}

/* --------------------------------------------------
   Demo Mode Activation
-------------------------------------------------- */

async function activateDemoMode() {
  try {
    const pst = await fetch("demo/pst.json").then(r => r.json());
    const cit = await fetch("demo/cit.json").then(r => r.json());
    const resources = await fetch("demo/resources.json").then(r => r.json());

    setAgencyData({ pst, cit, resources });

    // Mark the app as running in demo mode
    localStorage.setItem("role", "demo");

    alert("Demo mode activated.");
  } catch (err) {
    console.error("Demo mode failed:", err);
  }
}

/* --------------------------------------------------
   Agency Code Handler (Call This Where Needed)
-------------------------------------------------- */

function handleAgencyCode(agencyCode) {
  // Demo mode trigger
  if (agencyCode === "UPSTREAM") {
    activateDemoMode();
    return;
  }

  // Add real agency logic here later
  alert("Agency code not recognized yet.");
}
const typingToggle = document.getElementById("typing-toggle");

if (typingToggle) {
  const saved = localStorage.getItem("typingIndicator") || "off";
  typingToggle.value = saved;

  typingToggle.addEventListener("change", () => {
    localStorage.setItem("typingIndicator", typingToggle.value);
     let typingEnabled = (localStorage.getItem("typingIndicator") === "on");

  });
}

