/* AgriWaste Nexus service worker.
 *
 * Deliberately conservative. Field connectivity is patchy, so the app
 * shell is cached and served offline, but nothing from /api is ever
 * cached: a stale listing price or a stale request status would be
 * worse than an honest error. */

const VERSION = 'awn-v1';
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './images/icon-192.png',
  './images/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION)
      .then(cache => cache.addAll(SHELL))
      .catch(() => { /* a missing shell file must not block install */ })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never cache the API, and never serve it from cache
  if (url.pathname.startsWith('/api/')) return;

  // Cross-origin (fonts, tiles) goes straight to the network
  if (url.origin !== self.location.origin) return;

  // A navigation falls back to the cached shell when the network is gone
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Everything else: cache first, then network, and remember what we fetched
  event.respondWith(
    caches.match(request).then(hit => hit || fetch(request).then(res => {
      if (res.ok && res.type === 'basic') {
        const copy = res.clone();
        caches.open(VERSION).then(cache => cache.put(request, copy));
      }
      return res;
    }).catch(() => hit))
  );
});
