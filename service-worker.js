const CACHE_NAME = "bloquinhos-cache-v1";

const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.json"
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

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(request)
        .then((networkResponse) => {
          const responseClone = networkResponse.clone();

          caches.open(CACHE_NAME).then((cache) => {
            if (request.url.startsWith(self.location.origin)) {
              cache.put(request, responseClone);
            }
          });

          return networkResponse;
        })
        .catch(async () => {
          if (request.mode === "navigate" || request.destination === "document") {
            return caches.match("/index.html");
          }
          return new Response("Offline", { status: 503, statusText: "Offline" });
        });
    })
  );
});
