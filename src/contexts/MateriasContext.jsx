import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import {
  addMateriaToList,
  calculateMateriaStats,
  deleteMateriaFromList,
  editMateriaInList,
  updateMateriaAbsences
} from '../features/materias/lib/materiasState';
import {
  flushMateriasSync,
  getMateriasStorageScope,
  getPendingSyncState,
  loadLocalMaterias,
  loadRemoteMaterias,
  markMateriasWithPendingState,
  mergeRemoteMateriasWithPending,
  normalizeMateriaRecord,
  queueMateriaDelete,
  queueMateriaUpsert,
  saveLocalMaterias,
  subscribeToRemoteMaterias
} from '../features/materias/lib/materiasPersistence';

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
  const syncTimeoutRef = useRef(null);
  const remoteUnsubscribeRef = useRef(() => {});
  const remoteRefreshIntervalRef = useRef(null);

  const currentScope = getMateriasStorageScope(user);

  const refreshPendingState = (nextMaterias, scope = currentScope) => {
    const materiasWithStatus = markMateriasWithPendingState(nextMaterias, getPendingSyncState(scope));
    setMaterias(materiasWithStatus);
    saveLocalMaterias(scope, materiasWithStatus);
    return materiasWithStatus;
  };

  const scheduleSync = (scope = currentScope) => {
    if (!isOnline || !user?.uid) {
      return;
    }

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = window.setTimeout(async () => {
      try {
        await flushMateriasSync(user.uid, scope);
        setMaterias((currentMaterias) => markMateriasWithPendingState(currentMaterias, getPendingSyncState(scope)));
      } catch (syncError) {
        console.error('Erro ao sincronizar materias pendentes:', syncError);
      }
    }, 250);
  };

  useEffect(() => {
    const localMaterias = loadLocalMaterias(currentScope);
    const queueForScope = () => getPendingSyncState(currentScope);
    const applyRemoteMaterias = (remoteMaterias) => {
      const mergedMaterias = mergeRemoteMateriasWithPending({
        remoteMaterias,
        localMaterias,
        queue: queueForScope()
      });

      setMaterias(mergedMaterias);
      saveLocalMaterias(currentScope, mergedMaterias);
      setLoading(false);
    };
    const reconcileRemoteMaterias = async () => {
      if (!isOnline || !user?.uid) {
        return;
      }

      try {
        const remoteMaterias = await loadRemoteMaterias(user.uid);
        applyRemoteMaterias(remoteMaterias);
      } catch (err) {
        setError('Erro ao carregar materias');
        console.error('Erro ao reconciliar materias remotas:', err);
        setLoading(false);
      }
    };

    remoteUnsubscribeRef.current?.();
    remoteUnsubscribeRef.current = () => {};
    if (remoteRefreshIntervalRef.current) {
      clearInterval(remoteRefreshIntervalRef.current);
      remoteRefreshIntervalRef.current = null;
    }

    if (!user) {
      setMaterias(localMaterias);
      setLoading(false);
      return () => {
        if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current);
        }
      };
    }

    setLoading(true);
    setError(null);
    setMaterias(localMaterias);

    if (isOnline && user.uid) {
      scheduleSync(currentScope);
      reconcileRemoteMaterias();

      let active = true;

      subscribeToRemoteMaterias(user.uid, {
        onData: (remoteMaterias) => {
          if (!active) {
            return;
          }

          applyRemoteMaterias(remoteMaterias);
        },
        onError: (err) => {
          if (!active) {
            return;
          }

          setError('Erro ao carregar materias');
          console.error('Erro ao carregar materias:', err);
          setLoading(false);
        }
      }).then((unsubscribe) => {
        if (!active) {
          unsubscribe?.();
          return;
        }

        remoteUnsubscribeRef.current = unsubscribe || (() => {});
      });

      remoteRefreshIntervalRef.current = window.setInterval(() => {
        reconcileRemoteMaterias();
      }, 15000);
    } else {
      setMaterias(localMaterias);
      setLoading(false);
    }

    return () => {
      remoteUnsubscribeRef.current?.();
      remoteUnsubscribeRef.current = () => {};
      if (remoteRefreshIntervalRef.current) {
        clearInterval(remoteRefreshIntervalRef.current);
        remoteRefreshIntervalRef.current = null;
      }
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [user, isOnline]);

  useEffect(() => {
    const handleOnlineSync = () => scheduleSync();
    const handleVisibilitySync = () => {
      if (document.visibilityState === 'visible') {
        scheduleSync();
        if (isOnline && user?.uid) {
          loadRemoteMaterias(user.uid)
            .then((remoteMaterias) => {
              const mergedMaterias = mergeRemoteMateriasWithPending({
                remoteMaterias,
                localMaterias: loadLocalMaterias(currentScope),
                queue: getPendingSyncState(currentScope)
              });

              setMaterias(mergedMaterias);
              saveLocalMaterias(currentScope, mergedMaterias);
            })
            .catch((error) => {
              console.error('Erro ao atualizar materias ao voltar para o app:', error);
            });
        }
      }
    };

    window.addEventListener('online', handleOnlineSync);
    document.addEventListener('visibilitychange', handleVisibilitySync);

    return () => {
      window.removeEventListener('online', handleOnlineSync);
      document.removeEventListener('visibilitychange', handleVisibilitySync);
    };
  }, [isOnline, user]);

  const saveMaterias = async (novasMaterias, options = {}) => {
    const { changedMateriaIds = [], deletedMateriaId = null } = options;

    try {
      const normalizedMaterias = novasMaterias.map((materia) => normalizeMateriaRecord(materia));
      refreshPendingState(normalizedMaterias, currentScope);

      if (deletedMateriaId !== null && deletedMateriaId !== undefined) {
        queueMateriaDelete(currentScope, deletedMateriaId);
      }

      const idsToSync = changedMateriaIds.length > 0
        ? new Set(changedMateriaIds.filter(Boolean).map((id) => String(id)))
        : new Set(normalizedMaterias.map((materia) => String(materia.id)));

      normalizedMaterias.forEach((materia) => {
        if (idsToSync.has(String(materia.id))) {
          queueMateriaUpsert(currentScope, materia);
        }
      });

      setMaterias((currentMaterias) => markMateriasWithPendingState(currentMaterias, getPendingSyncState(currentScope)));
      scheduleSync(currentScope);
    } catch (err) {
      setError('Erro ao salvar materias');
      console.error('Erro ao salvar materias:', err);
      throw err;
    }
  };

  const adicionarMateria = async (novaMateria) => {
    const materiaNormalizada = normalizeMateriaRecord(novaMateria);
    const materiasAtualizadas = addMateriaToList(materias, materiaNormalizada);
    await saveMaterias(materiasAtualizadas, { changedMateriaIds: [materiaNormalizada.id] });
  };

  const editarMateria = async (index, materiaEditada) => {
    const materiaNormalizada = normalizeMateriaRecord({
      ...materias[index],
      ...materiaEditada,
      id: materias[index]?.id
    });
    const materiasAtualizadas = editMateriaInList(
      materias,
      index,
      materiaNormalizada
    );

    await saveMaterias(materiasAtualizadas, { changedMateriaIds: [materiaNormalizada.id] });
  };

  const excluirMateria = async (index) => {
    const materiaId = materias[index]?.id;
    const materiasAtualizadas = deleteMateriaFromList(materias, index);
    await saveMaterias(materiasAtualizadas, { deletedMateriaId: materiaId });
  };

  const atualizarFaltas = async (index, novasFaltas, datasFaltas) => {
    const materiasAtualizadas = updateMateriaAbsences(materias, index, novasFaltas, datasFaltas);
    await saveMaterias(materiasAtualizadas, { changedMateriaIds: [materias[index]?.id] });
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
