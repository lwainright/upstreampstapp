/* --------------------------------------------------
   Upstream Service Worker
   Simple offline caching for GitHub Pages
-------------------------------------------------- */

const CACHE_NAME = "upstream-cache-v1";

const FILES_TO_CACHE = [
  "/upstreampstapp/",
  "/upstreampstapp/index.html",
  "/upstreampstapp/support.html",
  "/upstreampstapp/tools.html",
  "/upstreampstapp/resources.html",
  "/upstreampstapp/settings.html",
  "/upstreampstapp/offline.html",

  "/upstreampstapp/style.css",
  "/upstreampstapp/app.js",
  "/upstreampstapp/manifest.json",

  // Icons (add more if you have them)
  "/upstreampstapp/icons/icon-192.png",
  "/upstreampstapp/icons/icon-512.png"
];

/* --------------------------------------------------
   Install: Cache core files
-------------------------------------------------- */
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE);
    })
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
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

/* --------------------------------------------------
   Fetch: Serve cached files, fallback to offline
-------------------------------------------------- */
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // Serve from cache if available
      if (response) return response;

      // Otherwise fetch from network
      return fetch(event.request).catch(() => {
        // If offline, show offline page for navigation requests
        if (event.request.mode === "navigate") {
          return caches.match("/upstreampstapp/offline.html");
        }
      });
    })
  );
});
