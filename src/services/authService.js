import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const googleProvider = new GoogleAuthProvider();

export const loginWithEmail = async (email, senha) => {
  try {
    await signInWithEmailAndPassword(auth, email, senha);
    return { success: true };
  } catch (error) {
    return { success: false, message: 'Erro ao realizar login. Verifique email e senha.' };
  }
};

export const registerUser = async (nome, email, senha) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
    await setDoc(doc(db, 'usuarios', userCredential.user.uid), { nome, materias: [] });
    return { success: true };
  } catch (error) {
    return { success: false, message: 'Erro ao registrar. O email pode já estar em uso.' };
  }
};

export const loginWithGoogle = async () => {
  try {
    const userCredential = await signInWithPopup(auth, googleProvider);
    const docRef = doc(db, 'usuarios', userCredential.user.uid);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      await setDoc(docRef, {
        nome: userCredential.user.displayName || 'Usuário Google',
        materias: [],
      });
    }
    return { success: true };
  } catch (error) {
    console.error('Erro no login com Google:', error.message, error.code);
    return { success: false, message: `Erro ao realizar login com Google: ${error.message}` };
  }
};

export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true, message: 'Email de redefinição enviado! Verifique sua caixa de entrada.' };
  } catch (error) {
    return { success: false, message: `Erro ao enviar email de redefinição: ${error.message}` };
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Erro ao fazer logout:', error.message);
    throw error; 
  }
};
