import React from 'react';
import { FaChartBar, FaSignOutAlt } from 'react-icons/fa';

function AppHeader({
  user,
  activeView,
  totalMaterias,
  materiasEmRisco,
  onOpenAnalytics,
  onOpenLogout
}) {
  const displayName = user?.displayName || 'Aluno';
  const viewLabel =
    activeView === 'materias'
      ? 'Painel de execucao'
      : activeView === 'agenda'
        ? 'Agenda do semestre'
        : 'Leitura do semestre';

  return (
    <header className="sticky top-0 z-20 px-4 pt-3 sm:px-6 sm:pt-4 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 rounded-[1.5rem] border border-white/60 bg-white/82 px-4 py-3 shadow-soft backdrop-blur-xl sm:gap-4 sm:rounded-[1.75rem] sm:px-6">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 sm:text-xs sm:tracking-[0.24em]">
            {viewLabel}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="truncate font-display text-base font-semibold text-slate-900 sm:text-2xl">
              Oi, {displayName}
            </h1>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 sm:text-xs">
              {totalMaterias} materias
            </span>
            {materiasEmRisco > 0 && (
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 sm:text-xs">
                {materiasEmRisco} em risco
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            className="icon-button-shell h-10 w-10 sm:h-11 sm:w-11"
            onClick={onOpenAnalytics}
            title="Abrir dashboard"
            aria-label="Abrir dashboard"
          >
            <FaChartBar size={17} />
          </button>
          <button
            className="icon-button-shell icon-button-shell--danger h-10 w-10 sm:h-11 sm:w-11"
            onClick={onOpenLogout}
            title="Sair"
            aria-label="Sair"
          >
            <FaSignOutAlt size={17} />
          </button>
        </div>
      </div>
    </header>
  );
}

export default AppHeader;
