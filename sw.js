// Service Worker for CSC Professional: Exam Protocol
// Caches the app shell so the reviewer works fully offline after the first
// successful online visit. This file must be a real, separately-hosted
// file (not inlined) for offline caching to work reliably across reloads.

const CACHE_NAME = "csc-exam-protocol-v5";

// The HTML page itself gets cached reactively on first navigation below
// (so this works no matter what you name the HTML file), but everything
// it depends on — CSS, the app engine, every exam's question data, and
// the icon files (now external per PWABuilder's requirement, rather
// than inlined as base64 in manifest.json) — has a fixed, known path,
// so we precache all of it here. This means the app works offline in
// full (not just the shell) after the very first successful online
// visit, without waiting for each file to be requested individually.
const APP_SHELL = [
  "./manifest.json",
  "./styles.css",
  "./app.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-192-maskable.png",
  "./icons/icon-512-maskable.png",
  "./data/bank.js",
  "./data/final-exam.js",
  "./data/mock-1.js",
  "./data/mock-2.js",
  "./data/mock-3.js",
  "./data/mock-4.js",
  "./data/mock-5.js",
  "./data/mock-6.js",
  "./data/mock-7.js",
  "./data/mock-8.js",
  "./data/mock-9.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Navigation requests (loading the page itself): try the network first so
// you always get the latest version when online, and cache a copy of
// whatever page loads. When offline, fall back to that cached copy.
//
// Everything else (fonts, icons, etc.): cache-first, since those rarely
// change — falls back to network only if not already cached.
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => cache.put(request, copy))
            .catch(() => {});
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match("./"))
        )
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => cache.put(request, copy))
            .catch(() => {});
          return response;
        })
        .catch(() => cached);
    })
  );
});
