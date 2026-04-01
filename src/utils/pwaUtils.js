import { getPublicAssetPath } from './assets';

let deferredPrompt = null;
const installPromptListeners = new Set();

const notifyInstallPromptListeners = () => {
  const available = Boolean(deferredPrompt);
  installPromptListeners.forEach((listener) => listener(available));
};

export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swPath = getPublicAssetPath('/sw/sw.js');
      navigator.serviceWorker
        .register(swPath)
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
    console.log('Este browser nao suporta notificacoes');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

export const sendLocalNotification = (title, options = {}) => {
  if (Notification.permission === 'granted') {
    const iconPath = getPublicAssetPath('/icon-192.png');
    new Notification(title, {
      body: options.body || 'Nova notificacao do Faltai',
      icon: iconPath,
      badge: iconPath,
      ...options
    });
  }
};

export const scheduleReminderNotification = (materia, minutosAntes = 60) => {
  const proximasAvaliacoes =
    materia.avaliacoes?.filter((avaliacao) => {
      const dataAvaliacao = new Date(avaliacao.data);
      const agora = new Date();
      return dataAvaliacao > agora;
    }) || [];

  proximasAvaliacoes.forEach((avaliacao) => {
    const dataAvaliacao = new Date(avaliacao.data);
    const reminderTime = dataAvaliacao.getTime() - minutosAntes * 60 * 1000;
    const now = Date.now();

    if (reminderTime > now) {
      setTimeout(() => {
        sendLocalNotification(`${avaliacao.tipo} em ${minutosAntes} minutos`, {
          body: `${materia.nome} - ${avaliacao.descricao || avaliacao.tipo}`,
          tag: `reminder-${avaliacao.id}`,
          requireInteraction: true
        });
      }, reminderTime - now);
    }
  });
};

export const isStandaloneMode = () => {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone ||
    document.referrer.includes('android-app://')
  );
};

export const canInstallPWA = () => {
  return !isStandaloneMode() && 'serviceWorker' in navigator && Boolean(deferredPrompt);
};

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    notifyInstallPromptListeners();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    notifyInstallPromptListeners();
  });
}

export const onInstallPromptChange = (callback) => {
  installPromptListeners.add(callback);
  callback(Boolean(deferredPrompt));

  return () => {
    installPromptListeners.delete(callback);
  };
};

export const showInstallPrompt = async () => {
  if (!deferredPrompt) {
    return false;
  }

  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  notifyInstallPromptListeners();
  return outcome === 'accepted';
};

export const getNotificationPermissionState = () => {
  if (!('Notification' in window)) {
    return 'unsupported';
  }

  return Notification.permission;
};

export const updateAppBadge = async (count = 0) => {
  if (typeof navigator === 'undefined') {
    return false;
  }

  try {
    if (count > 0 && 'setAppBadge' in navigator) {
      await navigator.setAppBadge(count);
      return true;
    }

    if ('clearAppBadge' in navigator) {
      await navigator.clearAppBadge();
      return true;
    }
  } catch (error) {
    console.warn('Nao foi possivel atualizar o badge do app:', error);
  }

  return false;
};

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

export const scheduleBackgroundSync = (tag) => {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    navigator.serviceWorker.ready
      .then((registration) => registration.sync.register(tag))
      .catch((error) => {
        console.error('Erro ao agendar sincronizacao:', error);
      });
  }
};

export const isOnline = () => navigator.onLine;

export const onConnectionChange = (callback) => {
  window.addEventListener('online', () => callback(true));
  window.addEventListener('offline', () => callback(false));
};
