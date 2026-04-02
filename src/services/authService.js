/**
 * @fileoverview Serviço de autenticação
 * Gerencia login, registro, logout e recuperação de senha usando Firebase Auth
 */

import { getFirebaseServices, isFirebaseConfigured } from '../firebase';

// Provedor de autenticação do Google
const unavailableFirebaseResult = {
  success: false,
  message: 'Firebase não está configurado neste ambiente. Use o modo offline ou configure as variáveis VITE_FIREBASE_*.'
};

/**
 * Realiza login com email e senha
 * @param {string} email - Email do usuário
 * @param {string} senha - Senha do usuário
 * @returns {Promise<Object>} Objeto com success (boolean) e user ou message
 */
export const loginWithEmail = async (email, senha) => {
  if (!isFirebaseConfigured) {
    return unavailableFirebaseResult;
  }

  try {
    const { auth, db } = await getFirebaseServices();
    const authModule = await import('firebase/auth');
    const firestoreModule = await import('firebase/firestore');

    // Autentica com Firebase Auth
    const userCredential = await authModule.signInWithEmailAndPassword(auth, email, senha);
    const user = userCredential.user;
    
    // Busca dados adicionais do usuário no Firestore
    const userDoc = await firestoreModule.getDoc(firestoreModule.doc(db, 'usuarios', user.uid));
    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || userDoc.data()?.nome || 'Usuário',
      ...userDoc.data()
    };
    
    return { success: true, user: userData };
  } catch (error) {
    return { success: false, message: 'Erro ao realizar login. Verifique email e senha.' };
  }
};

/**
 * Registra um novo usuário com email e senha
 * @param {string} nome - Nome do usuário
 * @param {string} email - Email do usuário
 * @param {string} senha - Senha do usuário
 * @returns {Promise<Object>} Objeto com success (boolean) e user ou message
 */
export const registerUser = async (nome, email, senha) => {
  if (!isFirebaseConfigured) {
    return unavailableFirebaseResult;
  }

  try {
    const { auth, db } = await getFirebaseServices();
    const authModule = await import('firebase/auth');
    const firestoreModule = await import('firebase/firestore');

    // Cria conta no Firebase Auth
    const userCredential = await authModule.createUserWithEmailAndPassword(auth, email, senha);
    
    // Cria documento do usuário no Firestore
    const userData = { nome };
    await firestoreModule.setDoc(firestoreModule.doc(db, 'usuarios', userCredential.user.uid), userData);
    
    const user = {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: nome,
      ...userData
    };
    
    return { success: true, user };
  } catch (error) {
    return { success: false, message: 'Erro ao registrar. O email pode já estar em uso.' };
  }
};

/**
 * Detecta se o dispositivo é mobile
 * @returns {boolean} True se for mobile, false caso contrário
 */
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

/**
 * Realiza login com Google
 * Usa redirect em mobile para evitar popup bloqueado, popup em desktop
 * @returns {Promise<Object>} Objeto com success e user/message
 */
export const loginWithGoogle = async () => {
  if (!isFirebaseConfigured) {
    return unavailableFirebaseResult;
  }

  try {
    const { auth, db } = await getFirebaseServices();
    const authModule = await import('firebase/auth');
    const googleProvider = new authModule.GoogleAuthProvider();

    // Usa redirect em mobile, popup em desktop
    if (isMobile()) {
      await authModule.signInWithRedirect(auth, googleProvider);
      return { success: true, message: 'Redirecionando para o Google...' };
    } else {
      const userCredential = await authModule.signInWithPopup(auth, googleProvider);
      return await processGoogleUser(userCredential, db);
    }
  } catch (error) {
    console.error('Erro no login com Google:', error.message, error.code);
    return { success: false, message: `Erro ao realizar login com Google: ${error.message}` };
  }
};

/**
 * Processa o resultado do redirect do Google (usado em mobile)
 * @returns {Promise<Object|null>} Resultado do login ou null se não houver redirect
 */
export const handleGoogleRedirect = async () => {
  if (!isFirebaseConfigured) {
    return null;
  }

  try {
    const { auth, db } = await getFirebaseServices();
    const authModule = await import('firebase/auth');
    const result = await authModule.getRedirectResult(auth);
    if (result) {
      return await processGoogleUser(result, db);
    }
    return null;
  } catch (error) {
    console.error('Erro no redirect do Google:', error.message);
    return { success: false, message: `Erro ao processar login: ${error.message}` };
  }
};

/**
 * Função auxiliar para processar dados do usuário autenticado com Google
 * Cria documento no Firestore se for primeiro login
 * @param {Object} userCredential - Credenciais do usuário retornadas pelo Google
 * @returns {Promise<Object>} Objeto com success e dados do user
 */
const processGoogleUser = async (userCredential, db) => {
  if (!db) {
    return unavailableFirebaseResult;
  }

  const firestoreModule = await import('firebase/firestore');
  const docRef = firestoreModule.doc(db, 'usuarios', userCredential.user.uid);
  const docSnap = await firestoreModule.getDoc(docRef);
  
  let userData;
  if (!docSnap.exists()) {
    // Primeiro login - cria documento do usuário
    userData = {
      nome: userCredential.user.displayName || 'Usuário Google',
    };
    await firestoreModule.setDoc(docRef, userData);
  } else {
    // Usuário já existe - carrega dados
    userData = docSnap.data();
  }
  
  const user = {
    uid: userCredential.user.uid,
    email: userCredential.user.email,
    displayName: userCredential.user.displayName || userData.nome,
    ...userData
  };
  
  return { success: true, user };
};

/**
 * Envia email de redefinição de senha
 * @param {string} email - Email do usuário
 * @returns {Promise<Object>} Objeto com success e mensagem
 */
export const resetPassword = async (email) => {
  if (!isFirebaseConfigured) {
    return unavailableFirebaseResult;
  }

  try {
    const auth = await getFirebaseServices().then((services) => services.auth);
    const authModule = await import('firebase/auth');
    await authModule.sendPasswordResetEmail(auth, email);
    return { success: true, message: 'Email de redefinição enviado! Verifique sua caixa de entrada.' };
  } catch (error) {
    return { success: false, message: `Erro ao enviar email de redefinição: ${error.message}` };
  }
};

/**
 * Faz logout do usuário atual
 * @throws {Error} Se houver erro no processo de logout
 */
export const logout = async () => {
  if (!isFirebaseConfigured) {
    return;
  }

  try {
    const auth = await getFirebaseServices().then((services) => services.auth);
    const authModule = await import('firebase/auth');
    await authModule.signOut(auth);
  } catch (error) {
    console.error('Erro ao fazer logout:', error.message);
    throw error; 
  }
};
