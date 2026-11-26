// Offline support. Pages are fetched from the network first so updates show up
// right away, with the cached copy as a fallback when offline. Build assets under
// _next/static have hashed names, so they are served from the cache.
const CACHE = "ejust-gpa-v1";
const SCOPE = new URL(self.registration.scope).pathname;
const PAGES = ["", "plan/", "tools/", "settings/", "semester/"].map((p) => SCOPE + p);

// Cache every page, its client-navigation payload (index.txt) and the scripts and
// styles it loads, so pages never opened online still work offline.
async function precache() {
  const cache = await caches.open(CACHE);
  const assets = new Set();
  await Promise.all(
    PAGES.map(async (page) => {
      const res = await fetch(page, { cache: "no-cache" });
      if (!res.ok) return;
      const html = await res.clone().text();
      await cache.put(page, res);
      for (const m of html.matchAll(/(?:src|href)="([^"]*\/_next\/static\/[^"]+)"/g)) assets.add(m[1]);
      const txt = await fetch(page + "index.txt", { cache: "no-cache" }).catch(() => null);
      if (txt && txt.ok) await cache.put(page + "index.txt", txt);
    }),
  );
  await Promise.all([...assets].map((a) => cache.add(a).catch(() => {})));
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    precache()
      .catch(() => {})
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return;

  if (url.pathname.includes("/_next/static/")) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy));
            }
            return res;
          }),
      ),
    );
    return;
  }

  // Query strings (?id=..., ?_rsc=...) don't change these static files, so store
  // one copy per path.
  const key = url.origin + url.pathname;
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(key, copy));
        }
        return res;
      })
      .catch(() =>
        caches
          .match(req, { ignoreSearch: true })
          .then((hit) => hit || (req.mode === "navigate" ? caches.match(SCOPE) : undefined))
          .then((hit) => hit || Response.error()),
      ),
  );
});
