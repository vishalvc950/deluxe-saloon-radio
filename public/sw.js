/* Deluxe Saloon service worker — free, no dependencies.
   Strategy: precache shell; navigations network-first → cached entry;
   icons+manifest network-first; other same-origin GETs cache-first.
   All URLs are relative to the SW scope, so it works from any sub-path. */
const CACHE = "deluxe-saloon-v2";
const SHELL = ["./", "index.html", "manifest.json", "themes.json", "img/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // let YouTube/fonts pass through

  const isNav = req.mode === "navigate";
  const isShellAsset = /\/(manifest\.json|img\/.*)$/.test(url.pathname);

  if (isNav) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() =>
          caches.match("index.html").then((r) => r || caches.match("./"))
        )
    );
    return;
  }

  if (isShellAsset) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // everything else same-origin: cache-first
  e.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
    )
  );
});
