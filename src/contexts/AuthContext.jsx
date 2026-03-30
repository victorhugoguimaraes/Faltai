/**
 * @fileoverview Contexto de Autenticação
 * Gerencia estado global do usuário, login/logout e sincronização Firebase
 * Suporta modo online (Firebase) e offline (localStorage)
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getFirebaseServices, isFirebaseConfigured } from '../firebase';
import { loginWithEmail, loginWithGoogle, registerUser, handleGoogleRedirect, logout as logoutUser } from '../services/authService';
import { getStorageValue, setStorageValue, storageKeys } from '../utils/storage';
import {
  clearPersistedSession,
  getOfflineAuthState,
  persistOfflineSession,
  persistOnlineSession,
  resolveAuthState
} from '../features/auth/lib/authState';

const AuthContext = createContext();

/**
 * Hook customizado para acessar o contexto de autenticação
 * @returns {Object} Contexto com user, loading, login, logout, etc
 * @throws {Error} Se usado fora do AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(() => {
    return getStorageValue(storageKeys.isOnline, false);
  });

  useEffect(() => {
    let unsubscribe = () => {};
    let active = true;

    const syncAuth = async () => {
      if (!isFirebaseConfigured) {
        const offlineState = getOfflineAuthState();
        setUser(offlineState.user);
        setIsOnline(offlineState.isOnline);
        setLoading(offlineState.loading);
        return;
      }

      const { auth, db } = await getFirebaseServices();

      if (!active || !auth || !db) {
        const offlineState = getOfflineAuthState();
        setUser(offlineState.user);
        setIsOnline(offlineState.isOnline);
        setLoading(offlineState.loading);
        return;
      }

      const result = await handleGoogleRedirect();
      if (active && result && result.success) {
        const session = persistOnlineSession(result.user);
        setUser(session.user);
        setIsOnline(session.isOnline);
      }

      const firestoreModule = await import('firebase/firestore');

      unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
        setLoading(true);

        try {
          let userDocData = null;

          if (firebaseUser && isOnline) {
            const userDocRef = firestoreModule.doc(db, 'usuarios', firebaseUser.uid);
            const userDoc = await firestoreModule.getDoc(userDocRef);
            userDocData = userDoc.data();
          }

          const nextState = resolveAuthState({
            firebaseUser,
            isOnline,
            userDocData,
            offlineUser: getStorageValue(storageKeys.offlineUser, null)
          });

          setUser(nextState.user);
          setIsOnline(nextState.isOnline);
          setStorageValue(storageKeys.isOnline, nextState.isOnline);
        } catch (error) {
          console.error('Erro ao carregar dados do usuário:', error);
          setUser(null);
          setIsOnline(false);
          setStorageValue(storageKeys.isOnline, false);
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      });
    };

    syncAuth();

    return () => {
      active = false;
      unsubscribe();
    };
  }, [isOnline]);

  const login = async (email, password) => {
    const result = await loginWithEmail(email, password);
    if (result.success) {
      const session = persistOnlineSession(result.user);
      setUser(session.user);
      setIsOnline(session.isOnline);
    }
    return result;
  };

  const register = async (name, email, password) => {
    const result = await registerUser(name, email, password);
    if (result.success) {
      const session = persistOnlineSession(result.user);
      setUser(session.user);
      setIsOnline(session.isOnline);
    }
    return result;
  };

  const loginAnonymously = () => {
    const session = persistOfflineSession();
    setUser(session.user);
    setIsOnline(session.isOnline);
  };

  const loginWithGoogleAuth = async () => {
    const result = await loginWithGoogle();
    if (result.success) {
      const session = persistOnlineSession(result.user);
      setUser(session.user);
      setIsOnline(session.isOnline);
    }
    return result;
  };

  const loginOffline = (userData = { displayName: 'Usuário Anônimo', isOffline: true }) => {
    const session = persistOfflineSession(userData);
    setUser(session.user);
    setIsOnline(session.isOnline);
  };

  const logout = async () => {
    await logoutUser();
    const session = clearPersistedSession();
    setUser(session.user);
    setIsOnline(session.isOnline);
  };

  const value = {
    user,
    loading,
    isOnline,
    login,
    register,
    loginAnonymously,
    loginWithGoogle: loginWithGoogleAuth,
    loginOffline,
    logout,
    setIsOnline
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
