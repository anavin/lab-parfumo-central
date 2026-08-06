/* Lab Parfumo service worker — installable PWA + offline app shell.
   Deliberately conservative: only hashed static assets and icons are cached
   (cache-first, never stale-wrong); navigations are network-first with a
   friendly offline fallback. Dynamic data / API / RSC are never cached, so no
   stale auth or figures. Bump VERSION to roll the cache. */
const VERSION = "v1";
const CACHE = "lp-static-" + VERSION;
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      try { await cache.add(OFFLINE_URL); } catch (e) {}
      self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith("lp-static-") && k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // hashed static assets + icons → cache-first (safe: content-addressed)
  const isStatic = url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icon-") || url.pathname === "/apple-touch-icon.png" ||
    url.pathname.startsWith("/fonts/");
  if (isStatic) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      })()
    );
    return;
  }

  // page navigations → network-first, fall back to the offline page when down
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          return await fetch(req);
        } catch (e) {
          const cache = await caches.open(CACHE);
          const offline = await cache.match(OFFLINE_URL);
          return offline || new Response("ออฟไลน์", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
        }
      })()
    );
  }
  // everything else (API, _rsc, data) → default network handling
});
