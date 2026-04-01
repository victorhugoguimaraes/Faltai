import React, { useEffect, useMemo, useState } from 'react';
import Calendar from 'react-calendar';
import {
  FaBell,
  FaBook,
  FaCalendarAlt,
  FaClipboardCheck,
  FaGraduationCap,
  FaHourglassHalf
} from 'react-icons/fa';
import BottomSheet from './layout/BottomSheet';
import {
  academicEventTypes,
  buildAcademicEvent,
  getEventsForDay,
  loadAcademicEvents,
  persistAcademicEvents
} from '../features/calendar/lib/academicEvents';
import { formatLocalDate, formatLocalDateLabel, parseLocalDateValue } from '../utils/dates';

const eventIcons = {
  AULA: <FaBook className="text-sky-500" />,
  PROVA: <FaClipboardCheck className="text-rose-500" />,
  TRABALHO: <FaGraduationCap className="text-emerald-500" />,
  FERIADO: <FaCalendarAlt className="text-slate-500" />,
  PRAZO: <FaHourglassHalf className="text-amber-500" />,
  OUTRO: <FaBell className="text-fuchsia-500" />
};

const eventPriority = ['PROVA', 'PRAZO', 'TRABALHO', 'FERIADO', 'AULA', 'OUTRO'];

const eventTileClassByType = {
  AULA: 'faltai-calendar__tile--aula',
  PROVA: 'faltai-calendar__tile--prova',
  TRABALHO: 'faltai-calendar__tile--trabalho',
  FERIADO: 'faltai-calendar__tile--feriado',
  PRAZO: 'faltai-calendar__tile--prazo',
  OUTRO: 'faltai-calendar__tile--outro'
};

