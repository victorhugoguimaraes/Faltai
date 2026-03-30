import React from 'react';
import { FaCalendarCheck, FaChartBar, FaExclamationTriangle } from 'react-icons/fa';
import { Bar, Doughnut } from 'react-chartjs-2';
import StatCard from './StatCard';

function DashboardOverviewTab({ estatisticas, dadosBarras, dadosRosca, opcoesGrafico }) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-4">
        <StatCard
          title="Matérias"
          fullTitle="Total de Matérias"
          value={estatisticas.totalMaterias}
          icon={<FaChartBar size={16} />}
          color="blue"
        />
        <StatCard
          title="Faltas"
          fullTitle="Total de Faltas"
          value={estatisticas.totalFaltas}
          icon={<FaExclamationTriangle size={16} />}
          color="amber"
        />
        <StatCard
          title="Média"
          fullTitle="Média de Faltas"
          value={estatisticas.mediaFaltas}
          icon={<FaChartBar size={16} />}
          color="emerald"
          subtitle="por matéria"
        />
        <StatCard
          title="Risco"
          fullTitle="Matérias em Risco"
          value={estatisticas.materiasEmRisco}
          icon={<FaExclamationTriangle size={16} />}
          color="rose"
          subtitle="> 75% das faltas"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        <div className="rounded-2xl border border-slate-100 bg-white p-3 sm:p-4">
          <h3 className="mb-3 text-base font-semibold sm:mb-4 sm:text-lg">Faltas por Matéria</h3>
          <div className="h-64 sm:h-80">
            <Bar data={dadosBarras} options={opcoesGrafico} />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-3 sm:p-4">
          <h3 className="mb-3 text-base font-semibold sm:mb-4 sm:text-lg">Status das Matérias</h3>
          <div className="mx-auto h-64 max-w-xs">
            <Doughnut data={dadosRosca} />
          </div>
        </div>
      </div>

      {estatisticas.proximasAvaliacoes.length > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <h3 className="mb-4 flex items-center text-lg font-semibold">
            <FaCalendarCheck className="mr-2 text-sky-600" />
            Próximas Avaliações (7 dias)
          </h3>
          <div className="space-y-3">
            {estatisticas.proximasAvaliacoes.map((avaliacao, index) => (
              <div
                key={`${avaliacao.materiaName}-${avaliacao.data}-${index}`}
                className="flex items-center justify-between rounded-2xl bg-slate-50 p-3"
              >
                <div>
                  <p className="font-medium text-slate-800">{avaliacao.materiaName}</p>
                  <p className="text-sm text-slate-600">{avaliacao.descricao || avaliacao.tipo}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-800">
                    {new Date(avaliacao.data).toLocaleDateString('pt-BR')}
                  </p>
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      avaliacao.tipo === 'PROVA'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-sky-100 text-sky-800'
                    }`}
                  >
                    {avaliacao.tipo}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardOverviewTab;
