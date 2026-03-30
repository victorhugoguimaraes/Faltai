import React, { useEffect, useMemo, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import {
  FaBook,
  FaChevronLeft,
  FaClipboardCheck,
  FaPlus,
  FaSearch,
  FaTimes,
  FaUniversity
} from 'react-icons/fa';
import { useMaterias } from '../contexts/MateriasContext';
import { useError } from '../contexts/ErrorContext';
import { calculateMaxFaltas, sanitizeMateria, validateMateria } from '../utils/validation';
import { fetchUnbClasses, fetchUnbDepartments } from '../features/schedule/lib/unbApi';
import { createTurma, loadTurmas, saveTurmas } from '../features/schedule/lib/turmasStorage';

const currentYear = new Date().getFullYear();
const availableTerms = [
  { value: `${currentYear}-1`, label: `${String(currentYear).slice(-2)}/1` },
  { value: `${currentYear}-2`, label: `${String(currentYear).slice(-2)}/2` }
];

function AddMateriaModal({ setModalOpen }) {
  const { adicionarMateria } = useMaterias();
  const { addError, addSuccess } = useError();

  const [mode, setMode] = useState('unb');

  const [nome, setNome] = useState('');
  const [horas, setHoras] = useState('');
  const [pesoFalta, setPesoFalta] = useState('1');
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [novaAvaliacao, setNovaAvaliacao] = useState({
    tipo: '',
    data: '',
    descricao: ''
  });
  const [mostrarAvaliacoes, setMostrarAvaliacoes] = useState(false);
  const [mostrarCalendario, setMostrarCalendario] = useState(false);

  const [departments, setDepartments] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingTurmas, setLoadingTurmas] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedTerm, setSelectedTerm] = useState(`${currentYear}-1`);
  const [searchTerm, setSearchTerm] = useState('');
  const [disciplineResults, setDisciplineResults] = useState([]);
  const [selectedDisciplineCode, setSelectedDisciplineCode] = useState('');
  const [hasSearchedUnb, setHasSearchedUnb] = useState(false);
  const [unbHelpMessage, setUnbHelpMessage] = useState('');

  useEffect(() => {
    if (mode !== 'unb' || departments.length > 0) {
      return;
    }

    const loadDepartments = async () => {
      try {
        setLoadingDepartments(true);
        setUnbHelpMessage('');
        const nextDepartments = await fetchUnbDepartments();
        setDepartments(nextDepartments);
      } catch (error) {
        setUnbHelpMessage(error.message || 'Não foi possível carregar as unidades da UnB.');
        addError(error.message || 'Não foi possível carregar as unidades da UnB.');
      } finally {
        setLoadingDepartments(false);
      }
    };

    loadDepartments();
  }, [mode, departments.length, addError]);

  useEffect(() => {
    if (mode !== 'unb' || !selectedDepartment) {
      return;
    }

    if (searchTerm.trim().length < 2) {
      setDisciplineResults([]);
      setSelectedDisciplineCode('');
      return;
    }

    const timeoutId = window.setTimeout(() => {
      searchUnbClasses();
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [mode, selectedDepartment, selectedTerm, searchTerm]);

  const selectedDepartmentName = useMemo(() => {
    return departments.find((department) => department.id === selectedDepartment)?.name || '';
  }, [departments, selectedDepartment]);

  const selectedDiscipline = useMemo(() => {
    return disciplineResults.find((discipline) => discipline.code === selectedDisciplineCode) || null;
  }, [disciplineResults, selectedDisciplineCode]);

  const { selectedYear, selectedPeriod } = useMemo(() => {
    const [year = String(currentYear), period = '1'] = selectedTerm.split('-');
    return {
      selectedYear: year,
      selectedPeriod: period
    };
  }, [selectedTerm]);

  const persistTurmaFromUnb = (discipline, turma) => {
    const currentTurmas = loadTurmas();
    const mappedTurmas = turma.scheduleMeetings.map((meeting, index) =>
      createTurma({
        id: `${discipline.code}-${turma.classCode}-${meeting.dayValue}-${index}`,
        nome: `${discipline.code} - ${discipline.name}`,
        codigo: turma.classCode,
        docente: turma.teachers.join(', '),
        local: turma.classroom,
        diaSemana: {
          '2': 'SEG',
          '3': 'TER',
          '4': 'QUA',
          '5': 'QUI',
          '6': 'SEX',
          '7': 'SAB'
        }[meeting.dayValue] || 'SEG',
        inicio: meeting.startTime,
        fim: meeting.endTime,
        dataInicio: turma.startDate,
        dataFim: turma.endDate,
        observacoes: `Turma ${turma.classCode} • ${selectedDepartmentName}`
      })
    );

    saveTurmas([...currentTurmas, ...mappedTurmas]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!nome || !horas) {
      addError('Nome e carga horária são obrigatórios');
      return;
    }

    const formData = { nome, horas, pesoFalta };
    const validation = validateMateria(formData);

    if (!validation.isValid) {
      const errors = Object.values(validation.errors).join(', ');
      addError(`Erro: ${errors}`);
      return;
    }

    try {
      const maxFaltas = calculateMaxFaltas(horas, pesoFalta);
      const novaMateria = {
        nome: nome.trim(),
        horas: parseInt(horas, 10),
        pesoFalta: parseInt(pesoFalta, 10),
        maxFaltas,
        faltas: 0,
        datasFaltas: [],
        avaliacoes
      };

      await adicionarMateria(sanitizeMateria(novaMateria));
      addSuccess('Matéria adicionada com sucesso!');
      setModalOpen(false);
    } catch (error) {
      addError('Erro ao adicionar matéria');
    }
  };

  const adicionarAvaliacao = () => {
    if (!novaAvaliacao.tipo || !novaAvaliacao.data) {
      addError('Tipo e data são obrigatórios para a avaliação');
      return;
    }

    setAvaliacoes((current) => [...current, { ...novaAvaliacao, id: Date.now() }]);
    setNovaAvaliacao({
      tipo: '',
      data: '',
      descricao: ''
    });
    addSuccess('Avaliação adicionada!');
  };

  const removerAvaliacao = (id) => {
    setAvaliacoes((current) => current.filter((avaliacao) => avaliacao.id !== id));
  };

  const searchUnbClasses = async () => {
    if (!selectedDepartment) {
      addError('Selecione uma unidade da UnB antes de buscar.');
      return;
    }

    try {
      setLoadingTurmas(true);
      setHasSearchedUnb(true);
      setSelectedDisciplineCode('');
      setUnbHelpMessage('');
      const results = await fetchUnbClasses({
        department: selectedDepartment,
        year: selectedYear,
        period: selectedPeriod,
        query: searchTerm
      });
      setDisciplineResults(results);
      if (results.length === 1) {
        setSelectedDisciplineCode(results[0].code);
      }
    } catch (error) {
      setUnbHelpMessage(error.message || 'Não foi possível buscar as turmas da UnB.');
      addError(error.message || 'Não foi possível buscar as turmas da UnB.');
    } finally {
      setLoadingTurmas(false);
    }
  };

  const importUnbClass = async (discipline, turma) => {
    try {
      const importedMateria = sanitizeMateria({
        nome: `${discipline.code} - ${discipline.name}`,
        horas: turma.workloadHours || 60,
        pesoFalta: turma.absenceWeight || 1,
        faltas: 0,
        avaliacoes: [],
        datasFaltas: [],
        local: turma.classroom || '',
        horarioResumo: turma.scheduleText || [],
        turmaUnb: {
          departmentId: selectedDepartment,
          departmentName: selectedDepartmentName,
          classCode: turma.classCode,
          code: discipline.code,
          scheduleCode: turma.scheduleCode,
          scheduleText: turma.scheduleText,
          teachers: turma.teachers,
          classroom: turma.classroom
        }
      });

      await adicionarMateria(importedMateria);
      persistTurmaFromUnb(discipline, turma);
      addSuccess(`Turma ${turma.classCode} adicionada com horário traduzido.`);
      setModalOpen(false);
    } catch (error) {
      addError('Não foi possível importar a turma selecionada.');
    }
  };

  return (
    <div className="fixed inset-0 z-[10020] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4">
      <div className="h-[92vh] w-full overflow-y-auto rounded-t-[2rem] bg-white shadow-2xl sm:h-auto sm:max-h-[90vh] sm:max-w-4xl sm:rounded-[2rem]">
        <div className="sticky top-0 z-20 border-b bg-white">
          <div className="flex justify-center pb-1 pt-2 sm:hidden">
            <div className="h-1.5 w-12 rounded-full bg-gray-300" />
          </div>
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div>
              <h2 className="text-base font-semibold text-gray-800 sm:text-xl">Nova Matéria</h2>
              <p className="text-xs text-gray-500 sm:text-sm">Busque, escolha a turma e adicione</p>
            </div>
            <button
              onClick={() => setModalOpen(false)}
              className="rounded-lg p-2 text-gray-500 hover:text-gray-700"
              aria-label="Fechar"
            >
              <FaTimes />
            </button>
          </div>
          <div className="flex gap-2 px-4 pb-4 sm:px-6">
            <button
              type="button"
              onClick={() => setMode('unb')}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                mode === 'unb' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-800'
              }`}
            >
              Importar da UnB
            </button>
            <button
              type="button"
              onClick={() => setMode('manual')}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                mode === 'manual' ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              Manual
            </button>
          </div>
        </div>

        {mode === 'manual' && (
          <form onSubmit={handleSubmit} className="space-y-4 px-4 py-4 sm:px-6">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Nome da Matéria</label>
              <input
                type="text"
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="Ex: Cálculo 1"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Carga Horária</label>
              <select
                value={horas}
                onChange={(event) => setHoras(event.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
                required
              >
                <option value="">Selecione</option>
                <option value="30">30 horas</option>
                <option value="45">45 horas</option>
                <option value="60">60 horas</option>
                <option value="75">75 horas</option>
                <option value="90">90 horas</option>
                <option value="120">120 horas</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Peso da Falta</label>
              <select
                value={pesoFalta}
                onChange={(event) => setPesoFalta(event.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="1">1 falta por vez</option>
                <option value="2">2 faltas por vez</option>
                <option value="4">4 faltas por vez</option>
              </select>
            </div>

            <div className="border-t pt-4">
              <button
                type="button"
                onClick={() => setMostrarAvaliacoes(!mostrarAvaliacoes)}
                className="flex items-center text-sm text-blue-600 hover:text-blue-700"
              >
                <FaPlus className="mr-1" /> {mostrarAvaliacoes ? 'Ocultar Avaliações' : 'Adicionar Avaliações'}
              </button>
            </div>

            {mostrarAvaliacoes && (
              <>
                <div className="mb-4 space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      type="text"
                      value={novaAvaliacao.tipo}
                      onChange={(event) => setNovaAvaliacao((current) => ({ ...current, tipo: event.target.value }))}
                      className="min-w-0 w-full rounded-md border px-3 py-2 text-sm sm:flex-1"
                      placeholder="Tipo (ex: Prova, Trabalho, Seminário)"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarCalendario(!mostrarCalendario)}
                      className="w-full rounded-md border px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50 sm:w-[180px]"
                    >
                      {novaAvaliacao.data
                        ? new Date(`${novaAvaliacao.data}T00:00:00`).toLocaleDateString('pt-BR')
                        : 'Selecionar data'}
                    </button>
                  </div>

                  {mostrarCalendario && (
                    <div className="rounded-lg border bg-gray-50 p-3">
                      <Calendar
                        onChange={(date) => {
                          setNovaAvaliacao((current) => ({
                            ...current,
                            data: date.toISOString().split('T')[0]
                          }));
                          setMostrarCalendario(false);
                        }}
                        value={novaAvaliacao.data ? new Date(`${novaAvaliacao.data}T00:00:00`) : new Date()}
                        locale="pt-BR"
                        minDetail="month"
                        next2Label={null}
                        prev2Label={null}
                        navigationLabel={({ date }) => {
                          const mes = date.toLocaleString('pt-BR', { month: 'long' });
                          const ano = date.toLocaleString('pt-BR', { year: 'numeric' });
                          return (
                            <div className="flex min-w-0 items-center justify-center gap-2" title={`${mes} ${ano}`}>
                              <span className="truncate text-sm font-semibold capitalize">{mes}</span>
                              <span className="shrink-0 text-sm font-semibold">{ano}</span>
                            </div>
                          );
                        }}
                        className="w-full border-none"
                      />
                    </div>
                  )}

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      type="text"
                      value={novaAvaliacao.descricao}
                      onChange={(event) =>
                        setNovaAvaliacao((current) => ({ ...current, descricao: event.target.value }))
                      }
                      className="min-w-0 w-full rounded-md border px-3 py-2 text-sm sm:flex-1"
                      placeholder="Descrição (opcional)"
                    />
                    <button
                      type="button"
                      onClick={adicionarAvaliacao}
                      className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 sm:w-auto"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>

                <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
                  {avaliacoes.map((avaliacao) => (
                    <div
                      key={avaliacao.id}
                      className="flex items-center justify-between gap-3 rounded-md bg-gray-50 p-2"
                    >
                      <div className="flex min-w-0 items-center space-x-2">
                        {avaliacao.tipo === 'PROVA' ? (
                          <FaClipboardCheck className="text-red-500" />
                        ) : (
                          <FaBook className="text-red-500" />
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-medium sm:text-sm">
                            {new Date(avaliacao.data).toLocaleDateString('pt-BR')}
                          </p>
                          {avaliacao.descricao && (
                            <p className="break-words text-xs text-gray-500">{avaliacao.descricao}</p>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removerAvaliacao(avaliacao.id)}
                        className="shrink-0 text-gray-400 hover:text-red-500"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            <button type="submit" className="btn-primary w-full justify-center">
              Adicionar matéria
            </button>
          </form>
        )}

        {mode === 'unb' && (
          <div className="space-y-4 px-4 py-4 sm:px-6">
            <div className="grid gap-3 md:grid-cols-[1.3fr_0.7fr]">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Unidade da UnB</label>
                <select
                  value={selectedDepartment}
                  onChange={(event) => setSelectedDepartment(event.target.value)}
                  className="w-full rounded-xl border px-3 py-3 text-sm"
                  disabled={loadingDepartments}
                >
                  <option value="">{loadingDepartments ? 'Carregando unidades...' : 'Selecione a unidade'}</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Semestre disponível</label>
                <select
                  value={selectedTerm}
                  onChange={(event) => setSelectedTerm(event.target.value)}
                  className="w-full rounded-xl border px-3 py-3 text-sm"
                >
                  {availableTerms.map((term) => (
                    <option key={term.value} value={term.value}>
                      {term.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-xl border px-3 py-3 text-sm"
                placeholder="Digite nome, codigo, turma ou docente"
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    searchUnbClasses();
                  }
                }}
              />
              <button
                type="button"
                onClick={searchUnbClasses}
                className="btn-primary inline-flex items-center justify-center gap-2"
                disabled={loadingTurmas}
              >
                <FaSearch />
                {loadingTurmas ? 'Buscando...' : 'Buscar'}
              </button>
            </div>

            {unbHelpMessage ? (
              <p className="text-sm text-rose-600">{unbHelpMessage}</p>
            ) : null}

            <div className="space-y-4">
              {disciplineResults.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                  {hasSearchedUnb
                    ? 'Nenhuma disciplina encontrada com esse termo. Tente buscar por nome, código ou parte do nome.'
                    : 'Escolha a unidade e comece a digitar para listar disciplinas.'}
                </div>
              ) : selectedDiscipline ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <button
                      type="button"
                      onClick={() => setSelectedDisciplineCode('')}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
                    >
                      <FaChevronLeft className="text-xs" />
                      Voltar para disciplinas
                    </button>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-800">
                      {selectedDiscipline.code}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-slate-900">{selectedDiscipline.name}</h3>
                    <p className="mt-2 text-sm text-slate-600">
                      {selectedDiscipline.classes.length} turma{selectedDiscipline.classes.length > 1 ? 's' : ''}{' '}
                      disponível{selectedDiscipline.classes.length > 1 ? 'eis' : ''}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {selectedDiscipline.classes.map((turma) => (
                      <div
                        key={`${selectedDiscipline.code}-${turma.classCode}`}
                        className="rounded-2xl border border-slate-100 bg-white p-4 shadow-soft"
                      >
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                                Turma {turma.classCode}
                              </span>
                              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                                {turma.workloadHours || 60}h
                              </span>
                              <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800">
                                Peso {turma.absenceWeight}
                              </span>
                            </div>

                            <p className="mt-3 text-sm text-slate-700">
                              {turma.teachers.length > 0 ? turma.teachers.join(', ') : 'Docente a definir'}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-2">
                              {turma.scheduleText.map((meeting) => (
                                <span
                                  key={meeting}
                                  className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700"
                                >
                                  {meeting}
                                </span>
                              ))}
                            </div>

                            <p className="mt-3 text-xs text-slate-500">
                              Código SIGAA: {turma.scheduleCode}
                              {turma.classroom ? ` • Sala: ${turma.classroom}` : ''}
                              {turma.startDate && turma.endDate ? ` • ${turma.startDate} até ${turma.endDate}` : ''}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => importUnbClass(selectedDiscipline, turma)}
                            className="rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
                          >
                            Adicionar à lista
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                disciplineResults.map((discipline) => (
                  <div key={discipline.code} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="mb-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-800">
                        {discipline.code}
                      </p>
                      <h3 className="mt-1 text-lg font-semibold text-slate-900">{discipline.name}</h3>
                      <p className="mt-2 text-sm text-slate-600">
                        {discipline.classes.length} turma{discipline.classes.length > 1 ? 's' : ''} encontrada
                        {discipline.classes.length > 1 ? 's' : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedDisciplineCode(discipline.code)}
                      className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                      Ver turmas
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AddMateriaModal;