function CalendarioAcademico({ materias, onClose }) {
  const [eventos, setEventos] = useState(loadAcademicEvents);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [modalAberto, setModalAberto] = useState(false);
  const [novoEvento, setNovoEvento] = useState({
    titulo: '',
    tipo: 'AULA',
    materia: '',
    descricao: '',
    data: new Date(),
    horario: ''
  });

  useEffect(() => {
    persistAcademicEvents(eventos);
  }, [eventos]);

  const eventosSelecionados = useMemo(() => {
    return eventos
      .filter((evento) => formatLocalDate(evento.data) === formatLocalDate(selectedDate))
      .sort((a, b) => parseLocalDateValue(a.data) - parseLocalDateValue(b.data));
  }, [eventos, selectedDate]);

  const proximosMarcos = useMemo(() => {
    const today = formatLocalDate(new Date());

    return eventos
      .filter((evento) => formatLocalDate(evento.data) >= today)
      .sort((a, b) => parseLocalDateValue(a.data) - parseLocalDateValue(b.data))
      .slice(0, 5);
  }, [eventos]);

  const resumoSemestre = useMemo(() => {
    const totalPrazos = eventos.filter((evento) => evento.tipo === 'PRAZO').length;
    const totalAulas = eventos.filter((evento) => evento.tipo === 'AULA').length;
    const totalFeriados = eventos.filter((evento) => evento.tipo === 'FERIADO').length;

    return {
      totalPrazos,
      totalAulas,
      totalFeriados
    };
  }, [eventos]);

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setNovoEvento((current) => ({ ...current, data: date }));
  };

  const adicionarEvento = () => {
    if (!novoEvento.titulo.trim()) {
      return;
    }

    setEventos((current) => [...current, buildAcademicEvent(novoEvento)]);
    setModalAberto(false);
    setNovoEvento({
      titulo: '',
      tipo: 'AULA',
      materia: '',
      descricao: '',
      data: selectedDate,
      horario: ''
    });
  };

  const tileContent = ({ date }) => {
    const eventosNoDia = getEventsForDay(eventos, date);
    if (eventosNoDia.length === 0) {
      return null;
    }

    return (
      <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-1 pb-1">
        {eventosNoDia.slice(0, 3).map((evento) => (
          <div
            key={evento.id}
            className={`h-2 w-2 rounded-full ${academicEventTypes[evento.tipo]?.dotColor || 'bg-slate-300'}`}
          />
        ))}
      </div>
    );
  };

  const tileClassName = ({ date }) => {
    const classes = ['faltai-calendar__tile'];
    const eventosNoDia = getEventsForDay(eventos, date);

    if (eventosNoDia.length > 0) {
      const tiposDoDia = [...new Set(eventosNoDia.map((evento) => evento.tipo))];
      const tipoPrincipal =
        eventPriority.find((tipo) => tiposDoDia.includes(tipo)) || tiposDoDia[0];

      if (eventTileClassByType[tipoPrincipal]) {
        classes.push(eventTileClassByType[tipoPrincipal]);
      }
    }

    return classes.join(' ');
  };

  return (
    <>
      <BottomSheet
        isOpen
        onClose={onClose}
        title="Calendário Acadêmico"
        icon={<FaCalendarAlt className="text-lg sm:text-xl" />}
        className="sm:max-w-5xl"
        contentClassName="px-4 py-4 sm:px-6"
        mobileFullHeight
        headerActions={
          <button onClick={() => setModalAberto(true)} className="btn-primary px-3 py-2 text-sm">
            Novo Evento
          </button>
        }
      >
        <section className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Prazos</p>
              <strong className="mt-2 block font-display text-3xl text-slate-950">{resumoSemestre.totalPrazos}</strong>
            </div>
            <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Feriados</p>
              <strong className="mt-2 block font-display text-3xl text-slate-950">{resumoSemestre.totalFeriados}</strong>
            </div>
            <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Aulas</p>
              <strong className="mt-2 block font-display text-3xl text-slate-950">{resumoSemestre.totalAulas}</strong>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[1.75rem] border border-slate-100 bg-white p-4 shadow-soft sm:p-5">
              <div className="overflow-x-auto">
                <Calendar
                  onChange={setSelectedDate}
                  value={selectedDate}
                  onClickDay={handleDateClick}
                  tileContent={tileContent}
                  tileClassName={tileClassName}
                  className="faltai-calendar w-full min-w-[320px]"
                  locale="pt-BR"
                  next2Label={null}
                  prev2Label={null}
                  navigationLabel={({ date }) => {
                    const mes = date.toLocaleString('pt-BR', { month: 'long' });
                    const ano = date.toLocaleString('pt-BR', { year: 'numeric' });
                    return (
                      <div className="flex min-w-0 items-center justify-center gap-2" title={`${mes} ${ano}`}>
                        <span className="truncate text-sm font-semibold capitalize sm:text-base">{mes}</span>
                        <span className="shrink-0 text-sm font-semibold sm:text-base">{ano}</span>
                      </div>
                    );
                  }}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[1.75rem] border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Dia selecionado</p>
                <h3 className="mt-2 font-display text-2xl font-bold text-slate-900">
                  {formatLocalDateLabel(selectedDate, {
                    day: '2-digit',
                    month: 'long'
                  })}
                </h3>

                <div className="mt-4 space-y-3">
                  {eventosSelecionados.length === 0 ? (
                    <div className="rounded-2xl bg-white p-4 text-sm text-slate-500">
                      Nenhum evento relevante nesse recorte.
                    </div>
                  ) : (
                    eventosSelecionados.map((evento) => (
                      <div key={evento.id} className="rounded-2xl bg-white p-4 shadow-sm">
                        <div className="mb-2 flex items-center gap-2">
                          {eventIcons[evento.tipo]}
                          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                            {academicEventTypes[evento.tipo]?.nome || 'Evento'}
                          </span>
                        </div>
                        <p className="font-semibold text-slate-900">{evento.titulo}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          {formatLocalDateLabel(evento.data)}
                          {evento.horario ? ` às ${evento.horario}` : ''}
                          {evento.materia ? ` • ${evento.materia}` : ''}
                        </p>
                        {evento.descricao && (
                          <p className="mt-2 text-sm leading-6 text-slate-500">{evento.descricao}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-slate-100 bg-white p-4 shadow-soft">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Legenda</p>
                <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                  A cor do dia mostra o evento mais importante daquele bloco. Os pontos abaixo do numero mostram ate
                  3 tipos de evento no mesmo dia.
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {Object.entries(academicEventTypes).map(([key, type]) => (
                    <div key={key} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                      <div className="flex items-center gap-3">
                        <span className={`h-3 w-3 rounded-full ${type.dotColor || 'bg-slate-300'}`} />
                        <div>{eventIcons[key]}</div>
                      </div>
                      <span className="text-sm font-medium text-slate-700">{type.nome}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-slate-100 bg-white p-4 shadow-soft">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Próximos marcos</p>
                <div className="mt-4 space-y-3">
                  {proximosMarcos.map((evento) => (
                    <div key={evento.id} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3">
                      <div className="mt-0.5">{eventIcons[evento.tipo]}</div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{evento.titulo}</p>
                        <p className="text-sm text-slate-600">{formatLocalDateLabel(evento.data)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </BottomSheet>

      <BottomSheet
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        title="Novo Evento"
        className="sm:max-w-md"
        contentClassName="space-y-4 p-4 sm:p-6"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Título</label>
          <input
            type="text"
            value={novoEvento.titulo}
            onChange={(event) => setNovoEvento((current) => ({ ...current, titulo: event.target.value }))}
            className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"
            placeholder="Nome do evento"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Tipo</label>
          <select
            value={novoEvento.tipo}
            onChange={(event) => setNovoEvento((current) => ({ ...current, tipo: event.target.value }))}
            className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"
          >
            {Object.entries(academicEventTypes).map(([key, type]) => (
              <option key={key} value={key}>
                {type.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Matéria</label>
          <select
            value={novoEvento.materia}
            onChange={(event) => setNovoEvento((current) => ({ ...current, materia: event.target.value }))}
            className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"
          >
            <option value="">Selecione uma matéria</option>
            {materias.map((materia, index) => (
              <option key={`${materia.nome}-${index}`} value={materia.nome}>
                {materia.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Data</label>
            <input
              type="date"
              value={formatLocalDate(novoEvento.data)}
              onChange={(event) =>
                setNovoEvento((current) => ({ ...current, data: new Date(`${event.target.value}T00:00:00`) }))
              }
              className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Horário</label>
            <input
              type="time"
              value={novoEvento.horario}
              onChange={(event) => setNovoEvento((current) => ({ ...current, horario: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Descrição</label>
          <textarea
            value={novoEvento.descricao}
            onChange={(event) => setNovoEvento((current) => ({ ...current, descricao: event.target.value }))}
            className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"
            rows="3"
            placeholder="Detalhes do evento"
          />
        </div>

        <button onClick={adicionarEvento} className="btn-primary w-full justify-center">
          Adicionar Evento
        </button>
      </BottomSheet>
    </>
  );
}

export default CalendarioAcademico;
