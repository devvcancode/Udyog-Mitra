const CACHE_NAME = 'udyog-mitra-public-v1';
const PRIVATE_PATHS = /^\/(?:api|(?:en|mr|hi)\/(?:apply|applications|dashboard|documents|grievance|notifications|officer|nodal|profile|admin|track|inspections|verify))(?:\/|$)/;

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith('udyog-mitra-') && key !== CACHE_NAME).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || PRIVATE_PATHS.test(url.pathname)) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const response = await fetch(request);
        if (response.ok && response.headers.get('content-type')?.includes('text/html')) await cache.put(request, response.clone());
        return response;
      } catch {
        const cached = await cache.match(request);
        if (cached) return cached;
        return new Response('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Udyog Mitra offline</title><body><main><h1>Offline</h1><p>Reconnect to continue. Previously visited public guidance may still be available.</p><a href="/en">Try again</a></main></body></html>', { headers: { 'content-type': 'text/html; charset=utf-8' } });
      }
    })());
    return;
  }

  if (url.pathname.startsWith('/_next/static/') || url.pathname === '/udyog-mitra-icon.svg') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone());
      return response;
    })());
  }
});