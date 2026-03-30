import React, { useMemo } from 'react';
import { FaArrowRight, FaChartBar, FaExclamationTriangle, FaFire } from 'react-icons/fa';

function AnalyticsHub({ materias, totalFaltas, materiasEmRisco, proximasAvaliacoes, onOpenDashboard }) {
  const materiaMaisCritica = useMemo(() => {
    return [...materias]
      .sort((a, b) => {
        const percentA = (Number(a.faltas) || 0) / (Number(a.maxFaltas) || 1);
        const percentB = (Number(b.faltas) || 0) / (Number(b.maxFaltas) || 1);
        return percentB - percentA;
      })[0];
  }, [materias]);

  return (
    <section className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="feature-card">
          <FaChartBar className="mb-4 text-xl text-sky-700" />
          <p className="feature-card__eyebrow">Total</p>
          <h2 className="feature-card__title">{totalFaltas} faltas acumuladas</h2>
          <p className="feature-card__text">Leitura rapida para saber o peso do semestre inteiro.</p>
        </div>

        <div className="feature-card">
          <FaExclamationTriangle className="mb-4 text-xl text-amber-600" />
          <p className="feature-card__eyebrow">Risco</p>
          <h2 className="feature-card__title">{materiasEmRisco} materias exigem atencao</h2>
          <p className="feature-card__text">Use isso para decidir onde vale segurar mais presenca.</p>
        </div>

        <div className="feature-card">
          <FaFire className="mb-4 text-xl text-rose-600" />
          <p className="feature-card__eyebrow">Ponto critico</p>
          <h2 className="feature-card__title">
            {materiaMaisCritica ? materiaMaisCritica.nome : 'Sem dados ainda'}
          </h2>
          <p className="feature-card__text">
            {materiaMaisCritica
              ? `${materiaMaisCritica.faltas}/${materiaMaisCritica.maxFaltas} faltas utilizadas.`
              : 'Adicione materias para gerar leitura de risco.'}
          </p>
        </div>
      </div>

      <div className="card p-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
          Modo detalhado
        </p>
        <h2 className="font-display text-2xl font-bold text-slate-950">
          Abra o dashboard completo quando quiser cruzar graficos, risco e gamificacao.
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Mantivemos a leitura principal nesta tela e deixamos o painel completo como aprofundamento, para o mobile continuar leve.
        </p>
        <button className="btn-primary mt-5 inline-flex items-center gap-2" onClick={onOpenDashboard}>
          Abrir dashboard completo
          <FaArrowRight />
        </button>
      </div>

      <div className="card p-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
          Pressao da semana
        </p>
        {proximasAvaliacoes.length === 0 ? (
          <p className="text-sm leading-6 text-slate-600">
            Nenhuma avaliacao futura imediata. O foco agora pode ficar em equilibrar faltas e rotina.
          </p>
        ) : (
          <div className="space-y-3">
            {proximasAvaliacoes.map((avaliacao) => (
              <div
                key={`${avaliacao.materia}-${avaliacao.data}-${avaliacao.tipo}`}
                className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <p className="text-sm font-semibold text-slate-900">{avaliacao.materia}</p>
                <p className="text-sm text-slate-600">
                  {avaliacao.tipo} em {new Date(avaliacao.data).toLocaleDateString('pt-BR')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default AnalyticsHub;
