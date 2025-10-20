/**
 * @fileoverview Serviço de autenticação
 * Gerencia login, registro, logout e recuperação de senha usando Firebase Auth
 */

import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, signInWithRedirect, signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail, getRedirectResult } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Provedor de autenticação do Google
const googleProvider = new GoogleAuthProvider();

/**
 * Realiza login com email e senha
 * @param {string} email - Email do usuário
 * @param {string} senha - Senha do usuário
 * @returns {Promise<Object>} Objeto com success (boolean) e user ou message
 */
export const loginWithEmail = async (email, senha) => {
  try {
    // Autentica com Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, senha);
    const user = userCredential.user;
    
    // Busca dados adicionais do usuário no Firestore
    const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
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
  try {
    // Cria conta no Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
    
    // Cria documento do usuário no Firestore
    const userData = { nome, materias: [] };
    await setDoc(doc(db, 'usuarios', userCredential.user.uid), userData);
    
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
  try {
    // Usa redirect em mobile, popup em desktop
    if (isMobile()) {
      await signInWithRedirect(auth, googleProvider);
      return { success: true, message: 'Redirecionando para o Google...' };
    } else {
      const userCredential = await signInWithPopup(auth, googleProvider);
      return await processGoogleUser(userCredential);
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
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      return await processGoogleUser(result);
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
const processGoogleUser = async (userCredential) => {
  const docRef = doc(db, 'usuarios', userCredential.user.uid);
  const docSnap = await getDoc(docRef);
  
  let userData;
  if (!docSnap.exists()) {
    // Primeiro login - cria documento do usuário
    userData = {
      nome: userCredential.user.displayName || 'Usuário Google',
      materias: [],
    };
    await setDoc(docRef, userData);
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
  try {
    await sendPasswordResetEmail(auth, email);
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
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Erro ao fazer logout:', error.message);
    throw error; 
  }
};
