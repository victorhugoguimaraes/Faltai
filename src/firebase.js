/**
 * @fileoverview Configuração e inicialização do Firebase
 * Gerencia autenticação e banco de dados Firestore
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * Configuração do Firebase utilizando variáveis de ambiente
 * Fallback para valores demo caso as variáveis não estejam configuradas
 */
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "demo-key",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:123456789:web:demo",
};

let app, auth, db;

try {
  // Verifica se as credenciais reais do Firebase foram fornecidas
  if (process.env.REACT_APP_FIREBASE_API_KEY && process.env.REACT_APP_FIREBASE_API_KEY !== "demo-key") {
    // Inicializa o Firebase com as credenciais reais
    app = initializeApp(firebaseConfig);
    auth = getAuth(app); // Instância de autenticação
    db = getFirestore(app); // Instância do Firestore
  } else {
    // Modo local sem Firebase
    console.warn('Firebase não configurado - rodando em modo local');
    auth = null;
    db = null;
  }
} catch (error) {
  console.error('Erro ao inicializar Firebase:', error);
  auth = null;
  db = null;
}

// Exporta instâncias do auth e database para uso em toda aplicação
export { auth, db };