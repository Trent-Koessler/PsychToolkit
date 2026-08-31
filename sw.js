// Bump APP_VERSION on every release. The cache name is derived from it, so a new
// release evicts the previous cache. This app ships clinical content (doses,
// thresholds, monitoring advice), so a stale cached copy is a safety problem —
// see the fetch strategy below.
const APP_VERSION = "1.3.0";
const CACHE_NAME = `psychtoolkit-cache-v${APP_VERSION}`;

// The app shell. Kept in sync with the assets index.html actually references.
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./mha-data.js",
  "./mha.js",
  "./mha-ui.js",
  "./vendor/chart.umd.js",
  "./manifest.json",
  "./icons/icon-192x192.png",
  "./icons/icon-512x512.png"
];

// Content that must never be served stale: HTML, CSS and JS carry the clinical
// logic and copy. Icons and images are safe to serve cache-first.
function isAppShell(request) {
  if (request.mode === "navigate") return true;
  const dest = request.destination;
  return dest === "document" || dest === "script" || dest === "style";
}

// Install Event
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate Event — drop every cache that is not the current version.
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Only cache successful, same-origin GET responses.
function isCacheable(request, response) {
  return (
    request.method === "GET" &&
    response &&
    response.status === 200 &&
    response.type === "basic"
  );
}

// Network-first for the app shell so an online clinician always gets the current
// clinical content, falling back to cache when offline. Cache-first for
// everything else (icons, fonts) where staleness is harmless.
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const networkResponse = await fetch(request);
    if (isCacheable(request, networkResponse)) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (request.mode === "navigate") {
      const shell = await cache.match("./index.html");
      if (shell) return shell;
    }
    throw err;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;

  const networkResponse = await fetch(request);
  if (isCacheable(request, networkResponse)) {
    cache.put(request, networkResponse.clone());
  }
  return networkResponse;
}

// Fetch Event
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;

  e.respondWith(
    isAppShell(e.request) ? networkFirst(e.request) : cacheFirst(e.request)
  );
});
