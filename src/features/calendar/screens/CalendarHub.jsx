import React from 'react';
import { FaCalendarAlt, FaArrowRight } from 'react-icons/fa';

function CalendarHub({ proximasAvaliacoes, onOpenCalendar, onSyncCalendar }) {
  return (
    <section className="space-y-5">
      <div className="card overflow-x-auto p-3">
        <div className="flex min-w-max gap-3">
          <button
            className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
            onClick={onOpenCalendar}
          >
            Abrir calendário geral
          </button>
          <button
            className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
            onClick={onSyncCalendar}
          >
            Sincronizar
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        <button className="card p-5 text-left transition-transform hover:-translate-y-0.5" onClick={onOpenCalendar}>
          <FaCalendarAlt className="mb-4 text-xl text-sky-700" />
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Agenda</p>
          <h2 className="mt-3 font-display text-2xl font-bold text-slate-950">Calendário geral</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Calendário acadêmico, provas, trabalhos, entregas e compromissos das matérias no mesmo lugar.
          </p>
          <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-sky-700">
            Abrir calendário <FaArrowRight />
          </span>
        </button>
      </div>

      <div className="card p-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
          Próximas avaliações
        </p>
        {proximasAvaliacoes.length === 0 ? (
          <p className="text-sm leading-6 text-slate-600">
            Nenhuma avaliação futura cadastrada. Use o calendário geral para adicionar provas, entregas e compromissos.
          </p>
        ) : (
          <div className="space-y-3">
            {proximasAvaliacoes.map((avaliacao) => (
              <div
                key={`${avaliacao.materia}-${avaliacao.data}-${avaliacao.tipo}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{avaliacao.materia}</p>
                  <p className="text-sm text-slate-600">
                    {avaliacao.tipo} em {new Date(avaliacao.data).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                  {avaliacao.descricao || 'Sem descrição'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default CalendarHub;
