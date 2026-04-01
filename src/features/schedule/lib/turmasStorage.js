import { getStorageValue, setStorageValue, storageKeys } from '../../../utils/storage';

const TURMAS_UPDATED_EVENT = 'faltai:turmas-updated';

const randomId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `turma-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const buildTurmaSignature = (turma) =>
  [
    turma.nome?.trim().toLowerCase(),
    turma.codigo?.trim().toLowerCase(),
    turma.diaSemana,
    turma.inicio,
    turma.fim,
    turma.local?.trim().toLowerCase(),
    turma.docente?.trim().toLowerCase()
  ].join('|');

export const createTurma = (turma) => ({
  id: turma.id || randomId(),
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

export const normalizeTurmas = (turmas = []) => {
  const seenIds = new Set();
  const seenSignatures = new Set();

  return turmas
    .map((turma) => createTurma(turma))
    .filter((turma) => turma.nome)
    .filter((turma) => {
      const signature = buildTurmaSignature(turma);

      if (seenIds.has(turma.id) || seenSignatures.has(signature)) {
        return false;
      }

      seenIds.add(turma.id);
      seenSignatures.add(signature);
      return true;
    });
};

export const loadTurmas = () => normalizeTurmas(getStorageValue(storageKeys.turmas, []));

export const mergeTurmas = (currentTurmas = [], nextTurmas = []) =>
  normalizeTurmas([...currentTurmas, ...nextTurmas]);

export const saveTurmas = (turmas) => {
  const normalizedTurmas = normalizeTurmas(turmas);
  setStorageValue(storageKeys.turmas, normalizedTurmas);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(TURMAS_UPDATED_EVENT, { detail: normalizedTurmas }));
  }

  return normalizedTurmas;
};

export const subscribeToTurmas = (onChange) => {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleStorage = (event) => {
    if (event.key && event.key !== storageKeys.turmas) {
      return;
    }

    onChange(loadTurmas());
  };

  const handleCustomUpdate = (event) => {
    onChange(normalizeTurmas(event.detail || []));
  };

  window.addEventListener('storage', handleStorage);
  window.addEventListener(TURMAS_UPDATED_EVENT, handleCustomUpdate);

  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(TURMAS_UPDATED_EVENT, handleCustomUpdate);
  };
};

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
