const CACHE_NAME = "luciddreams-cache-v2";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./login.html",
  "./register.html",
  "./check-email.html",
  "./forgot-password.html",
  "./reset-password.html",
  "./dashboard.html",
  "./profile.html",
  "./dream-journal.html",
  "./dream-archive.html",
  "./reality-check.html",
  "./course.html",

  "./css/stylesheet.css",
  "./css/dashboard.css",
  "./css/profile.css",
  "./css/dream-journal.css",
  "./css/dream-archive.css",
  "./css/reality-checks.css",
  "./css/course.css",

  "./js/supabase-client.js",
  "./js/auth-guard.js",
  "./js/login.js",
  "./js/register.js",
  "./js/check-email.js",
  "./js/dashboard.js",
  "./js/profile.js",
  "./js/dream-journal.js",
  "./js/dream-archive.js",
  "./js/reality-check.js",
  "./js/course.js",
  "./js/local-db.js",
  "./js/pwa-register.js",

  "./img/logo.png",
  "./img/icon-192.png",
  "./img/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          return cachedResponse || caches.match("./index.html");
        });
      })
  );
});