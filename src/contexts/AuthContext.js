/**
 * @fileoverview Contexto de Autenticação
 * Gerencia estado global do usuário, login/logout e sincronização Firebase
 * Suporta modo online (Firebase) e offline (localStorage)
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { loginWithEmail, loginWithGoogle, registerUser, handleGoogleRedirect } from '../services/authService';

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
    const stored = localStorage.getItem('isOnline');
    return stored ? JSON.parse(stored) : false;
  });

  useEffect(() => {
    // Verifica se houve redirect do Google ao carregar a página
    const checkGoogleRedirect = async () => {
      const result = await handleGoogleRedirect();
      if (result && result.success) {
        setUser(result.user);
        localStorage.setItem('isOnline', 'true');
        setIsOnline(true);
      }
    };
    
    checkGoogleRedirect();
    
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setLoading(true);
      try {
        if (firebaseUser && isOnline) {
          const userDocRef = doc(db, 'usuarios', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          const userData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            ...userDoc.data()
          };
          
          setUser(userData);
          localStorage.setItem('isOnline', 'true');
        } else if (!isOnline && !firebaseUser) {
          const offlineUser = localStorage.getItem('offlineUser');
          if (offlineUser) {
            setUser(JSON.parse(offlineUser));
          } else {
            setUser(null);
          }
        } else if (!firebaseUser && isOnline) {
          setUser(null);
          setIsOnline(false);
          localStorage.setItem('isOnline', 'false');
        }
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [isOnline]);

  const login = async (email, password) => {
    const result = await loginWithEmail(email, password);
    if (result.success) {
      setUser(result.user);
      setIsOnline(true);
      localStorage.setItem('isOnline', 'true');
    }
    return result;
  };

  const register = async (name, email, password) => {
    const result = await registerUser(name, email, password);
    if (result.success) {
      setUser(result.user);
      setIsOnline(true);
      localStorage.setItem('isOnline', 'true');
    }
    return result;
  };

  const loginAnonymously = () => {
    const userData = { displayName: 'Usuário Anônimo', isOffline: true };
    setUser(userData);
    setIsOnline(false);
    localStorage.setItem('offlineUser', JSON.stringify(userData));
    localStorage.setItem('isOnline', 'false');
  };

  const loginWithGoogleAuth = async () => {
    const result = await loginWithGoogle();
    if (result.success) {
      setUser(result.user);
      setIsOnline(true);
      localStorage.setItem('isOnline', 'true');
    }
    return result;
  };

  const loginOffline = (userData = { displayName: 'Usuário Anônimo', isOffline: true }) => {
    setUser(userData);
    setIsOnline(false);
    localStorage.setItem('offlineUser', JSON.stringify(userData));
    localStorage.setItem('isOnline', 'false');
  };

  const logout = () => {
    setUser(null);
    setIsOnline(false);
    localStorage.removeItem('offlineUser');
    localStorage.setItem('isOnline', 'false');
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