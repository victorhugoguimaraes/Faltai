import React, { useMemo } from 'react';
import {
  FaArrowTrendUp,
  FaCalendarDay,
  FaCalendarWeek,
  FaCircleCheck,
  FaChartBar,
  FaFire,
  FaLayerGroup,
  FaTriangleExclamation
} from 'react-icons/fa6';
import { useMaterias } from '../contexts/MateriasContext';
import BottomSheet from './layout/BottomSheet';
import { loadTurmas } from '../features/schedule/lib/turmasStorage';

const weekdayLabels = {
  DOM: 'Domingo',
  SEG: 'Segunda',
  TER: 'Terca',
  QUA: 'Quarta',
  QUI: 'Quinta',
  SEX: 'Sexta',
  SAB: 'Sabado'
};

const weekdayToCode = {
  0: 'DOM',
  1: 'SEG',
  2: 'TER',
  3: 'QUA',
  4: 'QUI',
  5: 'SEX',
  6: 'SAB'
};

const toMinutes = (timeValue = '00:00') => {
  const [hours = '0', minutes = '0'] = String(timeValue).split(':');
  return Number(hours) * 60 + Number(minutes);
};

const getUpcomingClass = (turmas, now) => {
  const currentWeekday = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return turmas
    .filter((turma) => turma.diaSemana && weekdayLabels[turma.diaSemana])
    .map((turma) => {
      const targetWeekday = Object.entries(weekdayToCode).find(([, code]) => code === turma.diaSemana)?.[0];

      if (targetWeekday === undefined) {
        return null;
      }

      let daysUntil = Number(targetWeekday) - currentWeekday;
      const startMinutes = toMinutes(turma.inicio);

      if (daysUntil < 0 || (daysUntil === 0 && startMinutes <= currentMinutes)) {
        daysUntil += 7;
      }

      return {
        ...turma,
        dayLabel: weekdayLabels[turma.diaSemana],
        daysUntil,
        startMinutes
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.daysUntil - right.daysUntil || left.startMinutes - right.startMinutes)[0] || null;
};

const formatEvaluationCountdown = (dateValue) => {
  const today = new Date();
  const target = new Date(dateValue);
  const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));

  if (diff <= 0) {
    return 'Hoje';
  }

  if (diff === 1) {
    return 'Amanha';
  }

  return `${diff} dias`;
};

function MetricCard({ icon, eyebrow, title, text, accentClass = 'text-slate-900' }) {
  return (
    <div className="feature-card">
      <div className={`mb-4 text-xl ${accentClass}`}>{icon}</div>
      <p className="feature-card__eyebrow">{eyebrow}</p>
      <h2 className="feature-card__title">{title}</h2>
      <p className="feature-card__text">{text}</p>
    </div>
  );
}

