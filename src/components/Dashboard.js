import React, { useState, useMemo, lazy, Suspense } from 'react';
import { FaTimes, FaChartBar, FaExclamationTriangle, FaTrophy, FaCalendarCheck } from 'react-icons/fa';
import { useMaterias } from '../contexts/MateriasContext';
import LoadingSpinner from './common/LoadingSpinner';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

const GamificationSystem = lazy(() => import('./GamificationSystem'));

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = ({ onClose }) => {
  const { materias } = useMaterias();
  const [activeTab, setActiveTab] = useState('analytics');
  const [gamificationOpen, setGamificationOpen] = useState(false);

  const estatisticas = useMemo(() => {
    if (materias.length === 0) {
      return {
        totalMaterias: 0,
        totalFaltas: 0,
        mediaFaltas: 0,
        materiasEmRisco: 0,
        porcentagemMedia: 0,
        materiaComMaisFaltas: null,
        proximasAvaliacoes: []
      };
    }

    const totalFaltas = materias.reduce((sum, m) => sum + (Number(m.faltas) || 0), 0);
    const mediaFaltas = materias.length > 0 ? totalFaltas / materias.length : 0;
    const materiasEmRisco = materias.filter(m => {
      const maxFaltas = Number(m.maxFaltas) || 1;
      const faltas = Number(m.faltas) || 0;
      return (faltas / maxFaltas) > 0.75;
    });
    const porcentagemMedia = materias.length > 0 
      ? materias.reduce((sum, m) => {
          const maxFaltas = Number(m.maxFaltas) || 1;
          const faltas = Number(m.faltas) || 0;
          return sum + (faltas / maxFaltas);
        }, 0) / materias.length * 100 
      : 0;
    
    const materiaComMaisFaltas = materias.reduce((max, m) => {
      const faltas = Number(m.faltas) || 0;
      const maxFaltas = Number(max?.faltas) || 0;
      return faltas > maxFaltas ? m : max;
    }, null);

    const hoje = new Date();
    const proximosSete = new Date();
    proximosSete.setDate(hoje.getDate() + 7);

    const proximasAvaliacoes = materias
      .flatMap(materia => 
        (materia.avaliacoes || []).map(av => ({
          ...av,
          materiaName: materia.nome
        }))
      )
      .filter(av => {
        const dataAv = new Date(av.data);
        return dataAv >= hoje && dataAv <= proximosSete;
      })
      .sort((a, b) => new Date(a.data) - new Date(b.data))
      .slice(0, 5);

    return {
      totalMaterias: Number(materias.length) || 0,
      totalFaltas: Number(totalFaltas) || 0,
      mediaFaltas: Number(mediaFaltas.toFixed(2)) || 0,
      materiasEmRisco: Number(materiasEmRisco.length) || 0,
      porcentagemMedia: Number(porcentagemMedia.toFixed(2)) || 0,
      materiaComMaisFaltas,
      proximasAvaliacoes
    };
  }, [materias]);

  const dadosBarras = useMemo(() => {
    const labels = materias.map(m => {
      const nome = String(m.nome || 'Sem nome');
      return nome.length > 15 ? nome.substring(0, 15) + '...' : nome;
    });
    const faltasData = materias.map(m => Number(m.faltas) || 0);
    const maxFaltasData = materias.map(m => Number(m.maxFaltas) || 0);

    return {
      labels,
      datasets: [
        {
          label: 'Faltas Atuais',
          data: faltasData,
          backgroundColor: materias.map(m => {
            const faltas = Number(m.faltas) || 0;
            const maxFaltas = Number(m.maxFaltas) || 1;
            const percent = (faltas / maxFaltas) * 100;
            if (percent >= 100) return '#ef4444';
            if (percent >= 75) return '#f59e0b';
            return '#10b981';
          }),
          borderWidth: 1,
        },
        {
          label: 'Limite Máximo',
          data: maxFaltasData,
          backgroundColor: '#e5e7eb',
          borderWidth: 1,
        }
      ],
    };
  }, [materias]);

  const dadosRosca = useMemo(() => {
    const seguras = materias.filter(m => {
      const faltas = Number(m.faltas) || 0;
      const maxFaltas = Number(m.maxFaltas) || 1;
      return (faltas / maxFaltas) < 0.5;
    }).length;
    
    const atencao = materias.filter(m => {
      const faltas = Number(m.faltas) || 0;
      const maxFaltas = Number(m.maxFaltas) || 1;
      const percent = faltas / maxFaltas;
      return percent >= 0.5 && percent < 0.75;
    }).length;
    
    const risco = materias.filter(m => {
      const faltas = Number(m.faltas) || 0;
      const maxFaltas = Number(m.maxFaltas) || 1;
      return (faltas / maxFaltas) >= 0.75;
    }).length;

    return {
      labels: ['Seguras', 'Atenção', 'Em Risco'],
      datasets: [{
        data: [seguras, atencao, risco],
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
        borderWidth: 2,
        borderColor: '#fff',
      }],
    };
  }, [materias]);

  const opcoesGrafico = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: Math.max(...materias.map(m => m.maxFaltas)) + 2,
      },
    },
  };

  const StatCard = ({ title, fullTitle, value, icon, color = 'blue', subtitle }) => (
    <div className={`bg-white p-3 sm:p-6 rounded-lg shadow-sm border-l-4 border-${color}-500`}>
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-medium text-gray-600 truncate" title={fullTitle || title}>
            <span className="sm:hidden">{title}</span>
            <span className="hidden sm:inline">{fullTitle || title}</span>
          </p>
          <p className={`text-lg sm:text-2xl font-bold text-${color}-600`}>
            {typeof value === 'number' && !isNaN(value) ? value : '0'}
          </p>
          {subtitle && <p className="text-xs text-gray-500 mt-1 truncate">{subtitle}</p>}
        </div>
        <div className={`text-${color}-500 ml-2 flex-shrink-0`}>
          {icon}
        </div>
      </div>
    </div>
  );

  if (materias.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-8 w-full max-w-md text-center">
          <FaChartBar className="text-6xl text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Nenhuma Matéria Cadastrada</h2>
          <p className="text-gray-600 mb-6">
            Adicione algumas matérias para ver estatísticas detalhadas no dashboard.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-lg w-full h-full sm:h-auto sm:max-w-6xl sm:max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-3 sm:p-6 border-b">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-800 flex items-center">
            <FaChartBar className="mr-2 sm:mr-3 text-blue-600" size={16} />
            <span className="hidden sm:inline">Dashboard Analítico</span>
            <span className="sm:hidden">Dashboard</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 sm:p-2"
          >
            <FaTimes size={16} className="sm:hidden" />
            <FaTimes size={20} className="hidden sm:block" />
          </button>
        </div>

        <div className="px-3 sm:px-6 pt-3 sm:pt-4">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {[
              { id: 'analytics', label: 'Analytics', shortLabel: 'Dados', icon: <FaChartBar /> },
              { id: 'alerts', label: 'Alertas', shortLabel: 'Alertas', icon: <FaExclamationTriangle /> },
              { id: 'gamification', label: 'Gamificação', shortLabel: 'Game', icon: <FaTrophy /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-md transition-colors text-xs sm:text-sm ${
                  activeTab === tab.id 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {React.cloneElement(tab.icon, { size: 14 })}
                <span className="sm:hidden">{tab.shortLabel}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 sm:p-6">
          {activeTab === 'analytics' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
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
                  color="yellow"
                />
                <StatCard
                  title="Média"
                  fullTitle="Média de Faltas"
                  value={estatisticas.mediaFaltas}
                  icon={<FaChartBar size={16} />}
                  color="green"
                  subtitle="por matéria"
                />
                <StatCard
                  title="Risco"
                  fullTitle="Matérias em Risco"
                  value={estatisticas.materiasEmRisco}
                  icon={<FaExclamationTriangle size={16} />}
                  color="red"
                  subtitle="> 75% das faltas"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:gap-6">
                <div className="bg-white p-3 sm:p-4 rounded-lg border">
                  <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Faltas por Matéria</h3>
                  <div className="h-64 sm:h-80">
                    <Bar data={dadosBarras} options={opcoesGrafico} />
                  </div>
                </div>
                <div className="bg-white p-3 sm:p-4 rounded-lg border">
                  <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Status das Matérias</h3>
                  <div className="h-64 max-w-xs mx-auto">
                    <Doughnut data={dadosRosca} />
                  </div>
                </div>
              </div>

              {estatisticas.proximasAvaliacoes.length > 0 && (
                <div className="bg-white p-4 rounded-lg border">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <FaCalendarCheck className="mr-2 text-blue-600" />
                    Próximas Avaliações (7 dias)
                  </h3>
                  <div className="space-y-3">
                    {estatisticas.proximasAvaliacoes.map((av, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-800">{av.materiaName}</p>
                          <p className="text-sm text-gray-600">{av.descricao || av.tipo}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-800">
                            {new Date(av.data).toLocaleDateString('pt-BR')}
                          </p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            av.tipo === 'PROVA' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {av.tipo}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Alertas e Recomendações</h3>
              
              {estatisticas.materiasEmRisco > 0 && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <h4 className="text-red-800 font-medium flex items-center">
                    <FaExclamationTriangle className="mr-2" />
                    Matérias em Risco Alto
                  </h4>
                  <div className="mt-2 space-y-2">
                    {materias
                      .filter(m => {
                        const faltas = Number(m.faltas) || 0;
                        const maxFaltas = Number(m.maxFaltas) || 1;
                        return (faltas / maxFaltas) >= 0.75;
                      })
                      .map((materia, index) => (
                        <div key={index} className="text-red-700">
                          <strong>{String(materia.nome || 'Matéria')}</strong>: {Number(materia.faltas) || 0}/{Number(materia.maxFaltas) || 0} faltas
                          ({Math.round(((Number(materia.faltas) || 0) / (Number(materia.maxFaltas) || 1)) * 100)}%)
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {estatisticas.porcentagemMedia > 50 && (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <h4 className="text-yellow-800 font-medium">
                    Média Geral de Faltas Alta
                  </h4>
                  <p className="text-yellow-700 mt-1">
                    Sua média geral está em {Number(estatisticas.porcentagemMedia) || 0}%. 
                    Considere melhorar a frequência.
                  </p>
                </div>
              )}

              {estatisticas.materiasEmRisco === 0 && estatisticas.porcentagemMedia <= 50 && (
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <h4 className="text-green-800 font-medium">
                    Parabéns! Situação Controlada
                  </h4>
                  <p className="text-green-700 mt-1">
                    Todas as suas matérias estão com frequência adequada.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Sistema de Conquistas</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg border ${
                  estatisticas.porcentagemMedia < 25 
                    ? 'bg-yellow-50 border-yellow-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center space-x-3">
                    <FaTrophy className={`text-2xl ${
                      estatisticas.porcentagemMedia < 25 ? 'text-yellow-500' : 'text-gray-400'
                    }`} />
                    <div>
                      <h4 className="font-medium">Frequentador Exemplar</h4>
                      <p className="text-sm text-gray-600">
                        Mantenha menos de 25% de faltas em média
                      </p>
                      {estatisticas.porcentagemMedia < 25 && (
                        <p className="text-xs text-yellow-600 font-medium">Conquistado!</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-lg border ${
                  estatisticas.totalMaterias >= 5 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center space-x-3">
                    <FaTrophy className={`text-2xl ${
                      estatisticas.totalMaterias >= 5 ? 'text-blue-500' : 'text-gray-400'
                    }`} />
                    <div>
                      <h4 className="font-medium">Super Organizador</h4>
                      <p className="text-sm text-gray-600">
                        Cadastre 5 ou mais matérias
                      </p>
                      {estatisticas.totalMaterias >= 5 && (
                        <p className="text-xs text-blue-600 font-medium">Conquistado!</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-lg border ${
                  estatisticas.totalFaltas === 0 && estatisticas.totalMaterias > 0
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center space-x-3">
                    <FaTrophy className={`text-2xl ${
                      estatisticas.totalFaltas === 0 && estatisticas.totalMaterias > 0
                        ? 'text-green-500' : 'text-gray-400'
                    }`} />
                    <div>
                      <h4 className="font-medium">Presença Perfeita</h4>
                      <p className="text-sm text-gray-600">
                        Zero faltas em todas as matérias
                      </p>
                      {estatisticas.totalFaltas === 0 && estatisticas.totalMaterias > 0 && (
                        <p className="text-xs text-green-600 font-medium">Conquistado!</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-lg border ${
                  estatisticas.proximasAvaliacoes.length >= 3
                    ? 'bg-purple-50 border-purple-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center space-x-3">
                    <FaTrophy className={`text-2xl ${
                      estatisticas.proximasAvaliacoes.length >= 3 ? 'text-purple-500' : 'text-gray-400'
                    }`} />
                    <div>
                      <h4 className="font-medium">Planejador Nato</h4>
                      <p className="text-sm text-gray-600">
                        Tenha 3+ avaliações agendadas
                      </p>
                      {estatisticas.proximasAvaliacoes.length >= 3 && (
                        <p className="text-xs text-purple-600 font-medium">Conquistado!</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'gamification' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <FaTrophy className="mr-2 text-yellow-500" />
                Sistema de Gamificação
              </h3>
              
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg border">
                <div className="text-center mb-4">
                  <button
                    onClick={() => setGamificationOpen(true)}
                    className="bg-gradient-primary text-white px-8 py-3 rounded-2xl hover:shadow-medium transition-all duration-200 hover:scale-105 animate-bounce-subtle flex items-center mx-auto"
                  >
                    <FaTrophy className="mr-2" />
                    Ver Sistema Completo
                  </button>
                </div>
                
                <p className="text-center text-gray-600 text-sm">
                  Acompanhe seu progresso e conquiste níveis baseados na sua presença!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {gamificationOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60">
          <Suspense fallback={<LoadingSpinner />}>
            <GamificationSystem 
              materias={materias} 
              onClose={() => setGamificationOpen(false)} 
            />
          </Suspense>
        </div>
      )}
    </div>
  );
};

export default Dashboard;