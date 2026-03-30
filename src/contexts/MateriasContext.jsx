import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getStorageValue, setStorageValue, storageKeys } from '../utils/storage';
import { getFirebaseDb } from '../firebase';
import {
  addMateriaToList,
  calculateMateriaStats,
  deleteMateriaFromList,
  editMateriaInList,
  updateMateriaAbsences
} from '../features/materias/lib/materiasState';

const MateriasContext = createContext();

export const useMaterias = () => {
  const context = useContext(MateriasContext);
  if (!context) {
    throw new Error('useMaterias must be used within a MateriasProvider');
  }
  return context;
};

export const MateriasProvider = ({ children }) => {
  const { user, isOnline } = useAuth();
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadMaterias = async () => {
      if (!user) {
        setMaterias([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        if (isOnline && user.uid) {
          setMaterias(user.materias || []);
        } else {
          setMaterias(getStorageValue(storageKeys.materias, []));
        }
      } catch (err) {
        setError('Erro ao carregar matérias');
        console.error('Erro ao carregar matérias:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMaterias();
  }, [user, isOnline]);


  const saveMaterias = async (novasMaterias) => {
    try {
      setMaterias(novasMaterias);

      setStorageValue(storageKeys.materias, novasMaterias);

      if (isOnline && user?.uid) {
        const db = await getFirebaseDb();

        if (db) {
          const firestoreModule = await import('firebase/firestore');

          await firestoreModule.updateDoc(firestoreModule.doc(db, 'usuarios', user.uid), {
            materias: novasMaterias
          });
        }
      }
    } catch (err) {
      setError('Erro ao salvar matérias');
      console.error('Erro ao salvar matérias:', err);
      throw err;
    }
  };

  const adicionarMateria = async (novaMateria) => {
    const materiasAtualizadas = addMateriaToList(materias, novaMateria);
    await saveMaterias(materiasAtualizadas);
  };

  const editarMateria = async (index, materiaEditada) => {
    const materiasAtualizadas = editMateriaInList(materias, index, materiaEditada);
    await saveMaterias(materiasAtualizadas);
  };

  const excluirMateria = async (index) => {
    const materiasAtualizadas = deleteMateriaFromList(materias, index);
    await saveMaterias(materiasAtualizadas);
  };

  const atualizarFaltas = async (index, novasFaltas, datasFaltas) => {
    const materiasAtualizadas = updateMateriaAbsences(materias, index, novasFaltas, datasFaltas);
    await saveMaterias(materiasAtualizadas);
  };

  const calcularEstatisticas = () => calculateMateriaStats(materias);

  const value = {
    materias,
    loading,
    error,
    setError,
    adicionarMateria,
    editarMateria,
    excluirMateria,
    atualizarFaltas,
    saveMaterias,
    calcularEstatisticas
  };

  return (
    <MateriasContext.Provider value={value}>
      {children}
    </MateriasContext.Provider>
  );
};
