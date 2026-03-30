import React, { lazy, Suspense, useMemo, useState } from 'react';
import { FaChartBar, FaExclamationTriangle, FaTrophy } from 'react-icons/fa';
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  PointElement,
  Title,
  Tooltip
} from 'chart.js';
import { useMaterias } from '../contexts/MateriasContext';
import LoadingSpinner from './common/LoadingSpinner';
import BottomSheet from './layout/BottomSheet';
import DashboardAlertsTab from '../features/dashboard/components/DashboardAlertsTab';
import DashboardGamificationTab from '../features/dashboard/components/DashboardGamificationTab';
import DashboardOverviewTab from '../features/dashboard/components/DashboardOverviewTab';
import {
  getDashboardBarData,
  getDashboardChartOptions,
  getDashboardDoughnutData,
  getDashboardStats
} from '../features/dashboard/lib/dashboardMetrics';

const GamificationSystem = lazy(() => import('./GamificationSystem'));

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, Title, Tooltip, Legend);

const tabs = [
  { id: 'analytics', label: 'Analytics', shortLabel: 'Dados', icon: <FaChartBar /> },
  { id: 'alerts', label: 'Alertas', shortLabel: 'Alertas', icon: <FaExclamationTriangle /> },
  { id: 'gamification', label: 'Gamificação', shortLabel: 'Game', icon: <FaTrophy /> }
];

function Dashboard({ onClose }) {
  const { materias } = useMaterias();
  const [activeTab, setActiveTab] = useState('analytics');
  const [gamificationOpen, setGamificationOpen] = useState(false);

  const estatisticas = useMemo(() => getDashboardStats(materias), [materias]);
  const dadosBarras = useMemo(() => getDashboardBarData(materias), [materias]);
  const dadosRosca = useMemo(() => getDashboardDoughnutData(materias), [materias]);
  const opcoesGrafico = useMemo(() => getDashboardChartOptions(materias), [materias]);

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
        <h2 className="mb-2 text-xl font-semibold text-slate-800">Nenhuma Matéria Cadastrada</h2>
        <p className="mb-6 text-slate-600">
          Adicione algumas matérias para ver estatísticas detalhadas no dashboard.
        </p>
        <button onClick={onClose} className="btn-primary">
          Fechar
        </button>
      </BottomSheet>
    );
  }

  return (
    <>
      <BottomSheet
        isOpen
        onClose={onClose}
        title="Dashboard Analítico"
        icon={<FaChartBar />}
        className="sm:max-w-6xl"
        contentClassName="p-3 sm:p-6"
        mobileFullHeight
      >
        <div className="mb-4 flex space-x-1 rounded-2xl bg-slate-100 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-1 rounded-xl px-2 py-2 text-xs transition-colors sm:space-x-2 sm:px-4 sm:text-sm ${
                activeTab === tab.id
                  ? 'bg-white text-sky-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {React.cloneElement(tab.icon, { size: 14 })}
              <span className="sm:hidden">{tab.shortLabel}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {activeTab === 'analytics' && (
          <DashboardOverviewTab
            estatisticas={estatisticas}
            dadosBarras={dadosBarras}
            dadosRosca={dadosRosca}
            opcoesGrafico={opcoesGrafico}
          />
        )}

        {activeTab === 'alerts' && (
          <DashboardAlertsTab estatisticas={estatisticas} materias={materias} />
        )}

        {activeTab === 'gamification' && (
          <DashboardGamificationTab
            estatisticas={estatisticas}
            onOpenGamification={() => setGamificationOpen(true)}
          />
        )}
      </BottomSheet>

      {gamificationOpen && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/75">
          <Suspense fallback={<LoadingSpinner />}>
            <GamificationSystem materias={materias} onClose={() => setGamificationOpen(false)} />
          </Suspense>
        </div>
      )}
    </>
  );
}

export default Dashboard;
