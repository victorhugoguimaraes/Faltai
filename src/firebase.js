import { initializeApp } from 'firebase/app';
import { getEnvValue } from './lib/env';

const firebaseConfig = {
  apiKey: getEnvValue('VITE_FIREBASE_API_KEY', 'REACT_APP_FIREBASE_API_KEY', 'demo-key'),
  authDomain: getEnvValue('VITE_FIREBASE_AUTH_DOMAIN', 'REACT_APP_FIREBASE_AUTH_DOMAIN', 'demo-project.firebaseapp.com'),
  databaseURL: getEnvValue('VITE_FIREBASE_DATABASE_URL', 'REACT_APP_FIREBASE_DATABASE_URL', 'https://demo-project-default-rtdb.firebaseio.com'),
  projectId: getEnvValue('VITE_FIREBASE_PROJECT_ID', 'REACT_APP_FIREBASE_PROJECT_ID', 'demo-project'),
  storageBucket: getEnvValue('VITE_FIREBASE_STORAGE_BUCKET', 'REACT_APP_FIREBASE_STORAGE_BUCKET', 'demo-project.appspot.com'),
  messagingSenderId: getEnvValue('VITE_FIREBASE_MESSAGING_SENDER_ID', 'REACT_APP_FIREBASE_MESSAGING_SENDER_ID', '123456789'),
  appId: getEnvValue('VITE_FIREBASE_APP_ID', 'REACT_APP_FIREBASE_APP_ID', '1:123456789:web:demo'),
  measurementId: getEnvValue('VITE_FIREBASE_MEASUREMENT_ID', 'REACT_APP_FIREBASE_MEASUREMENT_ID', undefined),
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== 'demo-key'
);

let app = null;
let authInstance = null;
let dbInstance = null;
let analyticsInstance = null;
let servicesPromise = null;
let analyticsPromise = null;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
  } catch (error) {
    console.error('Erro ao inicializar Firebase:', error);
    app = null;
  }
} else if (typeof window !== 'undefined') {
  console.warn('Firebase não configurado - rodando em modo local');
}

export const getFirebaseServices = async () => {
  if (!isFirebaseConfigured || !app) {
    return { app: null, auth: null, db: null };
  }

  if (!servicesPromise) {
    servicesPromise = Promise.all([
      import('firebase/auth'),
      import('firebase/firestore')
    ])
      .then(async ([authModule, firestoreModule]) => {
        authInstance = authInstance || authModule.getAuth(app);
        dbInstance = dbInstance || firestoreModule.getFirestore(app);

        if (typeof window !== 'undefined') {
          try {
            await authModule.setPersistence(authInstance, authModule.browserLocalPersistence);
          } catch (error) {
            console.warn('Não foi possível aplicar persistência local no Firebase Auth:', error);
          }
        }

        return {
          app,
          auth: authInstance,
          db: dbInstance
        };
      })
      .catch((error) => {
        console.error('Erro ao carregar serviços do Firebase:', error);
        return { app: null, auth: null, db: null };
      });
  }

  return servicesPromise;
};

export const getFirebaseAuth = async () => {
  const { auth } = await getFirebaseServices();
  return auth;
};

export const getFirebaseDb = async () => {
  const { db } = await getFirebaseServices();
  return db;
};

export const initAnalytics = async () => {
  if (!isFirebaseConfigured || !app || !firebaseConfig.measurementId || typeof window === 'undefined') {
    return null;
  }

  if (!analyticsPromise) {
    analyticsPromise = import('firebase/analytics')
      .then(async (analyticsModule) => {
        const supported = await analyticsModule.isSupported();

        if (!supported) {
          return null;
        }

        analyticsInstance = analyticsInstance || analyticsModule.getAnalytics(app);
        return analyticsInstance;
      })
      .catch((error) => {
        console.warn('Analytics não pôde ser inicializado:', error);
        return null;
      });
  }

  return analyticsPromise;
};

export { app, analyticsInstance as analytics };
