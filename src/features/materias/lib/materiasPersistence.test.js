import {
  getMateriasStorageScope,
  getPendingSyncState,
  loadLocalMaterias,
  markMateriasWithPendingState,
  mergeRemoteMateriasWithPending,
  normalizeMateriaRecord,
  queueMateriaDelete,
  queueMateriaUpsert,
  saveLocalMaterias
} from './materiasPersistence';

describe('materiasPersistence helpers', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('normaliza materia com derivados e id estavel', () => {
    const materia = normalizeMateriaRecord({
      id: 123,
      nome: 'ENE0056 - Sistemas Microprocessados',
      horas: 60,
      pesoFalta: 2,
      faltas: 3,
      maxFaltas: 7
    });

    expect(materia.id).toBe('123');
    expect(materia.usedAbsencePercent).toBeCloseTo(42.9, 1);
    expect(materia.presencePercent).toBeCloseTo(57.1, 1);
    expect(materia.searchTokens).toContain('ene0056');
  });

  it('salva materias por escopo de usuario', () => {
    saveLocalMaterias('user-1', [{ id: 'm1', nome: 'Calculo', horas: 60, pesoFalta: 1 }]);

    expect(loadLocalMaterias('user-1')).toHaveLength(1);
    expect(loadLocalMaterias('user-2')).toHaveLength(0);
  });

  it('mantem upsert e delete em fila separada', () => {
    queueMateriaUpsert('user-1', { id: 'm1', nome: 'Calculo', horas: 60, pesoFalta: 1 });
    queueMateriaDelete('user-1', 'm2');

    const queue = getPendingSyncState('user-1');
    expect(Object.keys(queue.upserts)).toEqual(['m1']);
    expect(queue.deletes).toEqual(['m2']);
  });

  it('mescla remoto com pendencias locais dando prioridade ao local', () => {
    const remoteMaterias = [
      { id: 'm1', nome: 'Calculo', horas: 60, pesoFalta: 1, faltas: 1, maxFaltas: 15 },
      { id: 'm2', nome: 'Fisica', horas: 60, pesoFalta: 1, faltas: 0, maxFaltas: 15 }
    ];
    const localMaterias = [
      { id: 'm3', nome: 'Quimica', horas: 60, pesoFalta: 1, faltas: 0, maxFaltas: 15 }
    ];
    const queue = {
      upserts: {
        m1: { id: 'm1', nome: 'Calculo', horas: 60, pesoFalta: 1, faltas: 4, maxFaltas: 15 }
      },
      deletes: ['m2']
    };

    const merged = mergeRemoteMateriasWithPending({ remoteMaterias, localMaterias, queue });

    expect(merged.map((materia) => materia.id)).toEqual(['m1', 'm3']);
    expect(merged.find((materia) => materia.id === 'm1')?.faltas).toBe(4);
    expect(merged.find((materia) => materia.id === 'm1')?.syncStatus).toBe('pending');
  });

  it('usa escopo offline quando usuario nao tem uid', () => {
    expect(getMateriasStorageScope(null)).toBe('offline');
    expect(getMateriasStorageScope({ isOffline: true })).toBe('offline');
  });

  it('marca materias pendentes sem alterar as sincronizadas', () => {
    const materias = [
      { id: 'm1', nome: 'Calculo', horas: 60, pesoFalta: 1 },
      { id: 'm2', nome: 'Fisica', horas: 60, pesoFalta: 1 }
    ];

    const withStatus = markMateriasWithPendingState(materias, {
      upserts: { m1: materias[0] },
      deletes: []
    });

    expect(withStatus.find((materia) => materia.id === 'm1')?.syncStatus).toBe('pending');
    expect(withStatus.find((materia) => materia.id === 'm2')?.syncStatus).toBe('synced');
  });
});
