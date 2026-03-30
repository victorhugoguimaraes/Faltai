import React from 'react';
import { FaTrophy } from 'react-icons/fa';

function AchievementCard({ active, colorClass, title, description }) {
  return (
    <div className={`rounded-2xl border p-4 ${active ? colorClass : 'border-slate-200 bg-slate-50'}`}>
      <div className="flex items-center space-x-3">
        <FaTrophy className={`text-2xl ${active ? 'text-current' : 'text-slate-400'}`} />
        <div>
          <h4 className="font-medium">{title}</h4>
          <p className="text-sm text-slate-600">{description}</p>
          {active && <p className="text-xs font-medium">Conquistado!</p>}
        </div>
      </div>
    </div>
  );
}

function DashboardGamificationTab({ estatisticas, onOpenGamification }) {
  return (
    <div className="space-y-4">
      <h3 className="flex items-center text-lg font-semibold">
        <FaTrophy className="mr-2 text-amber-500" />
        Sistema de Gamificação
      </h3>

      <div className="rounded-2xl border bg-gradient-to-r from-amber-50 to-orange-50 p-6">
        <div className="mb-4 text-center">
          <button
            onClick={onOpenGamification}
            className="mx-auto flex items-center rounded-2xl bg-gradient-primary px-8 py-3 text-white transition-all duration-200 hover:scale-105 hover:shadow-medium"
          >
            <FaTrophy className="mr-2" />
            Ver Sistema Completo
          </button>
        </div>

        <p className="text-center text-sm text-slate-600">
          Acompanhe seu progresso e conquiste níveis baseados na sua presença.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <AchievementCard
          active={estatisticas.porcentagemMedia < 25}
          colorClass="border-amber-200 bg-amber-50 text-amber-700"
          title="Frequentador Exemplar"
          description="Mantenha menos de 25% de faltas em média"
        />
        <AchievementCard
          active={estatisticas.totalMaterias >= 5}
          colorClass="border-sky-200 bg-sky-50 text-sky-700"
          title="Super Organizador"
          description="Cadastre 5 ou mais matérias"
        />
        <AchievementCard
          active={estatisticas.totalFaltas === 0 && estatisticas.totalMaterias > 0}
          colorClass="border-emerald-200 bg-emerald-50 text-emerald-700"
          title="Presença Perfeita"
          description="Zero faltas em todas as matérias"
        />
        <AchievementCard
          active={estatisticas.proximasAvaliacoes.length >= 3}
          colorClass="border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700"
          title="Planejador Nato"
          description="Tenha 3 ou mais avaliações agendadas"
        />
      </div>
    </div>
  );
}

export default DashboardGamificationTab;
