export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw/sw.js')
        .then((registration) => {
          console.log('Service Worker registrado com sucesso:', registration.scope);
        })
        .catch((error) => {
          console.log('Falha ao registrar Service Worker:', error);
        });
    });
  }
};

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('Este browser não suporta notificações');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

// Enviar notificação local
export const sendLocalNotification = (title, options = {}) => {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body: options.body || 'Nova notificação do Faltaí',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      ...options
    });
  }
};

// Agendar notificação de lembrete
export const scheduleReminderNotification = (materia, minutosAntes = 60) => {
  const proximasAvaliacoes = materia.avaliacoes?.filter(av => {
    const dataAv = new Date(av.data);
    const agora = new Date();
    return dataAv > agora;
  }) || [];

  proximasAvaliacoes.forEach(avaliacao => {
    const dataAv = new Date(avaliacao.data);
    const tempoLembrete = dataAv.getTime() - (minutosAntes * 60 * 1000);
    const agora = Date.now();

    if (tempoLembrete > agora) {
      setTimeout(() => {
        sendLocalNotification(
          `${avaliacao.tipo} em ${minutosAntes} minutos!`,
          {
            body: `${materia.nome} - ${avaliacao.descricao || avaliacao.tipo}`,
            tag: `reminder-${avaliacao.id}`,
            requireInteraction: true
          }
        );
      }, tempoLembrete - agora);
    }
  });
};

// Verificar se está no modo standalone (PWA instalado)
export const isStandaloneMode = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone ||
         document.referrer.includes('android-app://');
};

// Verificar se pode instalar PWA
export const canInstallPWA = () => {
  return !isStandaloneMode() && 'serviceWorker' in navigator;
};

// Mostrar prompt de instalação
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
});

export const showInstallPrompt = async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    return outcome === 'accepted';
  }
  return false;
};

// Gerenciar dados offline
export const saveOfflineData = (key, data) => {
  try {
    const offlineData = JSON.parse(localStorage.getItem('offlineData') || '{}');
    offlineData[key] = {
      data,
      timestamp: Date.now(),
      synced: false
    };
    localStorage.setItem('offlineData', JSON.stringify(offlineData));
  } catch (error) {
    console.error('Erro ao salvar dados offline:', error);
  }
};

export const getOfflineData = (key) => {
  try {
    const offlineData = JSON.parse(localStorage.getItem('offlineData') || '{}');
    return offlineData[key] || null;
  } catch (error) {
    console.error('Erro ao recuperar dados offline:', error);
    return null;
  }
};

export const markAsSynced = (key) => {
  try {
    const offlineData = JSON.parse(localStorage.getItem('offlineData') || '{}');
    if (offlineData[key]) {
      offlineData[key].synced = true;
      localStorage.setItem('offlineData', JSON.stringify(offlineData));
    }
  } catch (error) {
    console.error('Erro ao marcar como sincronizado:', error);
  }
};

// Background sync (quando voltar online)
export const scheduleBackgroundSync = (tag) => {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    navigator.serviceWorker.ready.then((registration) => {
      return registration.sync.register(tag);
    }).catch((error) => {
      console.error('Erro ao agendar sincronização:', error);
    });
  }
};

// Detectar status de conexão
export const isOnline = () => navigator.onLine;

export const onConnectionChange = (callback) => {
  window.addEventListener('online', () => callback(true));
  window.addEventListener('offline', () => callback(false));
};