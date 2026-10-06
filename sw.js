/*
 * Mahendra ERP — PWA service worker (web build only; the Android/iOS app does not use it).
 * Caches STATIC files only: the app shell (index.html, network-first so updates are picked up), the
 * hashed JS/CSS bundles (cache-first, they never change) and the icon/manifest. API responses
 * (/api/*), uploaded files and other sites are never cached or even touched.
 */
const VERSION = 'merp-static-v1';
const SCOPE = self.registration.scope; // e.g. https://erp.example.com/admin/
const SCOPE_PATH = new URL(SCOPE).pathname;
const SHELL = [SCOPE, `${SCOPE}manifest.webmanifest`, `${SCOPE}favicon.svg`];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).catch(() => undefined));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('merp-static-') && k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function cacheable(res) {
  return res && res.ok && res.status === 200 && res.type === 'basic';
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/files/')) return; // never cache data
  if (!url.pathname.startsWith(SCOPE_PATH)) return;

  if (req.mode === 'navigate') {
    // App shell: network first, cached shell when offline.
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (cacheable(res)) {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(SCOPE, copy));
          }
          return res;
        })
        .catch(() => caches.match(SCOPE).then((hit) => hit || Response.error())),
    );
    return;
  }

  if (url.pathname.startsWith(`${SCOPE_PATH}assets/`)) {
    // Hashed bundles: cache first.
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (cacheable(res)) {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy));
        }
        return res;
      })),
    );
    return;
  }

  if (SHELL.includes(url.href)) {
    // Icon and manifest: stale while revalidate.
    event.respondWith(
      caches.match(req).then((hit) => {
        const net = fetch(req).then((res) => {
          if (cacheable(res)) {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(req, copy));
          }
          return res;
        }).catch(() => hit);
        return hit || net;
      }),
    );
  }
});
