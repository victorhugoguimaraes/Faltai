import React from 'react';
import {
  FaArrowRight,
  FaCalendarDay,
  FaChartLine,
  FaClipboardList,
  FaExclamationTriangle,
  FaPlus
} from 'react-icons/fa';

function DetailRow({ label, value, accent = 'text-slate-900' }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/70 px-4 py-3">
      <span className="text-sm font-medium text-slate-500">{label}</span>
      <span className={`text-sm font-semibold ${accent}`}>{value}</span>
    </div>
  );
}

function SemesterStatusPanel({
  activeView,
  status,
  nextClass,
  nextEvaluation,
  todayClassesCount,
  totalFaltas,
  totalMaterias,
  materiasEmRisco,
  attendancePercentage,
  onAddMateria,
  onChangeView
}) {
  const accentClasses = {
    calm: {
      badge: 'bg-emerald-50 text-emerald-800',
      bar: 'bg-emerald-600'
    },
    attention: {
      badge: 'bg-amber-50 text-amber-800',
      bar: 'bg-amber-500'
    },
    risk: {
      badge: 'bg-rose-50 text-rose-800',
      bar: 'bg-rose-500'
    },
    empty: {
      badge: 'bg-slate-100 text-slate-700',
      bar: 'bg-slate-500'
    }
  };

  const tone = accentClasses[status.tone] || accentClasses.calm;

  return (
    <aside className="space-y-4 xl:sticky xl:top-28">
      <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-soft backdrop-blur-xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">
              Estado do semestre
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold text-slate-950">{status.title}</h2>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${tone.badge}`}>
            {status.badge}
          </span>
        </div>

        <p className="mt-3 text-sm leading-6 text-slate-600">{status.description}</p>

        <div className="mt-5 rounded-[1.6rem] border border-slate-100 bg-slate-50/80 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Presenca media
              </p>
              <p className="mt-2 font-display text-3xl font-bold text-slate-950">
                {Math.max(0, 100 - attendancePercentage)}%
              </p>
            </div>
            <p className="text-sm font-medium text-slate-500">{attendancePercentage}% do limite usado</p>
          </div>

          <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-300 ${tone.bar}`}
              style={{ width: `${Math.min(attendancePercentage, 100)}%` }}
            />
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <DetailRow label="Materias ativas" value={String(totalMaterias)} />
          <DetailRow
            label="Materias em risco"
            value={String(materiasEmRisco)}
            accent={materiasEmRisco > 0 ? 'text-amber-700' : 'text-emerald-700'}
          />
          <DetailRow label="Faltas acumuladas" value={String(totalFaltas)} />
          <DetailRow
            label="Aulas de hoje"
            value={todayClassesCount === 0 ? 'Sem aulas' : `${todayClassesCount} aula${todayClassesCount > 1 ? 's' : ''}`}
          />
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/70 bg-white/80 p-5 shadow-soft backdrop-blur-xl sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Agora</p>
        <div className="mt-4 space-y-4">
          <div className="rounded-[1.6rem] bg-slate-950 px-4 py-4 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">Proxima aula</p>
            <p className="mt-2 text-sm font-semibold">
              {nextClass ? nextClass.nome : 'Monte sua grade para ver a proxima aula'}
            </p>
            <p className="mt-1 text-sm text-slate-300">
              {nextClass ? `${nextClass.dayLabel} • ${nextClass.inicio} - ${nextClass.fim}` : 'Sem grade configurada'}
            </p>
          </div>

          <div className="rounded-[1.6rem] border border-slate-100 bg-slate-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Proxima avaliacao</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {nextEvaluation ? nextEvaluation.materia : 'Nenhuma avaliacao cadastrada'}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {nextEvaluation
                ? `${nextEvaluation.tipo} em ${new Date(nextEvaluation.data).toLocaleDateString('pt-BR')}`
                : 'Adicione provas e trabalhos para acompanhar a pressao da semana'}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/70 bg-white/80 p-5 shadow-soft backdrop-blur-xl sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Acoes</p>
        <div className="mt-4 grid gap-3">
          <button
            type="button"
            onClick={onAddMateria}
            className="flex items-center justify-between rounded-[1.4rem] bg-slate-950 px-4 py-4 text-left text-white transition-colors hover:bg-slate-800"
          >
            <div className="flex items-center gap-3">
              <span className="rounded-2xl bg-white/10 p-3">
                <FaPlus />
              </span>
              <div>
                <p className="text-sm font-semibold">Adicionar materia</p>
                <p className="text-xs text-slate-300">Importe da UnB ou cadastre manualmente</p>
              </div>
            </div>
            <FaArrowRight />
          </button>

          <button
            type="button"
            onClick={() => onChangeView('materias')}
            className={`flex items-center gap-3 rounded-[1.4rem] border px-4 py-3 text-left transition-colors ${
              activeView === 'materias'
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <FaClipboardList />
            <span className="text-sm font-semibold">Abrir materias</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeView('agenda')}
            className={`flex items-center gap-3 rounded-[1.4rem] border px-4 py-3 text-left transition-colors ${
              activeView === 'agenda'
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <FaCalendarDay />
            <span className="text-sm font-semibold">Abrir agenda</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeView('analytics')}
            className={`flex items-center gap-3 rounded-[1.4rem] border px-4 py-3 text-left transition-colors ${
              activeView === 'analytics'
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <FaChartLine />
            <span className="text-sm font-semibold">Ver insights</span>
          </button>

          {materiasEmRisco > 0 && (
            <div className="flex items-center gap-3 rounded-[1.4rem] border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
              <FaExclamationTriangle className="shrink-0" />
              <p className="text-sm font-medium">
                {materiasEmRisco} materia{materiasEmRisco > 1 ? 's pedem' : ' pede'} mais presenca nesta semana.
              </p>
            </div>
          )}
        </div>
      </section>
    </aside>
  );
}

export default SemesterStatusPanel;
