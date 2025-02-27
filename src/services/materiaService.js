import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

export const addMateria = async (nome, horas, pesoFalta, materias, isOnline) => {
  const baseMaxFaltas = Math.floor(horas * 0.25);
  const maxFaltas = Math.floor(baseMaxFaltas / pesoFalta);
  const novasMaterias = [...materias, { nome, horas, faltas: 0, maxFaltas, pesoFalta, datasFaltas: [] }];
  if (isOnline && auth.currentUser) {
    await setDoc(doc(db, 'usuarios', auth.currentUser.uid), { materias: novasMaterias });
  }
  return novasMaterias;
};

export const editMateria = async (index, nome, horas, pesoFalta, materias, isOnline) => {
  const baseMaxFaltas = horas ? Math.floor(horas * 0.25) : materias[index].maxFaltas * materias[index].pesoFalta;
  const maxFaltas = Math.floor(baseMaxFaltas / (pesoFalta || materias[index].pesoFalta));
  const novasMaterias = [...materias];
  novasMaterias[index] = {
    nome: nome || materias[index].nome,
    horas: horas || materias[index].horas,
    faltas: Math.min(novasMaterias[index].faltas, maxFaltas),
    maxFaltas,
    pesoFalta: pesoFalta || materias[index].pesoFalta,
    datasFaltas: novasMaterias[index].datasFaltas || [],
  };
  if (isOnline && auth.currentUser) {
    await setDoc(doc(db, 'usuarios', auth.currentUser.uid), { materias: novasMaterias });
  }
  return novasMaterias;
};

export const deleteMateria = async (index, materias, isOnline) => {
  const novasMaterias = materias.filter((_, i) => i !== index);
  if (isOnline && auth.currentUser) {
    await setDoc(doc(db, 'usuarios', auth.currentUser.uid), { materias: novasMaterias });
  }
  return novasMaterias;
};

export const addFalta = async (index, materias, isOnline) => {
  const novasMaterias = [...materias];
  const pesoFalta = novasMaterias[index].pesoFalta || 1;
  if (novasMaterias[index].faltas < novasMaterias[index].maxFaltas) {
    novasMaterias[index].faltas += 1;
    novasMaterias[index].datasFaltas = novasMaterias[index].datasFaltas || [];
    const today = new Date().toISOString().split('T')[0];
    if (!novasMaterias[index].datasFaltas.includes(today)) {
      novasMaterias[index].datasFaltas.push(today);
    }
    if (isOnline && auth.currentUser) {
      await setDoc(doc(db, 'usuarios', auth.currentUser.uid), { materias: novasMaterias });
    }
  }
  return novasMaterias;
};

export const removeFalta = async (index, materias, isOnline) => {
  const novasMaterias = [...materias];
  if (novasMaterias[index].faltas > 0) {
    novasMaterias[index].faltas -= 1;
    if (novasMaterias[index].datasFaltas?.length > 0) {
      novasMaterias[index].datasFaltas.pop();
    }
    if (isOnline && auth.currentUser) {
      await setDoc(doc(db, 'usuarios', auth.currentUser.uid), { materias: novasMaterias });
    }
  }
  return novasMaterias;
};