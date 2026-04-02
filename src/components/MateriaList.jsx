import React, { useEffect, useState } from 'react';
import { FaCalendarAlt, FaEdit, FaMinus, FaPlus, FaTrash } from 'react-icons/fa';
import { useMaterias } from '../contexts/MateriasContext';
import { useError } from '../contexts/ErrorContext';
import FaltaiCalendar from './FaltaiCalendar';
import { formatLocalDate } from '../utils/dates';
import { loadTurmas, subscribeToTurmas } from '../features/schedule/lib/turmasStorage';

const weekdayOrder = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];

function MateriaList({
  setEditModalOpen,
  setDeleteModalOpen,
  setEditIndex,
  setMateriaToDelete,
  onCalendarOverlayChange = () => {}
}) {
  const { materias, atualizarFaltas } = useMaterias();
  const { addError } = useError();
  const [selectedMateria, setSelectedMateria] = useState(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [turmas, setTurmas] = useState(() => loadTurmas());

  useEffect(() => () => onCalendarOverlayChange(false), [onCalendarOverlayChange]);

  useEffect(() => {
    setTurmas(loadTurmas());
    return subscribeToTurmas(setTurmas);
  }, []);

  const handleFaltaChange = async (index, delta) => {
    const materia = materias[index];
    const novasFaltas = materia.faltas + delta;

    if (novasFaltas < 0) {
      return;
    }

    if (novasFaltas > materia.maxFaltas) {
      addError('Numero maximo de faltas atingido!');
      return;
    }

    const hoje = formatLocalDate(new Date());
    const novasDatasFaltas = [...(materia.datasFaltas || [])];

    if (delta > 0) {
      for (let current = 0; current < delta; current += 1) {
        novasDatasFaltas.push(hoje);
      }
    } else if (delta < 0 && novasDatasFaltas.length > 0) {
      novasDatasFaltas.pop();
    }

    try {
      await atualizarFaltas(index, novasFaltas, novasDatasFaltas);
    } catch (error) {
      addError('Erro ao atualizar faltas');
    }
  };

  const handleEdit = (index) => {
    setEditIndex(index);
    setEditModalOpen(true);
  };

  const handleDelete = (index) => {
    setMateriaToDelete(index);
    setDeleteModalOpen(true);
  };

  const openCalendar = (materia) => {
    setSelectedMateria(materias.findIndex((currentMateria) => currentMateria === materia));
    setCalendarOpen(true);
    onCalendarOverlayChange(true);
  };

  const closeCalendar = () => {
    setCalendarOpen(false);
    onCalendarOverlayChange(false);
  };

  if (materias.length === 0) {
    return (
      <div id="materias-list" className="py-8 text-center">
        <p className="text-neutral-600">Nenhuma materia cadastrada</p>
        <p className="mt-2 text-sm text-neutral-500">Adicione uma materia para comecar.</p>
      </div>
    );
  }

  const sortedTurmas = turmas
    .slice()
    .sort((a, b) => {
      const dayDiff = weekdayOrder.indexOf(a.diaSemana) - weekdayOrder.indexOf(b.diaSemana);

      if (dayDiff !== 0) {
        return dayDiff;
      }

      return String(a.inicio).localeCompare(String(b.inicio));
    });

  return (
    <div id="materias-list" className="space-y-4 pb-28 sm:space-y-5 sm:pb-10">
      {sortedTurmas.length > 0 && (
        <section
          id="grade-semanal"
          className="rounded-[1.6rem] border border-white/80 bg-white/88 p-4 shadow-soft backdrop-blur-xl sm:rounded-[1.75rem] sm:p-6"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Grade semanal</p>
              <h2 className="mt-2 font-display text-xl font-bold text-slate-950 sm:text-2xl">Sua semana montada</h2>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {sortedTurmas.length} aula{sortedTurmas.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            {weekdayOrder.map((day) => {
              const dayTurmas = sortedTurmas.filter((turma) => turma.diaSemana === day);

              return (
                <div key={day} className="rounded-[1.35rem] border border-slate-100 bg-slate-50/90 p-4 sm:rounded-[1.5rem]">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-600">{day}</p>
                    <span className="text-xs font-medium text-slate-400">{dayTurmas.length}</span>
                  </div>

                  <div className="space-y-3">
                    {dayTurmas.length === 0 ? (
                      <p className="text-sm text-slate-400">Sem aulas.</p>
                    ) : (
                      dayTurmas.map((turma) => (
                        <div key={turma.id} className="rounded-2xl bg-white p-3 shadow-sm">
                          <p className="text-sm font-semibold text-slate-900">{turma.nome}</p>
                          <p className="mt-1 text-sm font-medium text-slate-600">
                            {turma.inicio} - {turma.fim}
                          </p>
                          {turma.local ? (
                            <p className="mt-1 text-xs leading-5 text-slate-500">{turma.local}</p>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {materias.map((materia, index) => {
        const porcentagemFaltas = ((materia.faltas / materia.maxFaltas) * 100).toFixed(0);

        const getBarColor = (percentage) => {
          if (percentage <= 40) return 'bg-green-500';
          if (percentage <= 60) return 'bg-lime-500';
          if (percentage <= 75) return 'bg-yellow-500';
          if (percentage <= 90) return 'bg-orange-500';
          return 'bg-red-500';
        };

        const getBarBgColor = (percentage) => {
          if (percentage <= 40) return 'bg-green-100';
          if (percentage <= 60) return 'bg-lime-100';
          if (percentage <= 75) return 'bg-yellow-100';
          if (percentage <= 90) return 'bg-orange-100';
          return 'bg-red-100';
        };

        const getTextColor = (percentage) => {
          if (percentage <= 40) return 'text-green-700';
          if (percentage <= 60) return 'text-lime-700';
          if (percentage <= 75) return 'text-yellow-700';
          if (percentage <= 90) return 'text-orange-700';
          return 'text-red-700';
        };

        const barColor = getBarColor(porcentagemFaltas);
        const barBgColor = getBarBgColor(porcentagemFaltas);
        const textColor = getTextColor(porcentagemFaltas);

        return (
          <div
            key={materia.id || index}
            className="rounded-[1.6rem] border border-white/80 bg-white/88 p-4 shadow-soft backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-medium sm:rounded-[1.75rem] sm:p-6"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${textColor} ${barBgColor}`}>
                    {porcentagemFaltas}% usado
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                    {materia.horas}h
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-neutral-800 sm:text-xl">{materia.nome}</h3>
                <p className="text-sm text-neutral-600">
                  {materia.faltas}/{materia.maxFaltas} faltas utilizadas
                </p>

                {(materia.horarioResumo?.length > 0 || materia.local) && (
                  <div className="mt-3 space-y-2">
                    {materia.horarioResumo?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {materia.horarioResumo.slice(0, 2).map((horario) => (
                          <span
                            key={horario}
                            className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600"
                          >
                            {horario}
                          </span>
                        ))}
                      </div>
                    )}

                    {materia.local && (
                      <p className="text-xs font-medium text-slate-500">Local: {materia.local}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="ml-2 flex gap-1.5 sm:gap-2">
                <button
                  onClick={() => openCalendar(materia)}
                  className="rounded-xl border border-sky-100 bg-sky-50 p-2.5 text-primary-600 transition-colors hover:bg-primary-100"
                  title="Ver calendario"
                >
                  <FaCalendarAlt size={13} className="sm:h-4 sm:w-4" />
                </button>
                <button
                  onClick={() => handleEdit(index)}
                  className="rounded-xl border border-amber-100 bg-amber-50 p-2.5 text-warning-600 transition-colors hover:bg-amber-100"
                  title="Editar"
                >
                  <FaEdit size={13} className="sm:h-4 sm:w-4" />
                </button>
                <button
                  onClick={() => handleDelete(index)}
                  className="rounded-xl border border-rose-100 bg-rose-50 p-2.5 text-danger-600 transition-colors hover:bg-rose-100"
                  title="Excluir"
                >
                  <FaTrash size={13} className="sm:h-4 sm:w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className={`h-2.5 overflow-hidden rounded-full ${barBgColor} transition-colors duration-300`}>
                <div
                  className={`h-full rounded-full ${barColor} transition-all duration-300`}
                  style={{ width: `${porcentagemFaltas}%` }}
                />
              </div>

              <div className="flex justify-end">
                <div className="flex items-center gap-3 self-end rounded-[1.25rem] bg-slate-50 px-2.5 py-2 sm:self-auto">
                  <button
                    onClick={() => handleFaltaChange(index, -1)}
                    disabled={materia.faltas <= 0}
                    className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                    title="Diminuir faltas"
                  >
                    <FaMinus size={11} className="sm:h-3.5 sm:w-3.5" />
                  </button>
                  <button
                    onClick={() => handleFaltaChange(index, 1)}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white transition-colors hover:bg-slate-800"
                    title="Adicionar falta"
                  >
                    <FaPlus size={12} className="sm:h-4 sm:w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {calendarOpen && selectedMateria !== null && (
        <FaltaiCalendar
          selectedMateria={selectedMateria}
          onClose={closeCalendar}
        />
      )}
    </div>
  );
}

export default MateriaList;
