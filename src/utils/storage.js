export const storageKeys = {
  appNotifications: 'app_notifications',
  isOnline: 'isOnline',
  materias: 'materias',
  materiasSyncQueue: 'materias_sync_queue',
  notificationSettings: 'notification_settings',
  offlineData: 'offlineData',
  offlineUser: 'offlineUser',
  scheduledNotifications: 'scheduled_notifications',
  turmas: 'turmas'
};

export const getStorageValue = (key, fallbackValue = null) => {
  try {
    const storedValue = localStorage.getItem(key);

    if (storedValue === null) {
      return fallbackValue;
    }

    return JSON.parse(storedValue);
  } catch (error) {
    console.error(`Erro ao ler "${key}" do localStorage:`, error);
    return fallbackValue;
  }
};

export const setStorageValue = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Erro ao salvar "${key}" no localStorage:`, error);
    return false;
  }
};

export const removeStorageValue = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Erro ao remover "${key}" do localStorage:`, error);
    return false;
  }
};
