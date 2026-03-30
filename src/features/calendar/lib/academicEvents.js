import { getStorageValue, setStorageValue } from '../../../utils/storage';

const formatLocalDate = (value) => {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const academicEventsStorageKey = 'eventos_academicos';

export const academicEventTypes = {
  AULA: {
    nome: 'Aula Regular',
    cor: 'bg-blue-100 border-blue-500',
    dotColor: 'bg-sky-500'
  },
  PROVA: {
    nome: 'Prova/Avaliação',
    cor: 'bg-red-100 border-red-500',
    dotColor: 'bg-rose-500'
  },
  TRABALHO: {
    nome: 'Trabalho/Apresentação',
    cor: 'bg-green-100 border-green-500',
    dotColor: 'bg-emerald-500'
  },
  FERIADO: {
    nome: 'Feriado/Recesso',
    cor: 'bg-gray-100 border-gray-500',
    dotColor: 'bg-slate-500'
  },
  PRAZO: {
    nome: 'Prazo Acadêmico',
    cor: 'bg-amber-100 border-amber-500',
    dotColor: 'bg-amber-300'
  },
  OUTRO: {
    nome: 'Outro Evento',
    cor: 'bg-purple-100 border-purple-500',
    dotColor: 'bg-fuchsia-500'
  }
};

const defaultAcademicEvents = [
  {
    id: 'default-periodo-letivo-inicio',
    titulo: 'Primeiro dia letivo',
    tipo: 'OUTRO',
    materia: '',
    descricao: 'Início do período letivo 2026.1.',
    data: '2026-02-23',
    horario: '',
    isDefault: true
  },
  {
    id: 'default-matricula',
    titulo: 'Solicitação de matrícula',
    tipo: 'PRAZO',
    materia: '',
    descricao: 'Período para solicitar matrícula no SIGAA: 23/02 a 26/02.',
    data: '2026-02-23',
    horario: '',
    isDefault: true
  },
  {
    id: 'default-resultado-matricula',
    titulo: 'Resultado da matrícula',
    tipo: 'PRAZO',
    materia: '',
    descricao: 'Resultado da matrícula disponível até 12h.',
    data: '2026-03-02',
    horario: '12:00',
    isDefault: true
  },
  {
    id: 'default-rematricula',
    titulo: 'Início da rematrícula',
    tipo: 'PRAZO',
    materia: '',
    descricao: 'Período de rematrícula no SIGAA: 03/03 a 05/03.',
    data: '2026-03-03',
    horario: '',
    isDefault: true
  },
  {
    id: 'default-matricula-extra',
    titulo: 'Matrícula extraordinária',
    tipo: 'PRAZO',
    materia: '',
    descricao: 'Solicitação de matrícula extraordinária e retirada de disciplinas: 10/03 a 13/03.',
    data: '2026-03-10',
    horario: '10:00',
    isDefault: true
  },
  {
    id: 'default-inicio-aulas',
    titulo: 'Primeiro dia de aulas',
    tipo: 'AULA',
    materia: '',
    descricao: 'Começo oficial das aulas de graduação.',
    data: '2026-03-16',
    horario: '',
    isDefault: true
  },
  {
    id: 'default-trancamento',
    titulo: 'Prazo para trancamento parcial',
    tipo: 'PRAZO',
    materia: '',
    descricao: 'Período de trancamento parcial no SIGAA: 14/03 a 18/05.',
    data: '2026-03-14',
    horario: '',
    isDefault: true
  },
  {
    id: 'default-25',
    titulo: '25% do semestre',
    tipo: 'OUTRO',
    materia: '',
    descricao: 'Marco de 25% de realização do período letivo.',
    data: '2026-04-15',
    horario: '',
    isDefault: true
  },
  {
    id: 'default-sexta-santa',
    titulo: 'Sexta-feira Santa',
    tipo: 'FERIADO',
    materia: '',
    descricao: 'Feriado previsto no calendário universitário.',
    data: '2026-04-03',
    horario: '',
    isDefault: true
  },
  {
    id: 'default-ponto-0404',
    titulo: 'Ponto facultativo',
    tipo: 'OUTRO',
    materia: '',
    descricao: 'Ponto facultativo previsto no calendário universitário.',
    data: '2026-04-04',
    horario: '',
    isDefault: true
  },
  {
    id: 'default-ponto-2004',
    titulo: 'Ponto facultativo',
    tipo: 'OUTRO',
    materia: '',
    descricao: 'Ponto facultativo conforme Circ. 1/2026/MRT.',
    data: '2026-04-20',
    horario: '',
    isDefault: true
  },
  {
    id: 'default-tiradentes',
    titulo: 'Tiradentes',
    tipo: 'FERIADO',
    materia: '',
    descricao: 'Feriado nacional.',
    data: '2026-04-21',
    horario: '',
    isDefault: true
  },
  {
    id: 'default-dia-trabalho',
    titulo: 'Dia do Trabalho',
    tipo: 'FERIADO',
    materia: '',
    descricao: 'Feriado nacional.',
    data: '2026-05-01',
    horario: '',
    isDefault: true
  },
  {
    id: 'default-50',
    titulo: '50% do semestre',
    tipo: 'OUTRO',
    materia: '',
    descricao: 'Marco de 50% de realização do período letivo.',
    data: '2026-05-18',
    horario: '',
    isDefault: true
  },
  {
    id: 'default-corpus-christi',
    titulo: 'Corpus Christi',
    tipo: 'FERIADO',
    materia: '',
    descricao: 'Feriado previsto no calendário universitário.',
    data: '2026-06-04',
    horario: '',
    isDefault: true
  },
  {
    id: 'default-ponto-0506',
    titulo: 'Ponto facultativo',
    tipo: 'OUTRO',
    materia: '',
    descricao: 'Ponto facultativo conforme Circ. 1/2026/MRT.',
    data: '2026-06-05',
    horario: '',
    isDefault: true
  },
  {
    id: 'default-ponto-0606',
    titulo: 'Ponto facultativo',
    tipo: 'OUTRO',
    materia: '',
    descricao: 'Ponto facultativo previsto no calendário universitário.',
    data: '2026-06-06',
    horario: '',
    isDefault: true
  },
  {
    id: 'default-trancamento-geral',
    titulo: 'Fim do trancamento geral automático',
    tipo: 'PRAZO',
    materia: '',
    descricao: 'Último dia para trancamento geral automático.',
    data: '2026-06-19',
    horario: '',
    isDefault: true
  },
  {
    id: 'default-75',
    titulo: '75% do semestre',
    tipo: 'OUTRO',
    materia: '',
    descricao: 'Marco de 75% de realização do período letivo.',
    data: '2026-06-19',
    horario: '',
    isDefault: true
  },
  {
    id: 'default-ultimo-dia-aulas',
    titulo: 'Último dia de aulas',
    tipo: 'AULA',
    materia: '',
    descricao: 'Último dia de aulas do semestre.',
    data: '2026-07-18',
    horario: '',
    isDefault: true
  },
  {
    id: 'default-ultimo-dia-letivo',
    titulo: 'Último dia letivo',
    tipo: 'OUTRO',
    materia: '',
    descricao: 'Encerramento oficial do período letivo 2026.1.',
    data: '2026-07-23',
    horario: '',
    isDefault: true
  }
];

export const loadAcademicEvents = () => {
  const saved = getStorageValue(academicEventsStorageKey, []);
  const savedIds = new Set(saved.map((evento) => evento.id));
  const defaults = defaultAcademicEvents.filter((evento) => !savedIds.has(evento.id));

  return [...defaults, ...saved];
};

export const persistAcademicEvents = (eventos) => {
  setStorageValue(
    academicEventsStorageKey,
    eventos.filter((evento) => !evento.isDefault)
  );
  return eventos;
};

export const buildAcademicEvent = (evento) => ({
  ...evento,
  id: Date.now(),
  data: formatLocalDate(evento.data)
});

export const getEventsForDay = (eventos, date) =>
  eventos.filter((evento) => formatLocalDate(evento.data) === formatLocalDate(date));
