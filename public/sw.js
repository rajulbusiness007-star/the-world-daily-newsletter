/**
 * Service Worker for THE WORLD DAILY
 * Implements offline caching for the Daily Edition and app shell.
 */

const CACHE_VERSION = 'twd-v1';
const SHELL_CACHE = `twd-shell-${CACHE_VERSION}`;
const EDITION_CACHE = `twd-edition-${CACHE_VERSION}`;

const SHELL_ASSETS = [
  '/',
  '/index.html'
];

// Install: precache app shell and activate immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => {
      return cache.addAll(SHELL_ASSETS).catch((err) => {
        console.warn('[SW] Precache failed, continuing anyway:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches and take control of all clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== SHELL_CACHE && key !== EDITION_CACHE) {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Strategy dispatch
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Daily Edition endpoints: Network-first with cache fallback
  if (url.pathname.startsWith('/api/newsletter/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // If response is valid, clone and save to EDITION_CACHE
          if (response && response.status === 200) {
            const resClone = response.clone();
            caches.open(EDITION_CACHE).then((cache) => {
              cache.put(event.request, resClone);
              // Also store under a canonical key for fallback
              if (url.pathname === '/api/newsletter/today') {
                cache.put('/api/newsletter/latest', response.clone());
              }
            });
          }
          return response;
        })
        .catch(async () => {
          // Network failed: attempt to retrieve from cache
          console.log('[SW] Network failed for newsletter endpoint. Serving cached edition for:', url.pathname);
          const cached = await caches.match(event.request);
          if (cached) {
            return cached;
          }
          // Fallback to latest available edition if requested specific date fails or 'today'
          const latestCached = await caches.match('/api/newsletter/latest');
          if (latestCached) {
            return latestCached;
          }
          // Fallback to match any cached newsletter response
          const editionCache = await caches.open(EDITION_CACHE);
          const requests = await editionCache.keys();
          for (const req of requests) {
            if (req.url.includes('/api/newsletter/')) {
              const match = await editionCache.match(req);
              if (match) return match;
            }
          }
          return new Response(JSON.stringify({ 
            error: 'Offline: No cached Daily Edition available yet. Connect to the internet once to download today\'s edition.' 
          }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  // 2. News feed and sources endpoints: Network-first with cache fallback
  if (url.pathname.startsWith('/api/news') || url.pathname.startsWith('/api/sources')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const resClone = response.clone();
            caches.open(EDITION_CACHE).then((cache) => {
              cache.put(event.request, resClone);
            });
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) return cached;
          return new Response(JSON.stringify({ articles: [], sources: [], offline: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  // 3. Navigation requests (HTML): Network first, fallback to cached /index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cachedShell = await caches.match('/index.html');
        return cachedShell || caches.match('/');
      })
    );
    return;
  }

  // 4. Static assets (JS, CSS, fonts, images)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached and update in background if online (Stale-While-Revalidate)
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(SHELL_CACHE).then((cache) => cache.put(event.request, networkResponse));
            }
          })
          .catch(() => {});
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && (event.request.url.includes('.js') || event.request.url.includes('.css') || event.request.url.includes('/assets/'))) {
          const resClone = networkResponse.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(event.request, resClone));
        }
        return networkResponse;
      });
    })
  );
});

// Handle custom message commands from the window client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_EDITION_PAYLOAD' && event.data.payload) {
    // Explicitly cache edition data sent from client
    caches.open(EDITION_CACHE).then((cache) => {
      const jsonResponse = new Response(JSON.stringify(event.data.payload), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'X-TWD-Offline-Cached': 'true' }
      });
      cache.put('/api/newsletter/today', jsonResponse.clone());
      cache.put('/api/newsletter/latest', jsonResponse.clone());
      if (event.data.payload.date) {
        cache.put(`/api/newsletter/${event.data.payload.date}`, jsonResponse);
      }
    });
  }

  // Handle client-triggered notification via ServiceWorkerRegistration
  if (event.data && event.data.type === 'TRIGGER_NOTIFICATION') {
    const { title, options } = event.data;
    if (self.registration && self.registration.showNotification) {
      self.registration.showNotification(title || 'THE WORLD DAILY', options || {});
    }
  }
});

// Handle notification click to bring app to focus and open newsletter
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.postMessage({ 
            type: 'NAVIGATE_TO_VIEW', 
            view: 'newsletter',
            notificationData: event.notification.data 
          });
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Handle incoming Web Push events if configured
self.addEventListener('push', (event) => {
  let data = {
    title: 'THE WORLD DAILY — Morning Briefing Ready',
    body: "Today's 06:30 AM IST edition is now available with verified reports from Indian Express, BBC News, CNN & Reuters.",
    url: '/'
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/assets/icon-192.png',
    badge: '/assets/icon-192.png',
    data: { url: data.url || '/' },
    tag: 'twd-daily-edition',
    renotify: true,
    vibrate: [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

