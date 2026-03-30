import {
  calculateMaxFaltas,
  validateEmail,
  validateMateria,
  validateAvaliacao,
  sanitizeMateria
} from './validation';

describe('validation utils', () => {
  it('valida emails corretamente', () => {
    expect(validateEmail('aluno@example.com')).toBe(true);
    expect(validateEmail('email-invalido')).toBe(false);
  });

  it('detecta materia invalida', () => {
    const result = validateMateria({
      nome: 'A',
      horas: '10',
      pesoFalta: '0'
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.nome).toBeDefined();
    expect(result.errors.horas).toBeDefined();
    expect(result.errors.pesoFalta).toBeDefined();
  });

  it('aceita avaliacao dentro de uma janela razoavel', () => {
    const result = validateAvaliacao({
      tipo: 'PROVA',
      data: new Date().toISOString().split('T')[0],
      descricao: 'Unidade 1'
    });

    expect(result.isValid).toBe(true);
  });

  it('sanitiza materia preservando defaults importantes', () => {
    const sanitized = sanitizeMateria({
      nome: '  Calculo I  ',
      horas: '80',
      pesoFalta: '2'
    });

    expect(sanitized.nome).toBe('Calculo I');
    expect(sanitized.horas).toBe(80);
    expect(sanitized.pesoFalta).toBe(2);
    expect(sanitized.maxFaltas).toBe(10);
    expect(sanitized.avaliacoes).toEqual([]);
  });

  it('calcula maximo de faltas considerando o peso por dia', () => {
    expect(calculateMaxFaltas(60, 2)).toBe(7);
    expect(calculateMaxFaltas('60', '4')).toBe(3);
  });
});
