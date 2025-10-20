const CACHE_NAME = 'faltai-v1.0.0';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - retorna resposta do cache
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Atualizar Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Removendo cache antigo', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Notificações Push
self.addEventListener('push', (event) => {
  let data = {};
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Faltaí', body: event.data.text() };
    }
  }
  
  const options = {
    body: data.body || 'Nova notificação do Faltaí',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    requireInteraction: true,
    tag: data.tag || 'faltai-notification',
    data: {
      dateOfArrival: Date.now(),
      url: data.url || '/',
      ...data
    },
    actions: [
      {
        action: 'open',
        title: 'Abrir App',
        icon: '/icon-192.png'
      },
      {
        action: 'close',
        title: 'Dispensar',
        icon: '/icon-192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Faltaí', options)
  );
});

// Click em notificação
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open' || event.action === 'explore' || !event.action) {
    // Abrir a aplicação
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clientList) => {
        // Se já há uma janela aberta, foca nela
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        // Caso contrário, abre uma nova janela
        if (self.clients.openWindow) {
          return self.clients.openWindow('/');
        }
      })
    );
  }
});

// Background Sync para sincronização offline
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-materias') {
    event.waitUntil(syncMaterias());
  }
});

async function syncMaterias() {
  try {
    // Lógica para sincronizar dados quando voltar online
    const offlineData = await getOfflineData();
    if (offlineData) {
      await sendDataToServer(offlineData);
      await clearOfflineData();
    }
  } catch (error) {
    console.error('Erro na sincronização:', error);
  }
}

async function getOfflineData() {
  // Implementar lógica para pegar dados offline
  return null;
}

async function sendDataToServer(data) {
  // Implementar envio para servidor
  return null;
}

async function clearOfflineData() {
  // Limpar dados offline após sincronização
  return null;
}