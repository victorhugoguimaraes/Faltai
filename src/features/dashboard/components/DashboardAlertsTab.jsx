import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';

function DashboardAlertsTab({ estatisticas, materias }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Alertas e Recomendações</h3>

      {estatisticas.materiasEmRisco > 0 && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <h4 className="flex items-center font-medium text-rose-800">
            <FaExclamationTriangle className="mr-2" />
            Matérias em Risco Alto
          </h4>
          <div className="mt-2 space-y-2">
            {materias
              .filter((materia) => {
                const faltas = Number(materia.faltas) || 0;
                const maxFaltas = Number(materia.maxFaltas) || 1;
                return (faltas / maxFaltas) >= 0.75;
              })
              .map((materia, index) => (
                <div key={`${materia.nome}-${index}`} className="text-rose-700">
                  <strong>{String(materia.nome || 'Matéria')}</strong>: {Number(materia.faltas) || 0}/
                  {Number(materia.maxFaltas) || 0} faltas
                  ({Math.round(((Number(materia.faltas) || 0) / (Number(materia.maxFaltas) || 1)) * 100)}%)
                </div>
              ))}
          </div>
        </div>
      )}

      {estatisticas.porcentagemMedia > 50 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <h4 className="font-medium text-amber-800">Média Geral de Faltas Alta</h4>
          <p className="mt-1 text-amber-700">
            Sua média geral está em {Number(estatisticas.porcentagemMedia) || 0}%.
            Considere melhorar a frequência.
          </p>
        </div>
      )}

      {estatisticas.materiasEmRisco === 0 && estatisticas.porcentagemMedia <= 50 && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <h4 className="font-medium text-emerald-800">Parabéns! Situação Controlada</h4>
          <p className="mt-1 text-emerald-700">
            Todas as suas matérias estão com frequência adequada.
          </p>
        </div>
      )}
    </div>
  );
}

export default DashboardAlertsTab;
