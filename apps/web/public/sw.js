const CACHE_NAME = 'factumation-static-v2';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_URL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('factumation-static-') && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'CLEAR_USER_DATA') {
    event.waitUntil(
      caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))),
    );
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag !== 'factumation-document-outbox') return;
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) =>
        Promise.all(clients.map((client) => client.postMessage({ type: 'SYNC_OUTBOX' }))),
      ),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const sensitive =
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth/') ||
    /\/(invoices|quotes|clients|companies|dashboard|settings)(?:\/|$)/.test(url.pathname) ||
    request.headers.has('authorization');
  if (sensitive) {
    if (request.mode === 'navigate') {
      const uncachedRequest = new Request(request, { cache: 'no-store' });
      event.respondWith(fetch(uncachedRequest).catch(() => caches.match(OFFLINE_URL)));
    }
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok && !response.headers.has('set-cookie')) {
          await cache.put(request, response.clone());
        }
        return response;
      }),
    );
  }
});
