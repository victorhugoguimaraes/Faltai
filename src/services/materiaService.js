/**
 * @fileoverview Serviço de gerenciamento de matérias
 * Operações CRUD de matérias e controle de faltas com sincronização Firebase
 */

import { getFirebaseServices } from '../firebase';
import { calculateMaxFaltas } from '../utils/validation';

/**
 * Adiciona uma nova matéria
 * Calcula automaticamente o máximo de faltas permitidas (25% da carga horária / peso)
 * @param {string} nome - Nome da matéria
 * @param {number} horas - Carga horária total
 * @param {number} pesoFalta - Peso de cada falta (geralmente 1, 2 ou 4)
 * @param {Array} materias - Array atual de matérias
 * @param {boolean} isOnline - Se deve sincronizar com Firebase
 * @returns {Promise<Array>} Array atualizado de matérias
 */
export const addMateria = async (nome, horas, pesoFalta, materias, isOnline) => {
  const maxFaltas = calculateMaxFaltas(horas, pesoFalta);
  
  const novasMaterias = [...materias, { 
    nome, 
    horas, 
    faltas: 0, 
    maxFaltas, 
    pesoFalta, 
    datasFaltas: [] 
  }];
  
  // Sincroniza com Firebase se usuário estiver online
  if (isOnline) {
    const { auth, db } = await getFirebaseServices();
    if (auth?.currentUser && db) {
      const firestoreModule = await import('firebase/firestore');
      await firestoreModule.setDoc(firestoreModule.doc(db, 'usuarios', auth.currentUser.uid), { materias: novasMaterias });
    }
  }
  return novasMaterias;
};

/**
 * Edita uma matéria existente
 * Recalcula máximo de faltas se carga horária ou peso mudarem
 * @param {number} index - Índice da matéria no array
 * @param {string} nome - Novo nome (opcional)
 * @param {number} horas - Nova carga horária (opcional)
 * @param {number} pesoFalta - Novo peso da falta (opcional)
 * @param {Array} materias - Array atual de matérias
 * @param {boolean} isOnline - Se deve sincronizar com Firebase
 * @returns {Promise<Array>} Array atualizado de matérias
 */
export const editMateria = async (index, nome, horas, pesoFalta, materias, isOnline) => {
  const horasAtualizadas = horas || materias[index].horas;
  const pesoAtualizado = pesoFalta || materias[index].pesoFalta;
  const maxFaltas = calculateMaxFaltas(horasAtualizadas, pesoAtualizado);
  
  const novasMaterias = [...materias];
  novasMaterias[index] = {
    nome: nome || materias[index].nome,
    horas: horas || materias[index].horas,
    faltas: Math.min(novasMaterias[index].faltas, maxFaltas), // Garante que não exceda novo máximo
    maxFaltas,
    pesoFalta: pesoFalta || materias[index].pesoFalta,
    datasFaltas: novasMaterias[index].datasFaltas || [],
  };
  
  if (isOnline) {
    const { auth, db } = await getFirebaseServices();
    if (auth?.currentUser && db) {
      const firestoreModule = await import('firebase/firestore');
      await firestoreModule.setDoc(firestoreModule.doc(db, 'usuarios', auth.currentUser.uid), { materias: novasMaterias });
    }
  }
  return novasMaterias;
};

/**
 * Remove uma matéria do array
 * @param {number} index - Índice da matéria a ser removida
 * @param {Array} materias - Array atual de matérias
 * @param {boolean} isOnline - Se deve sincronizar com Firebase
 * @returns {Promise<Array>} Array atualizado sem a matéria removida
 */
export const deleteMateria = async (index, materias, isOnline) => {
  const novasMaterias = materias.filter((_, i) => i !== index);
  
  if (isOnline) {
    const { auth, db } = await getFirebaseServices();
    if (auth?.currentUser && db) {
      const firestoreModule = await import('firebase/firestore');
      await firestoreModule.setDoc(firestoreModule.doc(db, 'usuarios', auth.currentUser.uid), { materias: novasMaterias });
    }
  }
  return novasMaterias;
};

/**
 * Adiciona uma falta a uma matéria
 * Registra a data da falta e verifica se não excede o máximo permitido
 * @param {number} index - Índice da matéria
 * @param {Array} materias - Array atual de matérias
 * @param {boolean} isOnline - Se deve sincronizar com Firebase
 * @returns {Promise<Array>} Array atualizado de matérias
 */
export const addFalta = async (index, materias, isOnline) => {
  const novasMaterias = [...materias];
  
  // Só adiciona se não exceder o máximo permitido
  if (novasMaterias[index].faltas < novasMaterias[index].maxFaltas) {
    novasMaterias[index].faltas += 1;
    novasMaterias[index].datasFaltas = novasMaterias[index].datasFaltas || [];
    
    // Registra a data atual da falta (evita duplicatas)
    const today = new Date().toISOString().split('T')[0];
    if (!novasMaterias[index].datasFaltas.includes(today)) {
      novasMaterias[index].datasFaltas.push(today);
    }
    
    if (isOnline) {
      const { auth, db } = await getFirebaseServices();
      if (auth?.currentUser && db) {
        const firestoreModule = await import('firebase/firestore');
        await firestoreModule.setDoc(firestoreModule.doc(db, 'usuarios', auth.currentUser.uid), { materias: novasMaterias });
      }
    }
  }
  return novasMaterias;
};

/**
 * Remove uma falta de uma matéria
 * Remove a última data registrada de falta
 * @param {number} index - Índice da matéria
 * @param {Array} materias - Array atual de matérias
 * @param {boolean} isOnline - Se deve sincronizar com Firebase
 * @returns {Promise<Array>} Array atualizado de matérias
 */
export const removeFalta = async (index, materias, isOnline) => {
  const novasMaterias = [...materias];
  
  // Só remove se houver faltas
  if (novasMaterias[index].faltas > 0) {
    novasMaterias[index].faltas -= 1;
    
    // Remove a última data de falta registrada
    if (novasMaterias[index].datasFaltas?.length > 0) {
      novasMaterias[index].datasFaltas.pop();
    }
    
    if (isOnline) {
      const { auth, db } = await getFirebaseServices();
      if (auth?.currentUser && db) {
        const firestoreModule = await import('firebase/firestore');
        await firestoreModule.setDoc(firestoreModule.doc(db, 'usuarios', auth.currentUser.uid), { materias: novasMaterias });
      }
    }
  }
  return novasMaterias;
};
