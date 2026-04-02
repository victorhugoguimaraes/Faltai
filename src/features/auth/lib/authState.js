import { getStorageValue, removeStorageValue, setStorageValue, storageKeys } from '../../../utils/storage';

export const buildOfflineUser = (userData = { displayName: 'Usuário Anônimo', isOffline: true }) => ({
  displayName: 'Usuário Anônimo',
  isOffline: true,
  ...userData
});

export const getOfflineAuthState = () => {
  const offlineUser = getStorageValue(storageKeys.offlineUser, null);

  return {
    user: offlineUser,
    isOnline: false,
    loading: false
  };
};

export const persistOnlineSession = (user) => {
  removeStorageValue(storageKeys.offlineUser);
  setStorageValue(storageKeys.isOnline, true);
  return {
    user,
    isOnline: true
  };
};

export const persistOfflineSession = (userData) => {
  const user = buildOfflineUser(userData);
  setStorageValue(storageKeys.offlineUser, user);
  setStorageValue(storageKeys.isOnline, false);

  return {
    user,
    isOnline: false
  };
};

export const clearPersistedSession = () => {
  removeStorageValue(storageKeys.offlineUser);
  setStorageValue(storageKeys.isOnline, false);

  return {
    user: null,
    isOnline: false
  };
};

export const resolveAuthState = ({ firebaseUser, isOnline, userDocData, offlineUser }) => {
  if (firebaseUser) {
    return {
      user: {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || userDocData?.nome || 'Usuário',
        ...userDocData
      },
      isOnline: true
    };
  }

  if (!isOnline && !firebaseUser) {
    return {
      user: offlineUser || null,
      isOnline: false
    };
  }

  return {
    user: null,
    isOnline: false
  };
};
