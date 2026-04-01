import { getApiBaseUrl, getBaseUrl } from '../../../lib/env';

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
};

const getBaseAppUrl = () => {
  const baseUrl = getBaseUrl().replace(/\/$/, '');
  return `${window.location.origin}${baseUrl}`;
};

export const isPushSupported = () => {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
};

export const getPushPublicKey = async () => {
  const response = await fetch(`${getApiBaseUrl()}/api/push/public-key`);

  if (!response.ok) {
    throw new Error('Nao foi possivel carregar a chave publica de push.');
  }

  const data = await response.json();
  return data.publicKey;
};

export const getOrCreatePushSubscription = async () => {
  if (!isPushSupported()) {
    return null;
  }

  const registration = await navigator.serviceWorker.ready;
  const existingSubscription = await registration.pushManager.getSubscription();

  if (existingSubscription) {
    return existingSubscription;
  }

  const publicKey = await getPushPublicKey();

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey)
  });
};

export const syncPushSubscription = async ({ settings, metadata = {} }) => {
  const subscription = await getOrCreatePushSubscription();

  if (!subscription) {
    return null;
  }

  await fetch(`${getApiBaseUrl()}/api/push/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      subscription,
      settings,
      metadata: {
        baseUrl: getBaseAppUrl(),
        ...metadata
      }
    })
  });

  return subscription;
};

export const updatePushSettings = async ({ settings, metadata = {} }) => {
  const subscription = await getOrCreatePushSubscription();

  if (!subscription) {
    return null;
  }

  await fetch(`${getApiBaseUrl()}/api/push/settings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      subscription,
      settings,
      metadata: {
        baseUrl: getBaseAppUrl(),
        ...metadata
      }
    })
  });

  return subscription;
};

export const unsubscribePush = async () => {
  if (!isPushSupported()) {
    return;
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    return;
  }

  await fetch(`${getApiBaseUrl()}/api/push/unsubscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ subscription })
  });

  await subscription.unsubscribe();
};

export const sendPushTest = async () => {
  const subscription = await getOrCreatePushSubscription();

  if (!subscription) {
    throw new Error('Push nao suportado neste dispositivo.');
  }

  const response = await fetch(`${getApiBaseUrl()}/api/push/test`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      subscription,
      metadata: {
        baseUrl: getBaseAppUrl()
      }
    })
  });

  if (!response.ok) {
    throw new Error('Nao foi possivel enviar o push de teste.');
  }
};
