const weekdayMap = {
  DOM: 'SU',
  SEG: 'MO',
  TER: 'TU',
  QUA: 'WE',
  QUI: 'TH',
  SEX: 'FR',
  SAB: 'SA'
};

const padDate = (value) => String(value).padStart(2, '0');
const CALENDAR_TIMEZONE = 'America/Sao_Paulo';
const avaliacaoTypeLabelMap = {
  PROVA: 'Prova',
  TRABALHO: 'Entrega',
  OUTRO: 'Compromisso'
};

const formatICSDateTime = (date) => {
  const year = date.getFullYear();
  const month = padDate(date.getMonth() + 1);
  const day = padDate(date.getDate());
  const hours = padDate(date.getHours());
  const minutes = padDate(date.getMinutes());
  const seconds = padDate(date.getSeconds());
  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
};

const formatICSDateTimeUTC = (date) => {
  const year = date.getUTCFullYear();
  const month = padDate(date.getUTCMonth() + 1);
  const day = padDate(date.getUTCDate());
  const hours = padDate(date.getUTCHours());
  const minutes = padDate(date.getUTCMinutes());
  const seconds = padDate(date.getUTCSeconds());
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
};

const parseLocalDateTime = (dateValue, timeValue) => {
  const [year, month, day] = String(dateValue).split('-').map(Number);
  const [hours = 0, minutes = 0] = String(timeValue || '09:00').split(':').map(Number);
  return new Date(year, (month || 1) - 1, day || 1, hours, minutes, 0, 0);
};

const escapeICSValue = (value = '') =>
  String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');

const buildSingleEvent = ({ id, title, description, location, startDate, endDate, rule }) => [
  'BEGIN:VEVENT',
  `UID:${id}@faltai`,
  `DTSTAMP:${formatICSDateTimeUTC(new Date())}`,
  `SUMMARY:${escapeICSValue(title)}`,
  `DESCRIPTION:${escapeICSValue(description)}`,
  `LOCATION:${escapeICSValue(location)}`,
  `DTSTART;TZID=${CALENDAR_TIMEZONE}:${formatICSDateTime(startDate)}`,
  `DTEND;TZID=${CALENDAR_TIMEZONE}:${formatICSDateTime(endDate)}`,
  ...(rule ? [`RRULE:${rule}`] : []),
  'END:VEVENT'
].join('\n');

export const buildCalendarEvents = ({
  materias,
  academicEvents = [],
  turmas = [],
  syncMode = 'all'
}) => {
  const includeCommitments = syncMode === 'all' || syncMode === 'commitments';
  const includeClasses = syncMode === 'all' || syncMode === 'classes';

  const avaliacaoEvents = includeCommitments
    ? (materias || []).flatMap((materia) =>
        (materia.avaliacoes || []).map((avaliacao, index) => {
          const startDate = parseLocalDateTime(avaliacao.data, avaliacao.horario || '09:00');
          const endDate = new Date(startDate);
          endDate.setMinutes(endDate.getMinutes() + 90);

          return buildSingleEvent({
            id: `avaliacao-${materia.nome}-${index}-${avaliacao.data}`,
            title: `${avaliacaoTypeLabelMap[avaliacao.tipo] || 'Compromisso'} • ${materia.nome}`,
            description: avaliacao.descricao || 'Evento criado pelo Faltai',
            location: '',
            startDate,
            endDate
          });
        })
    )
    : [];

  const academicCalendarEvents = includeCommitments
    ? (academicEvents || []).map((evento) => {
        const [hours = '09', minutes = '00'] = (evento.horario || '09:00').split(':');
        const startDate = parseLocalDateTime(evento.data, `${hours}:${minutes}`);
        const endDate = new Date(startDate);
        endDate.setHours(startDate.getHours() + 1);

        return buildSingleEvent({
          id: `academico-${evento.id}`,
          title: evento.titulo,
          description: evento.descricao || 'Evento acadêmico criado pelo Faltai',
          location: evento.local || '',
          startDate,
          endDate
        });
      })
    : [];

  const turmaEvents = includeClasses
    ? (turmas || [])
    .filter((turma) => turma.dataInicio && turma.dataFim)
    .map((turma) => {
      const [startHour, startMinute] = (turma.inicio || '08:00').split(':');
      const [endHour, endMinute] = (turma.fim || '09:50').split(':');
      const startDate = parseLocalDateTime(turma.dataInicio, `${startHour}:${startMinute}`);
      const endDate = parseLocalDateTime(turma.dataInicio, `${endHour}:${endMinute}`);
      const until = parseLocalDateTime(turma.dataFim, '23:59');
      const untilDate = `${until.getFullYear()}${padDate(until.getMonth() + 1)}${padDate(until.getDate())}T235959`;

      return buildSingleEvent({
        id: `turma-${turma.id}`,
        title: `${turma.nome}${turma.codigo ? ` (${turma.codigo})` : ''}`,
        description: turma.observacoes || `Turma sincronizada pelo Faltai${turma.docente ? ` • ${turma.docente}` : ''}`,
        location: turma.local || '',
        startDate,
        endDate,
        rule: `FREQ=WEEKLY;BYDAY=${weekdayMap[turma.diaSemana] || 'MO'};UNTIL=${untilDate}`
      });
    })
    : [];

  return [...avaliacaoEvents, ...academicCalendarEvents, ...turmaEvents];
};

export const buildICSContent = (payload) => {
  const events = buildCalendarEvents(payload);

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Faltai//Calendario//PT-BR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VTIMEZONE',
    `TZID:${CALENDAR_TIMEZONE}`,
    'X-LIC-LOCATION:America/Sao_Paulo',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:-0300',
    'TZOFFSETTO:-0300',
    'TZNAME:-03',
    'DTSTART:19700101T000000',
    'END:STANDARD',
    'END:VTIMEZONE',
    ...events,
    'END:VCALENDAR'
  ].join('\n');
};

export const syncCalendarFile = async (payload) => {
  const ics = buildICSContent(payload);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const file = new File([blob], 'faltai-calendario.ics', { type: 'text/calendar' });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      title: 'Calendário do Faltai',
      text: 'Importe este calendário no seu celular',
      files: [file]
    });
    return 'shared';
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'faltai-calendario.ics';
  link.click();
  URL.revokeObjectURL(url);
  return 'downloaded';
};
