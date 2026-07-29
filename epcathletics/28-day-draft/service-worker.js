const CACHE = "epc-28-day-strong-v3";
const SHELL = [
  "./", "./index.html", "./styles.css", "./data.js", "./app.js",
  "./manifest.webmanifest", "./assets/epc-logo.png", "./assets/emma-hero.jpg",
  "./assets/emma-lower.jpg", "./assets/emma-full-body.jpg",
  "./icons/icon-192.png", "./icons/icon-512.png"
];

self.addEventListener("install", event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL))));
self.addEventListener("activate", event => event.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
));
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== location.origin) return;
  event.respondWith(caches.match(event.request).then(hit => hit || fetch(event.request).then(response => {
    const copy = response.clone();
    caches.open(CACHE).then(cache => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match("./index.html"))));
});
