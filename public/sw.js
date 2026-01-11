// Service Worker for JBRC - Auto Cache Busting
// Version changes on every build to force cache refresh

const VERSION = Date.now().toString(); // Unique version per build
const CACHE_NAME = `jbrc-cache-${VERSION}`;

// Minimal caching - prioritize fresh content
const urlsToCache = [
  '/manifest.json',
];

// Install event - clear ALL old caches and install new
self.addEventListener('install', (event) => {
  console.log('[SW] Installing new version:', VERSION);

  event.waitUntil(
    // Delete ALL existing caches first
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('[SW] Deleting old cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      // Open new cache
      return caches.open(CACHE_NAME);
    }).then((cache) => {
      console.log('[SW] Caching minimal assets');
      return Promise.allSettled(
        urlsToCache.map(url =>
          cache.add(url).catch(err => {
            console.log(`[SW] Failed to cache ${url}:`, err);
          })
        )
      );
    })
  );

  // Force immediate activation
  self.skipWaiting();
});

// Fetch event - NETWORK FIRST strategy (always get fresh content)
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    // Try network first
    fetch(event.request)
      .then((response) => {
        // Got fresh response from network
        if (response && response.status === 200) {
          // Clone and cache for offline fallback
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed, try cache as fallback
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Return a basic offline response for HTML pages
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return new Response(
              '<html><body><h1>Offline</h1><p>Please check your internet connection.</p></body></html>',
              { headers: { 'Content-Type': 'text/html' } }
            );
          }
        });
      })
  );
});

// Activate event - claim all clients immediately
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating new version:', VERSION);

  event.waitUntil(
    // Clean up any remaining old caches
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    }).then(() => {
      // Notify all clients to reload
      return self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'CACHE_UPDATED', version: VERSION });
        });
      });
    })
  );
});

// Listen for skip waiting message from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => {
      event.source.postMessage({ type: 'CACHE_CLEARED' });
    });
  }
});
