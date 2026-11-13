const CACHE_PREFIX = 'meryds-meeting-meter-';
const CACHE = `${CACHE_PREFIX}v04`;
const ASSETS = ['./', './index.html', './app.js', './manifest.webmanifest', './icon-192-yen.png', './icon-512-yen.png', './meeting-room-hero.webp'];
const SCOPE = new URL(self.registration.scope);
const ASSET_URLS = new Set(ASSETS.map(path => new URL(path, SCOPE).href));

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE).map(key => caches.delete(key)))),
    self.clients.claim()
  ]));
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== SCOPE.origin || !url.pathname.startsWith(SCOPE.pathname)) return;
  if (!ASSET_URLS.has(url.href)) return;
  event.respondWith(caches.open(CACHE).then(async cache => {
    if (event.request.mode === 'navigate') {
      try {
        const response = await fetch(event.request);
        if (response.ok) event.waitUntil(cache.put(event.request, response.clone()));
        return response;
      } catch {
        return (await cache.match(event.request)) || (await cache.match('./index.html'));
      }
    }
    return (await cache.match(event.request)) || fetch(event.request);
  }));
});
