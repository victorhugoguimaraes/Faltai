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
});
