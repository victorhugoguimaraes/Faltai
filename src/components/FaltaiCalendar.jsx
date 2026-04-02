import React, { useMemo, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { FaCalendarAlt, FaClipboardCheck, FaPlus } from 'react-icons/fa';
import { useMaterias } from '../contexts/MateriasContext';
import { useError } from '../contexts/ErrorContext';
import BottomSheet from './layout/BottomSheet';
import { formatLocalDate, formatLocalDateLabel } from '../utils/dates';

const tipoLabelMap = {
  PROVA: 'Prova',
  TRABALHO: 'Trabalho',
  ENTREGA: 'Entrega',
  OUTRO: 'Compromisso'
};

function FaltaiCalendar({ selectedMateria, onClose }) {
  const { materias, atualizarFaltas, editarMateria } = useMaterias();
  const { addError, addSuccess } = useError();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [novoCompromisso, setNovoCompromisso] = useState({
    tipo: 'PROVA',
    horario: '',
    descricao: ''
  });

  const materia =
    typeof selectedMateria === 'number' && Array.isArray(materias) ? materias[selectedMateria] : null;

  const selectedDateStr = formatLocalDate(selectedDate);
  const eventosDoDia = useMemo(
    () =>
      ((materia?.avaliacoes) || [])
        .filter((avaliacao) => formatLocalDate(avaliacao.data) === selectedDateStr)
        .sort((a, b) => String(a.horario || '99:99').localeCompare(String(b.horario || '99:99'))),
    [materia?.avaliacoes, selectedDateStr]
  );
  const selectedDayHasFalta = materia?.datasFaltas?.includes(selectedDateStr);

  if (typeof selectedMateria !== 'number' || !Array.isArray(materias)) {
    return null;
  }

  if (!materia || typeof materia !== 'object') {
    return null;
  }

  const toggleFaltaForDate = async (dateStr) => {
    const datasFaltas = materia.datasFaltas || [];

    let novasFaltas;
    let novasDatasFaltas;

    if (datasFaltas.includes(dateStr)) {
      novasFaltas = materia.faltas - 1;
      novasDatasFaltas = datasFaltas.filter((item) => item !== dateStr);
      addSuccess('Falta removida com sucesso!');
    } else {
      if (materia.faltas >= materia.maxFaltas) {
        addError('Você já atingiu o limite máximo de faltas!');
        return;
      }

      novasFaltas = materia.faltas + 1;
      novasDatasFaltas = [...datasFaltas, dateStr];
      addSuccess('Falta adicionada com sucesso!');
    }

    try {
      await atualizarFaltas(selectedMateria, novasFaltas, novasDatasFaltas);
    } catch (error) {
      addError('Erro ao atualizar faltas');
    }
  };

  const adicionarCompromisso = async () => {
    if (!novoCompromisso.descricao.trim()) {
      addError('Informe o compromisso desse dia');
      return;
    }

    const materiaAtualizada = {
      ...materia,
      avaliacoes: [
        ...(materia.avaliacoes || []),
        {
          id: Date.now(),
          tipo: novoCompromisso.tipo,
          data: selectedDateStr,
          horario: novoCompromisso.horario,
          descricao: novoCompromisso.descricao.trim()
        }
      ]
    };

    try {
      await editarMateria(selectedMateria, materiaAtualizada);
      addSuccess('Compromisso adicionado com sucesso!');
      setNovoCompromisso({
        tipo: 'PROVA',
        horario: '',
        descricao: ''
      });
    } catch (error) {
      addError('Erro ao salvar compromisso');
    }
  };

  const removerCompromisso = async (id) => {
    const materiaAtualizada = {
      ...materia,
      avaliacoes: (materia.avaliacoes || []).filter((avaliacao) => avaliacao.id !== id)
    };

    try {
      await editarMateria(selectedMateria, materiaAtualizada);
      addSuccess('Compromisso removido com sucesso!');
    } catch (error) {
      addError('Erro ao remover compromisso');
    }
  };

  const tileClassName = ({ date }) => {
    const dateStr = formatLocalDate(date);
    const temFalta = materia.datasFaltas?.includes(dateStr);
    const temAvaliacao = materia.avaliacoes?.some((avaliacao) => formatLocalDate(avaliacao.data) === dateStr);

    if (temFalta) {
      return 'faltai-calendar__tile faltai-calendar__tile--falta';
    }

    if (temAvaliacao) {
      return 'faltai-calendar__tile faltai-calendar__tile--avaliacao';
    }

    return 'faltai-calendar__tile';
  };

  const tileContent = ({ date }) => {
    const dateStr = formatLocalDate(date);
    const temFalta = materia.datasFaltas?.includes(dateStr);
    const temAvaliacao = materia.avaliacoes?.some((avaliacao) => formatLocalDate(avaliacao.data) === dateStr);

    if (!temFalta && !temAvaliacao) {
      return null;
    }

    return (
      <div className="mt-1 flex justify-center gap-1">
        {temFalta ? <span className="h-1.5 w-1.5 rounded-full bg-emerald-700" /> : null}
        {temAvaliacao ? <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> : null}
      </div>
    );
  };

  return (
    <BottomSheet
      isOpen
      onClose={onClose}
      title={materia.nome || 'Calendário da matéria'}
      icon={<FaCalendarAlt className="text-lg sm:text-xl" />}
      className="sm:max-w-3xl"
      contentClassName="space-y-5 px-4 py-4 sm:px-6"
      mobileFullHeight
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Faltas</p>
          <strong className="mt-2 block font-display text-3xl text-slate-950">{materia.faltas}</strong>
        </div>
        <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Limite</p>
          <strong className="mt-2 block font-display text-3xl text-slate-950">{materia.maxFaltas}</strong>
        </div>
        <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Peso</p>
          <strong className="mt-2 block font-display text-3xl text-slate-950">{materia.pesoFalta || 1}</strong>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[1.75rem] border border-slate-100 bg-white p-4 shadow-soft sm:p-5">
          <Calendar
            onChange={setSelectedDate}
            onClickDay={setSelectedDate}
            tileClassName={tileClassName}
            tileContent={tileContent}
            className="faltai-calendar"
            locale="pt-BR"
            minDetail="month"
            maxDetail="month"
            showNeighboringMonth={false}
            calendarType="gregory"
            next2Label={null}
            prev2Label={null}
            value={selectedDate}
          />
        </div>

        <div className="space-y-4">
          <div className="rounded-[1.75rem] border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Dia selecionado</p>
            <h3 className="mt-2 font-display text-2xl font-bold text-slate-900">
              {formatLocalDateLabel(selectedDate, { day: '2-digit', month: 'long' })}
            </h3>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => toggleFaltaForDate(selectedDateStr)}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition-colors ${
                  selectedDayHasFalta
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-900 text-white'
                }`}
              >
                {selectedDayHasFalta ? 'Remover falta do dia' : 'Marcar falta no dia'}
              </button>
              <span className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-500">
                {eventosDoDia.length} compromisso{eventosDoDia.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-100 bg-white p-4 shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Compromissos da matéria</p>
                <h4 className="mt-2 text-lg font-semibold text-slate-900">No dia selecionado</h4>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {eventosDoDia.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                  Nenhum compromisso cadastrado para esse dia.
                </div>
              ) : (
                eventosDoDia.map((evento) => (
                  <div key={evento.id} className="rounded-2xl bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">
                          {evento.descricao || tipoLabelMap[evento.tipo] || 'Compromisso'}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {tipoLabelMap[evento.tipo] || 'Compromisso'}
                          {evento.horario ? ` • ${evento.horario}` : ''}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removerCompromisso(evento.id)}
                        className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-rose-600"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-100 bg-white p-4 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Adicionar compromisso</p>
            <div className="mt-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
                <select
                  value={novoCompromisso.tipo}
                  onChange={(event) =>
                    setNovoCompromisso((current) => ({ ...current, tipo: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm text-slate-700"
                >
                  <option value="PROVA">Prova</option>
                  <option value="TRABALHO">Trabalho</option>
                  <option value="ENTREGA">Entrega</option>
                  <option value="OUTRO">Compromisso</option>
                </select>
                <input
                  type="time"
                  value={novoCompromisso.horario}
                  onChange={(event) =>
                    setNovoCompromisso((current) => ({ ...current, horario: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm text-slate-700"
                />
              </div>

              <input
                type="text"
                value={novoCompromisso.descricao}
                onChange={(event) =>
                  setNovoCompromisso((current) => ({ ...current, descricao: event.target.value }))
                }
                className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm text-slate-700"
                placeholder="Ex: Apresentação do seminário"
              />

              <button type="button" onClick={adicionarCompromisso} className="btn-primary w-full justify-center">
                <FaPlus />
                Adicionar ao dia selecionado
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-700" />
          Falta marcada
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
          Prova ou entrega
        </span>
        <span className="inline-flex items-center gap-2">
          <FaClipboardCheck className="text-slate-400" />
          Selecione um dia para gerenciar faltas e compromissos
        </span>
      </div>
    </BottomSheet>
  );
}

export default FaltaiCalendar;
