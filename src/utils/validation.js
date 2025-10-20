/**
 * @fileoverview Funções de validação de dados
 * Valida formulários, campos e sanitiza entradas do usuário
 */

/**
 * Valida formato de email
 * @param {string} email - Email a ser validado
 * @returns {boolean} True se email válido
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida requisitos de senha
 * @param {string} password - Senha a ser validada
 * @returns {Object} {isValid: boolean, message: string}
 */
export const validatePassword = (password) => {
  if (!password) return { isValid: false, message: 'Senha é obrigatória' };
  if (password.length < 6) return { isValid: false, message: 'Senha deve ter pelo menos 6 caracteres' };
  return { isValid: true, message: '' };
};

export const validateMateria = (materia) => {
  const errors = {};

  if (!materia.nome || !materia.nome.trim()) {
    errors.nome = 'Nome da matéria é obrigatório';
  } else if (materia.nome.trim().length < 2) {
    errors.nome = 'Nome deve ter pelo menos 2 caracteres';
  } else if (materia.nome.trim().length > 50) {
    errors.nome = 'Nome deve ter no máximo 50 caracteres';
  }

  const horas = parseInt(materia.horas);
  if (!materia.horas || isNaN(horas)) {
    errors.horas = 'Carga horária é obrigatória';
  } else if (horas < 15 || horas > 200) {
    errors.horas = 'Carga horária deve estar entre 15 e 200 horas';
  }

  const pesoFalta = parseFloat(materia.pesoFalta);
  if (!materia.pesoFalta || isNaN(pesoFalta)) {
    errors.pesoFalta = 'Peso da falta é obrigatório';
  } else if (pesoFalta <= 0) {
    errors.pesoFalta = 'Peso da falta deve ser maior que zero';
  } else if (pesoFalta > 10) {
    errors.pesoFalta = 'Peso da falta deve ser no máximo 10';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateAvaliacao = (avaliacao) => {
  const errors = {};

  if (!avaliacao.tipo || !avaliacao.tipo.trim()) {
    errors.tipo = 'Tipo é obrigatório';
  }

  if (!avaliacao.data) {
    errors.data = 'Data é obrigatória';
  } else {
    const dataAvaliacao = new Date(avaliacao.data);
    const hoje = new Date();
    const umAnoAtras = new Date();
    const umAnoAFrente = new Date();
    
    umAnoAtras.setFullYear(hoje.getFullYear() - 1);
    umAnoAFrente.setFullYear(hoje.getFullYear() + 1);
    
    if (dataAvaliacao < umAnoAtras || dataAvaliacao > umAnoAFrente) {
      errors.data = 'Data deve estar dentro de um período razoável';
    }
  }

  if (avaliacao.descricao && avaliacao.descricao.length > 200) {
    errors.descricao = 'Descrição deve ter no máximo 200 caracteres';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateFalta = (falta) => {
  const errors = {};

  if (!falta.data) {
    errors.data = 'Data é obrigatória';
  } else {
    const dataFalta = new Date(falta.data);
    const hoje = new Date();
    if (dataFalta > hoje) {
      errors.data = 'Data não pode ser futura';
    }
    
    const umAnoAtras = new Date();
    umAnoAtras.setFullYear(hoje.getFullYear() - 1);
    if (dataFalta < umAnoAtras) {
      errors.data = 'Data não pode ser muito antiga (máximo 1 ano)';
    }
  }

  if (falta.motivo && falta.motivo.length > 100) {
    errors.motivo = 'Motivo deve ter no máximo 100 caracteres';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateUser = (userData) => {
  const errors = {};

  if (!userData.nome || !userData.nome.trim()) {
    errors.nome = 'Nome é obrigatório';
  } else if (userData.nome.trim().length < 2) {
    errors.nome = 'Nome deve ter pelo menos 2 caracteres';
  } else if (userData.nome.trim().length > 50) {
    errors.nome = 'Nome deve ter no máximo 50 caracteres';
  }

  if (!validateEmail(userData.email)) {
    errors.email = 'Email deve ter um formato válido';
  }

  const passwordValidation = validatePassword(userData.senha);
  if (!passwordValidation.isValid) {
    errors.senha = passwordValidation.message;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateRequired = (value, fieldName) => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return {
      isValid: false,
      message: `${fieldName} é obrigatório`
    };
  }
  return { isValid: true, message: '' };
};

export const validateLength = (value, min = 0, max = Infinity, fieldName = 'Campo') => {
  const length = value ? value.toString().length : 0;
  
  if (length < min) {
    return {
      isValid: false,
      message: `${fieldName} deve ter pelo menos ${min} caracteres`
    };
  }
  
  if (length > max) {
    return {
      isValid: false,
      message: `${fieldName} deve ter no máximo ${max} caracteres`
    };
  }
  
  return { isValid: true, message: '' };
};

export const validateRange = (value, min = -Infinity, max = Infinity, fieldName = 'Campo') => {
  const numValue = parseFloat(value);
  
  if (isNaN(numValue)) {
    return {
      isValid: false,
      message: `${fieldName} deve ser um número válido`
    };
  }
  
  if (numValue < min || numValue > max) {
    return {
      isValid: false,
      message: `${fieldName} deve estar entre ${min} e ${max}`
    };
  }
  
  return { isValid: true, message: '' };
};

export const sanitizeMateria = (materia) => {
  return {
    nome: materia.nome?.trim() || '',
    horas: parseInt(materia.horas) || 0,
    pesoFalta: parseFloat(materia.pesoFalta) || 1,
    avaliacoes: materia.avaliacoes || [],
    faltas: materia.faltas || 0,
    maxFaltas: Math.floor((parseInt(materia.horas) || 0) * 0.25),
    id: materia.id || Date.now()
  };
};