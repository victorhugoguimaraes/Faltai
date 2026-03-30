import { getStorageValue, setStorageValue, storageKeys } from '../../../utils/storage';

export const loadTurmas = () => getStorageValue(storageKeys.turmas, []);

export const saveTurmas = (turmas) => {
  setStorageValue(storageKeys.turmas, turmas);
  return turmas;
};

export const createTurma = (turma) => ({
  id: turma.id || Date.now(),
  nome: turma.nome?.trim() || '',
  codigo: turma.codigo?.trim() || '',
  docente: turma.docente?.trim() || '',
  local: turma.local?.trim() || '',
  diaSemana: turma.diaSemana || 'SEG',
  inicio: turma.inicio || '08:00',
  fim: turma.fim || '09:50',
  dataInicio: turma.dataInicio || '',
  dataFim: turma.dataFim || '',
  observacoes: turma.observacoes?.trim() || ''
});

export const shareTurmasAsText = async (turmas) => {
  const text = turmas.length === 0
    ? 'Minha grade no Faltaí ainda está vazia.'
    : turmas.map((turma) =>
        `${turma.nome}${turma.codigo ? ` (${turma.codigo})` : ''}\n${turma.diaSemana} ${turma.inicio}-${turma.fim}${turma.local ? ` • ${turma.local}` : ''}${turma.docente ? ` • ${turma.docente}` : ''}`
      ).join('\n\n');

  if (navigator.share) {
    await navigator.share({
      title: 'Minha grade no Faltai',
      text
    });
    return true;
  }

  await navigator.clipboard.writeText(text);
  return false;
};
