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

  return (
    <header className="sticky top-0 z-20 px-4 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 rounded-[1.75rem] border border-white/60 bg-white/80 px-4 py-3 shadow-soft backdrop-blur-xl sm:px-6">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            {activeView === 'materias' ? 'Painel principal' : activeView}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="font-display text-lg font-semibold text-slate-900 sm:text-2xl">
              Oi, {displayName}
            </h1>
            <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
              {totalMaterias} materias
            </span>
            {materiasEmRisco > 0 && (
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                {materiasEmRisco} em risco
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            className="icon-button-shell"
            onClick={onOpenAnalytics}
            title="Abrir dashboard"
            aria-label="Abrir dashboard"
          >
            <FaChartBar size={18} />
          </button>
          <button
            className="icon-button-shell icon-button-shell--danger"
            onClick={onOpenLogout}
            title="Sair"
            aria-label="Sair"
          >
            <FaSignOutAlt size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}

export default AppHeader;
