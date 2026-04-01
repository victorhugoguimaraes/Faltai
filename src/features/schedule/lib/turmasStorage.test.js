import { describe, expect, it } from 'vitest';
import { createTurma, mergeTurmas, normalizeTurmas } from './turmasStorage';

describe('turmasStorage', () => {
  it('normalizes manual turmas with stable defaults', () => {
    const [turma] = normalizeTurmas([{ nome: ' Estruturas de Dados ' }]);

    expect(turma.nome).toBe('Estruturas de Dados');
    expect(turma.diaSemana).toBe('SEG');
    expect(turma.inicio).toBe('08:00');
    expect(turma.fim).toBe('09:50');
    expect(turma.id).toBeTruthy();
  });

  it('deduplicates equivalent imported turmas when merging', () => {
    const base = [
      createTurma({
        id: 'cic-a-seg',
        nome: 'CIC0104 - Estruturas de Dados',
        codigo: 'A',
        docente: 'Maria',
        local: 'PAT AT 101',
        diaSemana: 'SEG',
        inicio: '08:00',
        fim: '09:50'
      })
    ];

    const duplicate = [
      createTurma({
        id: 'other-id',
        nome: 'CIC0104 - Estruturas de Dados',
        codigo: 'A',
        docente: 'Maria',
        local: 'PAT AT 101',
        diaSemana: 'SEG',
        inicio: '08:00',
        fim: '09:50'
      })
    ];

    const merged = mergeTurmas(base, duplicate);

    expect(merged).toHaveLength(1);
    expect(merged[0].id).toBe('cic-a-seg');
  });
});