function Dashboard({ onClose }) {
  const { materias } = useMaterias();

  const overview = useMemo(() => {
    const turmas = loadTurmas();
    const totalFaltas = materias.reduce((sum, materia) => sum + (Number(materia.faltas) || 0), 0);
    const totalMaxFaltas = materias.reduce((sum, materia) => sum + (Number(materia.maxFaltas) || 0), 0);
    const averageUse = materias.length
      ? materias.reduce((sum, materia) => {
          const faltas = Number(materia.faltas) || 0;
          const maxFaltas = Number(materia.maxFaltas) || 1;
          return sum + (maxFaltas > 0 ? faltas / maxFaltas : 0);
        }, 0) / materias.length
      : 0;

    const atRiskMaterias = [...materias]
      .map((materia) => {
        const faltas = Number(materia.faltas) || 0;
        const maxFaltas = Number(materia.maxFaltas) || 1;
        const ratio = maxFaltas > 0 ? faltas / maxFaltas : 0;

        return {
          ...materia,
          ratio,
          remaining: Math.max(maxFaltas - faltas, 0)
        };
      })
      .sort((left, right) => right.ratio - left.ratio);

    const nextEvaluations = materias
      .flatMap((materia) =>
        (materia.avaliacoes || []).map((avaliacao) => ({
          ...avaliacao,
          materia: materia.nome
        }))
      )
      .filter((avaliacao) => new Date(avaliacao.data) >= new Date())
      .sort((a, b) => new Date(a.data) - new Date(b.data))
      .slice(0, 4);

    const nextClass = getUpcomingClass(turmas, new Date());
    const todayClassesCount = turmas.filter((turma) => turma.diaSemana === weekdayToCode[new Date().getDay()]).length;

    return {
      turmas,
      totalFaltas,
      totalMaxFaltas,
      averageUse,
      atRiskMaterias,
      nextEvaluations,
      nextClass,
      todayClassesCount
    };
  }, [materias]);

  if (materias.length === 0) {
    return (
      <BottomSheet
        isOpen
        onClose={onClose}
        title="Dashboard"
        icon={<FaChartBar />}
        className="sm:max-w-md"
        contentClassName="p-8 text-center"
      >
        <FaChartBar className="mx-auto mb-4 text-6xl text-slate-300" />
        <h2 className="mb-2 font-display text-2xl font-bold text-slate-900">Sem materia ainda</h2>
        <p className="text-slate-600">
          Adicione materias para transformar o dashboard em uma leitura viva do semestre.
        </p>
      </BottomSheet>
    );
  }

  const semesterHealth = Math.max(0, 100 - Math.round(overview.averageUse * 100));
  const mostCriticalMateria = overview.atRiskMaterias[0];

  return (
    <BottomSheet
      isOpen
      onClose={onClose}
      title="Dashboard do semestre"
      icon={<FaChartBar />}
      className="sm:max-w-6xl"
      contentClassName="space-y-5 p-4 sm:p-6"
      mobileFullHeight
    >
      <section className="hero-surface rounded-[1.8rem] px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-800">Leitura geral</p>
            <h2 className="mt-3 font-display text-3xl font-bold text-slate-950">
              {semesterHealth >= 70 ? 'Semestre bem encaminhado' : semesterHealth >= 45 ? 'Semana pede calibragem' : 'Semestre em zona critica'}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Este painel resume o que realmente pede decisao agora: risco de faltas, proxima pressao academica e ritmo da semana.
            </p>
          </div>

          <div className="rounded-[1.5rem] bg-white px-5 py-4 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Saude do semestre</p>
            <p className="mt-2 font-display text-4xl font-bold text-slate-950">{semesterHealth}%</p>
            <p className="mt-1 text-sm text-slate-500">{Math.round(overview.averageUse * 100)}% do limite medio usado</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<FaLayerGroup />}
          eyebrow="Carga atual"
          title={`${overview.totalFaltas} faltas em ${materias.length} materias`}
          text={`Voce ainda tem ${Math.max(overview.totalMaxFaltas - overview.totalFaltas, 0)} faltas de margem somadas.`}
          accentClass="text-sky-700"
        />
        <MetricCard
          icon={<FaTriangleExclamation />}
          eyebrow="Maior pressao"
          title={mostCriticalMateria ? mostCriticalMateria.nome : 'Sem pressao'}
          text={
            mostCriticalMateria
              ? `${Math.round(mostCriticalMateria.ratio * 100)}% do limite usado • faltam ${mostCriticalMateria.remaining} faltas.`
              : 'Nenhuma materia cadastrada em risco.'
          }
          accentClass="text-amber-600"
        />
        <MetricCard
          icon={<FaCalendarDay />}
          eyebrow="Hoje"
          title={overview.todayClassesCount === 0 ? 'Sem aulas na grade' : `${overview.todayClassesCount} aula${overview.todayClassesCount > 1 ? 's' : ''} hoje`}
          text={
            overview.nextClass
              ? `Proxima aula: ${overview.nextClass.nome} em ${overview.nextClass.dayLabel}, ${overview.nextClass.inicio}.`
              : 'Monte mais turmas para o painel acompanhar sua rotina.'
          }
          accentClass="text-emerald-700"
        />
        <MetricCard
          icon={<FaCalendarWeek />}
          eyebrow="Proxima avaliacao"
          title={overview.nextEvaluations[0] ? overview.nextEvaluations[0].materia : 'Nada iminente'}
          text={
            overview.nextEvaluations[0]
              ? `${overview.nextEvaluations[0].tipo} em ${new Date(overview.nextEvaluations[0].data).toLocaleDateString('pt-BR')} • ${formatEvaluationCountdown(overview.nextEvaluations[0].data)}`
              : 'Sem provas ou entregas futuras cadastradas.'
          }
          accentClass="text-rose-600"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[1.8rem] border border-white/70 bg-white/85 p-5 shadow-soft backdrop-blur-xl sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Materias que mais pedem acao</p>
              <h3 className="mt-2 font-display text-2xl font-bold text-slate-950">Prioridades da semana</h3>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {overview.atRiskMaterias.length} materias
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {overview.atRiskMaterias.slice(0, 5).map((materia) => (
              <div key={materia.id} className="rounded-[1.4rem] border border-slate-100 bg-slate-50/90 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{materia.nome}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {materia.faltas}/{materia.maxFaltas} faltas • restam {materia.remaining}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      materia.ratio >= 0.9
                        ? 'bg-rose-100 text-rose-700'
                        : materia.ratio >= 0.75
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {Math.round(materia.ratio * 100)}%
                  </span>
                </div>
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full ${
                      materia.ratio >= 0.9 ? 'bg-rose-500' : materia.ratio >= 0.75 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(materia.ratio * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <section className="rounded-[1.8rem] border border-white/70 bg-white/85 p-5 shadow-soft backdrop-blur-xl sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Pressao academica</p>
            <h3 className="mt-2 font-display text-2xl font-bold text-slate-950">Proximos marcos</h3>

            <div className="mt-5 space-y-3">
              {overview.nextEvaluations.length === 0 ? (
                <div className="rounded-[1.4rem] border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  Nenhuma avaliacao futura cadastrada.
                </div>
              ) : (
                overview.nextEvaluations.map((avaliacao) => (
                  <div key={`${avaliacao.materia}-${avaliacao.data}-${avaliacao.tipo}`} className="rounded-[1.4rem] border border-slate-100 bg-slate-50/90 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{avaliacao.materia}</p>
                        <p className="mt-1 text-sm text-slate-500">{avaliacao.descricao || avaliacao.tipo}</p>
                      </div>
                      <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                        {formatEvaluationCountdown(avaliacao.data)}
                      </span>
                    </div>
                    <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                      {new Date(avaliacao.data).toLocaleDateString('pt-BR')} • {avaliacao.tipo}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[1.8rem] border border-white/70 bg-white/85 p-5 shadow-soft backdrop-blur-xl sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Leitura rapida</p>
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3 rounded-[1.4rem] bg-emerald-50 px-4 py-3 text-emerald-900">
                <FaCircleCheck className="shrink-0" />
                <p className="text-sm font-medium">
                  {overview.atRiskMaterias.filter((materia) => materia.ratio < 0.5).length} materias ainda estao confortaveis.
                </p>
              </div>
              <div className="flex items-center gap-3 rounded-[1.4rem] bg-amber-50 px-4 py-3 text-amber-900">
                <FaFire className="shrink-0" />
                <p className="text-sm font-medium">
                  {overview.atRiskMaterias.filter((materia) => materia.ratio >= 0.75).length} materias precisam de mais presenca agora.
                </p>
              </div>
              <div className="flex items-center gap-3 rounded-[1.4rem] bg-sky-50 px-4 py-3 text-sky-900">
                <FaArrowTrendUp className="shrink-0" />
                <p className="text-sm font-medium">
                  {overview.nextClass
                    ? `${overview.nextClass.dayLabel} segue como sua proxima ancora de rotina.`
                    : 'Sua grade ainda pode crescer para virar um painel diario mais fiel.'}
                </p>
              </div>
            </div>
          </section>
        </div>
      </section>
    </BottomSheet>
  );
}

export default Dashboard;
