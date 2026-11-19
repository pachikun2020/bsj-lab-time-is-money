const CACHE_PREFIX = 'meryds-meeting-meter-';
const CACHE = `${CACHE_PREFIX}v23`;
const ASSETS = ['./', './index.html', './app.js', './countries.js', './i18n.js', './manifest.webmanifest', './manifest.en.webmanifest', './manifest.zh.webmanifest', './icon-192-yen.png', './icon-512-yen.png', './meeting-room-hero.webp'];
const SCOPE = new URL(self.registration.scope);
const ASSET_URLS = new Set(ASSETS.map(path => new URL(path, SCOPE).href));

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS.map(path => new Request(new URL(path, SCOPE).href, {cache: 'reload'})))));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE).map(key => caches.delete(key)))));
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== SCOPE.origin || !url.pathname.startsWith(SCOPE.pathname)) return;
  const navigation = event.request.mode === 'navigate' && (url.pathname === SCOPE.pathname || url.pathname === new URL('./index.html', SCOPE).pathname);
  const canonical = navigation ? new URL('./index.html', SCOPE).href : url.href;
  if (!ASSET_URLS.has(canonical)) return;
  event.respondWith(caches.open(CACHE).then(async cache => {
    // Precache is one release snapshot. Never refresh individual assets in place.
    const response = (await cache.match(canonical)) || await fetch(event.request);
    // Hosts may redirect /index.html to /. Navigation responses must not carry
    // the redirected flag of the precache fetch.
    return navigation && response.redirected ? new Response(response.body, {status: response.status, statusText: response.statusText, headers: response.headers}) : response;
  }));
});
