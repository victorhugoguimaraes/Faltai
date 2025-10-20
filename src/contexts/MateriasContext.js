import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

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
          const storedMaterias = localStorage.getItem('materias');
          setMaterias(storedMaterias ? JSON.parse(storedMaterias) : []);
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

      localStorage.setItem('materias', JSON.stringify(novasMaterias));

      if (isOnline && user?.uid) {
        await updateDoc(doc(db, 'usuarios', user.uid), {
          materias: novasMaterias
        });
      }
    } catch (err) {
      setError('Erro ao salvar matérias');
      console.error('Erro ao salvar matérias:', err);
      throw err;
    }
  };

  const adicionarMateria = async (novaMateria) => {
    const materiasAtualizadas = [...materias, novaMateria];
    await saveMaterias(materiasAtualizadas);
  };

  const editarMateria = async (index, materiaEditada) => {
    const materiasAtualizadas = [...materias];
    materiasAtualizadas[index] = materiaEditada;
    await saveMaterias(materiasAtualizadas);
  };

  const excluirMateria = async (index) => {
    const materiasAtualizadas = materias.filter((_, i) => i !== index);
    await saveMaterias(materiasAtualizadas);
  };

  const atualizarFaltas = async (index, novasFaltas, datasFaltas) => {
    const materiasAtualizadas = [...materias];
    materiasAtualizadas[index] = {
      ...materiasAtualizadas[index],
      faltas: novasFaltas,
      datasFaltas: datasFaltas || materiasAtualizadas[index].datasFaltas
    };
    await saveMaterias(materiasAtualizadas);
  };

  const calcularEstatisticas = () => {
    if (materias.length === 0) {
      return {
        totalMaterias: 0,
        totalFaltas: 0,
        mediaFaltas: 0,
        materiasEmRisco: 0,
        porcentagemMedia: 0
      };
    }

    const totalFaltas = materias.reduce((sum, m) => {
      const faltas = Number(m?.faltas) || 0;
      return sum + faltas;
    }, 0);
    
    const mediaFaltas = materias.length > 0 ? totalFaltas / materias.length : 0;
    
    const materiasEmRisco = materias.filter(m => {
      const faltas = Number(m?.faltas) || 0;
      const maxFaltas = Number(m?.maxFaltas) || 1;
      return maxFaltas > 0 && (faltas / maxFaltas) > 0.75;
    }).length;
    
    const porcentagemMedia = materias.length > 0 ? 
      materias.reduce((sum, m) => {
        const faltas = Number(m?.faltas) || 0;
        const maxFaltas = Number(m?.maxFaltas) || 1;
        const percentual = maxFaltas > 0 ? (faltas / maxFaltas) : 0;
        return sum + percentual;
      }, 0) / materias.length * 100 : 0;

    return {
      totalMaterias: materias.length,
      totalFaltas: Math.max(0, totalFaltas),
      mediaFaltas: Number(mediaFaltas.toFixed(2)) || 0,
      materiasEmRisco: Math.max(0, materiasEmRisco),
      porcentagemMedia: Number(porcentagemMedia.toFixed(2)) || 0
    };
  };

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