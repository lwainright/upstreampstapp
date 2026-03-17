// Upstream Service Worker
// Clean, stable, versioned, and GitHub Pages–friendly

const CACHE_VERSION = "v2"; 
const CACHE_NAME = `upstream-cache-${CACHE_VERSION}`;

const ASSETS = [
  "/upstreampstapp/",
  "/upstreampstapp/index.html",
  "/upstreampstapp/offline.html",
  "/upstreampstapp/style.css",
  "/upstreampstapp/app.js",
  "/upstreampstapp/anthropic.js",
  "/upstreampstapp/manifest.json",

  // Icons
  "/upstreampstapp/icons/icon-192.png",
  "/upstreampstapp/icons/icon-512.png",
  "/upstreampstapp/icons/maskable-192.png",
  "/upstreampstapp/icons/maskable-512.png",

  // Core pages
  "/upstreampstapp/support.html",
  "/upstreampstapp/tools.html",
  "/upstreampstapp/resources.html",
  "/upstreampstapp/settings.html",
  "/upstreampstapp/humanpst.html",
  "/upstreampstapp/ai.html",
  "/upstreampstapp/install.html",

  // Tools
  "/upstreampstapp/breathing/boxbreathing.html",
  "/upstreampstapp/breathing/478.html",
  "/upstreampstapp/breathing/shiftreset.html",
  "/upstreampstapp/grounding/54321.html",
  "/upstreampstapp/grounding/sensoryreset.html"
];

// Install: cache everything
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
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

// Fetch: network first, fallback to cache, then offline page
self.addEventListener("fetch", event => {
  const request = event.request;

  // Only handle GET requests
  if (request.method !== "GET") return;

  event.respondWith(
    fetch(request)
      .then(response => {
        // Cache the new version of the file
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        return response;
      })
      .catch(() =>
        caches.match(request).then(cached => {
          if (cached) return cached;

          // Fallback for navigation requests
          if (request.mode === "navigate") {
            return caches.match("/upstreampstapp/offline.html");
          }
        })
      )
  );
});
