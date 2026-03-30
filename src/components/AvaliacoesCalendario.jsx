import React, { useEffect, useMemo, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { FaCalendarAlt, FaClipboardCheck, FaBook } from 'react-icons/fa';
import BottomSheet from './layout/BottomSheet';
import { formatLocalDate, formatLocalDateLabel, parseLocalDateValue } from '../utils/dates';

function AvaliacoesCalendario({ materias, onClose }) {
  const [avaliacoes, setAvaliacoes] = useState(() => {
    const saved = localStorage.getItem('avaliacoes');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [modalAberto, setModalAberto] = useState(false);
  const [novaAvaliacao, setNovaAvaliacao] = useState({
    tipo: 'PROVA',
    materia: '',
    data: new Date(),
    descricao: ''
  });

  useEffect(() => {
    localStorage.setItem('avaliacoes', JSON.stringify(avaliacoes));
  }, [avaliacoes]);

  const avaliacoesOrdenadas = useMemo(() => {
    return [...avaliacoes].sort((a, b) => parseLocalDateValue(a.data) - parseLocalDateValue(b.data));
  }, [avaliacoes]);

  const avaliacoesDoDia = useMemo(() => {
    const selected = formatLocalDate(selectedDate);
    return avaliacoesOrdenadas.filter((avaliacao) => formatLocalDate(avaliacao.data) === selected);
  }, [avaliacoesOrdenadas, selectedDate]);

  const adicionarAvaliacao = () => {
    if (!novaAvaliacao.materia) {
      return;
    }

    setAvaliacoes((current) => [
      ...current,
      {
        ...novaAvaliacao,
        id: Date.now(),
        data: formatLocalDate(novaAvaliacao.data)
      }
    ]);

    setModalAberto(false);
    setNovaAvaliacao({
      tipo: 'PROVA',
      materia: '',
      data: selectedDate,
      descricao: ''
    });
  };

  const removerAvaliacao = (id) => {
    setAvaliacoes((current) => current.filter((avaliacao) => avaliacao.id !== id));
  };

  const getAvaliacoesDoDia = (date) => {
    const currentDate = formatLocalDate(date);
    return avaliacoes.filter((avaliacao) => formatLocalDate(avaliacao.data) === currentDate);
  };

  const tileContent = ({ date }) => {
    const eventos = getAvaliacoesDoDia(date);
    if (eventos.length === 0) {
      return null;
    }

    return (
      <div className="mt-1 flex justify-center gap-1">
        {eventos.slice(0, 3).map((avaliacao) => (
          <span
            key={avaliacao.id}
            className={`h-1.5 w-1.5 rounded-full ${
              avaliacao.tipo === 'PROVA' ? 'bg-rose-500' : 'bg-sky-600'
            }`}
          />
        ))}
      </div>
    );
  };

  const tileClassName = ({ date }) => {
    if (getAvaliacoesDoDia(date).length > 0) {
      return 'faltai-calendar__tile faltai-calendar__tile--avaliacao';
    }

    return 'faltai-calendar__tile';
  };

  return (
    <>
      <BottomSheet
        isOpen
        onClose={onClose}
        title="Provas e Trabalhos"
        icon={<FaCalendarAlt className="text-lg sm:text-xl" />}
        className="sm:max-w-5xl"
        contentClassName="space-y-5 px-4 py-4 sm:px-6"
        mobileFullHeight
        headerActions={
          <button onClick={() => setModalAberto(true)} className="btn-primary px-3 py-2 text-sm">
            Adicionar
          </button>
        }
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Avaliações</p>
            <strong className="mt-2 block font-display text-3xl text-slate-950">{avaliacoes.length}</strong>
          </div>
          <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">No dia</p>
            <strong className="mt-2 block font-display text-3xl text-slate-950">{avaliacoesDoDia.length}</strong>
          </div>
          <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Próxima data</p>
            <strong className="mt-2 block text-sm font-semibold text-slate-950">
              {avaliacoesOrdenadas[0] ? formatLocalDateLabel(avaliacoesOrdenadas[0].data) : 'Sem eventos'}
            </strong>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[1.75rem] border border-slate-100 bg-white p-4 shadow-soft sm:p-5">
            <Calendar
              value={selectedDate}
              onChange={setSelectedDate}
              onClickDay={(date) => {
                setSelectedDate(date);
                setNovaAvaliacao((current) => ({ ...current, data: date }));
              }}
              tileContent={tileContent}
              tileClassName={tileClassName}
              className="faltai-calendar"
              locale="pt-BR"
              next2Label={null}
              prev2Label={null}
            />
          </div>

          <div className="rounded-[1.75rem] border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Agenda de avaliações</p>
            <h3 className="mt-2 font-display text-2xl font-bold text-slate-900">
              {selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
            </h3>

            <div className="mt-4 space-y-3">
              {avaliacoesOrdenadas.length === 0 ? (
                <div className="rounded-2xl bg-white p-4 text-sm text-slate-500">
                  Nenhuma prova ou entrega cadastrada ainda.
                </div>
              ) : (
                avaliacoesOrdenadas.map((avaliacao) => (
                  <div
                    key={avaliacao.id}
                    className={`rounded-2xl border p-4 shadow-sm ${
                      formatLocalDate(avaliacao.data) === formatLocalDate(selectedDate)
                        ? 'border-sky-200 bg-white'
                        : 'border-transparent bg-white/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {avaliacao.tipo === 'PROVA' ? (
                            <FaClipboardCheck className="shrink-0 text-rose-500" />
                          ) : (
                            <FaBook className="shrink-0 text-sky-600" />
                          )}
                          <span className="truncate text-sm font-semibold text-slate-900">{avaliacao.materia}</span>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">
                          {avaliacao.tipo === 'PROVA' ? 'Prova' : 'Trabalho'} em{' '}
                          {formatLocalDateLabel(avaliacao.data)}
                        </p>
                        {avaliacao.descricao ? (
                          <p className="mt-2 text-sm text-slate-500">{avaliacao.descricao}</p>
                        ) : null}
                      </div>
                      <button
                        onClick={() => removerAvaliacao(avaliacao.id)}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-rose-600"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </BottomSheet>

      <BottomSheet
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        title="Nova Avaliação"
        className="sm:max-w-md"
        contentClassName="space-y-4 p-4 sm:p-6"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Tipo</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setNovaAvaliacao((current) => ({ ...current, tipo: 'PROVA' }))}
              className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                novaAvaliacao.tipo === 'PROVA'
                  ? 'border-rose-200 bg-rose-50 text-rose-700'
                  : 'border-slate-200 bg-white text-slate-600'
              }`}
            >
              Prova
            </button>
            <button
              type="button"
              onClick={() => setNovaAvaliacao((current) => ({ ...current, tipo: 'TRABALHO' }))}
              className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                novaAvaliacao.tipo === 'TRABALHO'
                  ? 'border-sky-200 bg-sky-50 text-sky-700'
                  : 'border-slate-200 bg-white text-slate-600'
              }`}
            >
              Trabalho
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Matéria</label>
          <select
            value={novaAvaliacao.materia}
            onChange={(event) => setNovaAvaliacao((current) => ({ ...current, materia: event.target.value }))}
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

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Data</label>
          <input
            type="date"
            value={formatLocalDate(novaAvaliacao.data)}
            onChange={(event) =>
              setNovaAvaliacao((current) => ({ ...current, data: new Date(`${event.target.value}T00:00:00`) }))
            }
            className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Descrição</label>
          <textarea
            value={novaAvaliacao.descricao}
            onChange={(event) => setNovaAvaliacao((current) => ({ ...current, descricao: event.target.value }))}
            className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"
            rows="3"
            placeholder="Ex: capítulos, formato da entrega, observações"
          />
        </div>

        <button onClick={adicionarAvaliacao} className="btn-primary w-full justify-center">
          Salvar avaliação
        </button>
      </BottomSheet>
    </>
  );
}

export default AvaliacoesCalendario;
