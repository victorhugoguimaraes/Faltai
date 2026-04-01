import { buildWeeklyReminderCopy } from './notificationState';

describe('notificationState weekly reminders', () => {
  it('prioriza materia em risco na mensagem semanal', () => {
    const copy = buildWeeklyReminderCopy([
      {
        nome: 'Redes',
        faltas: 9,
        maxFaltas: 10,
        lastFaltasUpdateAt: '2026-03-30T10:00:00.000Z'
      }
    ], new Date('2026-04-01T12:00:00.000Z'));

    expect(copy.body).toContain('Redes');
  });

  it('usa mensagem brincalhona quando faz tempo que faltas nao sao atualizadas', () => {
    const copy = buildWeeklyReminderCopy([
      {
        nome: 'Calculo',
        faltas: 3,
        maxFaltas: 12,
        lastFaltasUpdateAt: '2026-03-10T10:00:00.000Z'
      }
    ], new Date('2026-04-01T12:00:00.000Z'));

    expect(copy.body).toContain('ou voce parou de faltar ou esqueceu de atualizar');
  });

  it('mantem mensagem neutra quando o controle esta recente', () => {
    const copy = buildWeeklyReminderCopy([
      {
        nome: 'Fisica',
        faltas: 1,
        maxFaltas: 12,
        lastFaltasUpdateAt: '2026-03-30T10:00:00.000Z'
      }
    ], new Date('2026-04-01T12:00:00.000Z'));

    expect(copy.body).toContain('Hora de revisar as faltas da semana');
  });
});
