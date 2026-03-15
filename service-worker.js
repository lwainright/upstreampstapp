/* --------------------------------------------------
   Upstream Service Worker
   Full offline caching for GitHub Pages
-------------------------------------------------- */

const CACHE_NAME = "upstream-cache-v2";

/* --------------------------------------------------
   Files to Cache
   (All core pages + tools + config + demo data)
-------------------------------------------------- */

const FILES_TO_CACHE = [
  // Core pages
  "/upstreampstapp/",
  "/upstreampstapp/index.html",
  "/upstreampstapp/support.html",
  "/upstreampstapp/tools.html",
  "/upstreampstapp/resources.html",
  "/upstreampstapp/settings.html",
  "/upstreampstapp/offline.html",

  // Breathing tools
  "/upstreampstapp/breathing/boxbreathing.html",
  "/upstreampstapp/breathing/478.html",
  "/upstreampstapp/breathing/shiftreset.html",

  // Grounding tools
  "/upstreampstapp/grounding/54321.html",
  "/upstreampstapp/grounding/sensoryreset.html",

  // Human PST
  "/upstreampstapp/humanpst.html",

  // AI page (cached for shell, not for API)
  "/upstreampstapp/ai.html",

  // Scripts
  "/upstreampstapp/app.js",
  "/upstreampstapp/anthropic.js",

  // Config + data
  "/upstreampstapp/config/agencyConfig.js",
  "/upstreampstapp/config/defaultAgencyConfig.js",
  "/upstreampstapp/config/systemPrompt.js",
  "/upstreampstapp/data/citModules.js",

  // Demo data
  "/upstreampstapp/demo/pst.json",
  "/upstreampstapp/demo/cit.json",
  "/upstreampstapp/demo/resources.json",

  // Styles + manifest
  "/upstreampstapp/style.css",
  "/upstreampstapp/manifest.json",

  // Icons
  "/upstreampstapp/icons/icon-192.png",
  "/upstreampstapp/icons/icon-512.png",

  // Screenshots (optional but recommended)
  "/upstreampstapp/screenshots/home.png",
  "/upstreampstapp/screenshots/desktop.png"
];

/* --------------------------------------------------
   Install: Cache core files
-------------------------------------------------- */
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

/* --------------------------------------------------
   Activate: Clean old caches
-------------------------------------------------- */
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

/* --------------------------------------------------
   Fetch: Cache-first, fallback to offline
-------------------------------------------------- */
self.addEventListener("fetch", event => {
  const request = event.request;

  // Never cache Anthropic API calls
  if (request.url.includes("anthropic")) {
    return;
  }

  event.respondWith(
    caches.match(request).then(response => {
      if (response) return response;

      return fetch(request).catch(() => {
        if (request.mode === "navigate") {
          return caches.match("/upstreampstapp/offline.html");
        }
      });
    })
  );
});
