import {
  addMateriaToList,
  calculateMateriaStats,
  deleteMateriaFromList,
  editMateriaInList,
  updateMateriaAbsences
} from './materiasState';

describe('materiasState helpers', () => {
  const materiasBase = [
    { nome: 'Calculo', faltas: 2, maxFaltas: 10, datasFaltas: ['2026-03-01'] },
    { nome: 'Fisica', faltas: 8, maxFaltas: 10, datasFaltas: ['2026-03-05'] }
  ];

  it('adiciona materia na lista', () => {
    const next = addMateriaToList(materiasBase, { nome: 'Quimica', faltas: 0, maxFaltas: 12 });

    expect(next).toHaveLength(3);
    expect(next[2].nome).toBe('Quimica');
  });

  it('edita materia na posicao correta', () => {
    const next = editMateriaInList(materiasBase, 0, { ...materiasBase[0], nome: 'Calculo II' });

    expect(next[0].nome).toBe('Calculo II');
    expect(next[1].nome).toBe('Fisica');
  });

  it('remove materia da lista', () => {
    const next = deleteMateriaFromList(materiasBase, 0);

    expect(next).toHaveLength(1);
    expect(next[0].nome).toBe('Fisica');
  });

  it('atualiza faltas e datas', () => {
    const next = updateMateriaAbsences(materiasBase, 1, 9, ['2026-03-05', '2026-03-10']);

    expect(next[1].faltas).toBe(9);
    expect(next[1].datasFaltas).toEqual(['2026-03-05', '2026-03-10']);
  });

  it('calcula estatisticas da lista', () => {
    const stats = calculateMateriaStats(materiasBase);

    expect(stats.totalMaterias).toBe(2);
    expect(stats.totalFaltas).toBe(10);
    expect(stats.materiasEmRisco).toBe(1);
    expect(stats.porcentagemMedia).toBe(50);
  });
});
