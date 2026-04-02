const CACHE_NAME = 'faltai-runtime-v4';
const SAME_ORIGIN_DESTINATIONS = new Set(['document', 'script', 'style', 'image', 'font']);

const resolveAssetUrl = (relativePath) => new URL(relativePath, self.registration.scope).toString();

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName))
        )
      )
    ])
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const requestUrl = new URL(request.url);

  if (request.method !== 'GET' || requestUrl.origin !== self.location.origin) {
    return;
  }

  if (requestUrl.pathname.includes('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  if (!SAME_ORIGIN_DESTINATIONS.has(request.destination) && request.mode !== 'navigate') {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(request);

      try {
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
          cache.put(request, networkResponse.clone());
        }

        return networkResponse;
      } catch (error) {
        if (cachedResponse) {
          return cachedResponse;
        }

        if (request.mode === 'navigate') {
          const cachedRoot = await cache.match(resolveAssetUrl('../'));
          if (cachedRoot) {
            return cachedRoot;
          }
        }

        throw error;
      }
    })
  );
});

self.addEventListener('push', (event) => {
  let data = {};

  if (event.data) {
    try {
      data = event.data.json();
    } catch (error) {
      data = { title: 'Faltai', body: event.data.text() };
    }
  }

  const options = {
    body: data.body || 'Nova notificacao do Faltai',
    icon: resolveAssetUrl('../icon-192-v2.png'),
    badge: resolveAssetUrl('../icon-192-v2.png'),
    vibrate: [200, 100, 200],
    requireInteraction: true,
    tag: data.tag || 'faltai-notification',
    data: {
      dateOfArrival: Date.now(),
      url: data.url || self.registration.scope,
      ...data
    },
    actions: [
      {
        action: 'open',
        title: 'Abrir app'
      },
      {
        action: 'close',
        title: 'Dispensar'
      }
    ]
  };

  event.waitUntil(self.registration.showNotification(data.title || 'Faltai', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const targetUrl = event.notification.data?.url || self.registration.scope;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.startsWith(self.registration.scope) && 'focus' in client) {
          client.navigate?.(targetUrl);
          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }

      return null;
    })
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-materias') {
    event.waitUntil(Promise.resolve());
  }
});
