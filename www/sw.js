/* ==========================================
   PackCheck — Service Worker (sw.js)
   Cache strategy: cache-first
   Cache name: packcheck-v1
   ========================================== */

const CACHE_NAME = 'packcheck-v1';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  // Google Fonts stylesheets
  'https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700;800&family=Nunito:wght@400;500;600;700&display=swap',
  // Google Fonts preconnect origins (font files are cached dynamically on first fetch)
  'https://fonts.gstatic.com'
];

// ---- Install: pre-cache all known assets ----
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cache same-origin assets reliably; cross-origin fonts use no-cors
      const sameOriginUrls = PRECACHE_URLS.filter(url => !url.startsWith('https://fonts.'));
      const fontUrls = PRECACHE_URLS.filter(url => url.startsWith('https://fonts.'));

      const sameOriginRequests = sameOriginUrls.map(url => cache.add(url).catch(() => {
        console.warn('[PackCheck SW] Failed to pre-cache:', url);
      }));

      const fontRequests = fontUrls.map(url =>
        fetch(new Request(url, { mode: 'no-cors' }))
          .then(response => cache.put(url, response))
          .catch(() => console.warn('[PackCheck SW] Failed to pre-cache font:', url))
      );

      return Promise.all([...sameOriginRequests, ...fontRequests]);
    }).then(() => self.skipWaiting())
  );
});

// ---- Activate: clean up old caches ----
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log('[PackCheck SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// ---- Fetch: cache-first strategy ----
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Serve from cache; refresh cache in background for same-origin assets
        if (event.request.url.startsWith(self.location.origin)) {
          fetch(event.request)
            .then(networkResponse => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse.clone()));
              }
            })
            .catch(() => { /* offline — that's fine */ });
        }
        return cachedResponse;
      }

      // Not in cache — fetch from network and cache for next time
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Offline fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
