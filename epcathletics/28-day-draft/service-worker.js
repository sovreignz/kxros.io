const CACHE = "epc-28-day-strong-v5";
const SHELL = [
  "./", "./index.html", "./styles.css?v=5", "./data.js?v=5", "./app.js?v=5",
  "./manifest.webmanifest?v=5", "./assets/epc-logo.png", "./assets/emma-hero.jpg",
  "./assets/emma-lower.jpg", "./assets/emma-full-body.jpg",
  "./icons/icon-192.png", "./icons/icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => event.waitUntil(
  caches.keys()
    .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
    .then(() => self.clients.claim())
));

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== location.origin) return;
  const url = new URL(event.request.url);
  const isProgramCode = /\.(?:js|css|webmanifest)$/.test(url.pathname);

  if (event.request.mode === "navigate" || isProgramCode) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request).then(hit => hit || caches.match("./index.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(hit => hit || fetch(event.request).then(response => {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(event.request, copy));
      return response;
    }))
  );
});
