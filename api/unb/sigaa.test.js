import { describe, expect, it } from 'vitest';

const { filterDisciplinesByQuery } = require('./sigaa');

const disciplines = [
  {
    code: 'MAT001',
    name: 'Calculo 1',
    classes: [
      {
        classCode: 'A',
        teachers: ['Maria Silva'],
        classroom: 'ICC Sul',
        scheduleCode: '24M12',
        scheduleText: ['Segunda-feira 08:00 as 09:50']
      }
    ]
  },
  {
    code: 'CIC0104',
    name: 'Estruturas de Dados',
    classes: [
      {
        classCode: 'B',
        teachers: ['Joao Souza'],
        classroom: 'PAT AT 101',
        scheduleCode: '35T23',
        scheduleText: ['Terca-feira 14:00 as 15:50']
      }
    ]
  }
];

describe('filterDisciplinesByQuery', () => {
  it('prioritizes direct code and name matches', () => {
    const results = filterDisciplinesByQuery(disciplines, 'estrut');

    expect(results).toHaveLength(1);
    expect(results[0].code).toBe('CIC0104');
  });

  it('matches teacher names without losing the parent discipline', () => {
    const results = filterDisciplinesByQuery(disciplines, 'maria');

    expect(results).toHaveLength(1);
    expect(results[0].code).toBe('MAT001');
    expect(results[0].classes).toHaveLength(1);
    expect(results[0].classes[0].teachers[0]).toBe('Maria Silva');
  });

  it('returns the original list when the query is empty', () => {
    const results = filterDisciplinesByQuery(disciplines, '');

    expect(results).toHaveLength(2);
    expect(results[0].code).toBe('MAT001');
    expect(results[1].code).toBe('CIC0104');
  });

  it('preserva turmas com dois professores e carga total somada', async () => {
    const { parseClassRows } = require('./sigaa');

    const html = `
      <table class="listagem">
        <tr class="agrupador">
          <td><span class="tituloDisciplina">COM0146 - PESQUISA EM OPINIAO E MERCADO</span></td>
        </tr>
        <tr class="linhaPar">
          <td>01</td>
          <td>2026.1</td>
          <td>SIVALDO PEREIRA DA SILVA (30h) FABIOLA ORLANDO CALAZANS MACHADO (30h)</td>
          <td>4N1234 (16/03/2026 - 18/07/2026)</td>
          <td></td>
          <td>40</td>
          <td>10</td>
          <td>FAC/UnB - Lab. Multimidia I</td>
        </tr>
      </table>
    `;

    const results = parseClassRows(html);

    expect(results).toHaveLength(1);
    expect(results[0].classes).toHaveLength(1);
    expect(results[0].classes[0].teachers).toEqual([
      'SIVALDO PEREIRA DA SILVA',
      'FABIOLA ORLANDO CALAZANS MACHADO'
    ]);
    expect(results[0].classes[0].workloadHours).toBe(60);
  });
});
