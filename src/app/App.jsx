import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { FaCalendarDay, FaChartLine, FaClipboardList, FaSignOutAlt, FaSyncAlt } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { useMaterias } from '../contexts/MateriasContext';
import notificationService from '../services/notificationService';
import { initAnalytics } from '../firebase';
import AppHeader from '../components/layout/AppHeader';
import BottomNav from '../components/layout/BottomNav';
import FloatingActionButton from '../components/layout/FloatingActionButton';
import LoadingSpinner from '../components/common/LoadingSpinner';
import HomeScreen from '../features/home/screens/HomeScreen';
import CalendarHub from '../features/calendar/screens/CalendarHub';
import AnalyticsHub from '../features/dashboard/screens/AnalyticsHub';
import MateriaList from '../components/MateriaList';
import { buildCalendarEvents, syncCalendarFile } from '../features/schedule/lib/calendarSync';
import { loadAcademicEvents } from '../features/calendar/lib/academicEvents';
import { loadTurmas } from '../features/schedule/lib/turmasStorage';
import BottomSheet from '../components/layout/BottomSheet';

const AddMateriaModal = lazy(() => import('../components/AddMateriaModal'));
const EditMateriaModal = lazy(() => import('../components/EditMateriaModal'));
const DeleteMateriaModal = lazy(() => import('../components/DeleteMateriaModal'));
const LogoutConfirmationModal = lazy(() => import('../components/LogoutConfirmationModal'));
const Dashboard = lazy(() => import('../components/Dashboard'));
const CalendarioAcademico = lazy(() => import('../components/CalendarioAcademico'));
const AvaliacoesCalendario = lazy(() => import('../components/AvaliacoesCalendario'));

const NAV_ITEMS = [
  { id: 'materias', label: 'Materias', icon: FaClipboardList },
  { id: 'agenda', label: 'Agenda', icon: FaCalendarDay },
  { id: 'analytics', label: 'Insights', icon: FaChartLine }
];

function App() {
  const { user, loading } = useAuth();
  const { materias } = useMaterias();

  const [activeView, setActiveView] = useState('materias');
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [academicCalendarOpen, setAcademicCalendarOpen] = useState(false);
  const [evaluationsCalendarOpen, setEvaluationsCalendarOpen] = useState(false);
  const [materiaCalendarOverlayOpen, setMateriaCalendarOverlayOpen] = useState(false);
  const [syncOptionsOpen, setSyncOptionsOpen] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [materiaToDelete, setMateriaToDelete] = useState(null);
  const [syncFeedback, setSyncFeedback] = useState('');

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    if (user) {
      notificationService.requestPermission().then(() => {
        notificationService.init();
        notificationService.updateAllScheduledNotifications(materias);
      });
    }
  }, [user, materias]);

  useEffect(() => {
    if (user && materias) {
      notificationService.updateAllScheduledNotifications(materias);
    }
  }, [materias, user]);

  const overview = useMemo(() => {
    const totalMaterias = materias.length;
    const totalFaltas = materias.reduce((sum, materia) => sum + (Number(materia.faltas) || 0), 0);
    const materiasEmRisco = materias.filter((materia) => {
      const faltas = Number(materia.faltas) || 0;
      const maxFaltas = Number(materia.maxFaltas) || 1;
      return maxFaltas > 0 && (faltas / maxFaltas) >= 0.75;
    }).length;

    const proximasAvaliacoes = materias
      .flatMap((materia) =>
        (materia.avaliacoes || []).map((avaliacao) => ({
          ...avaliacao,
          materia: materia.nome
        }))
      )
      .filter((avaliacao) => new Date(avaliacao.data) >= new Date())
      .sort((a, b) => new Date(a.data) - new Date(b.data))
      .slice(0, 4);

    const compromissosHoje = materias
      .flatMap((materia) => (materia.avaliacoes || []).map((avaliacao) => avaliacao.data))
      .filter((data) => data === new Date().toISOString().split('T')[0]).length;

    return {
      totalMaterias,
      totalFaltas,
      materiasEmRisco,
      compromissosHoje,
      proximasAvaliacoes
    };
  }, [materias]);

  const handleCalendarSync = async (syncMode = 'all') => {
    const academicEvents = loadAcademicEvents();
    const turmas = loadTurmas();

    const events = buildCalendarEvents({
      materias,
      academicEvents,
      turmas,
      syncMode
    });

    if (events.length === 0) {
      setSyncFeedback(
        syncMode === 'classes'
          ? 'Adicione turmas com horário antes de sincronizar as aulas.'
          : syncMode === 'commitments'
            ? 'Adicione compromissos, avaliações ou eventos antes de sincronizar.'
            : 'Adicione turmas, avaliações ou eventos antes de sincronizar.'
      );
      return;
    }

    const result = await syncCalendarFile({
      materias,
      academicEvents,
      turmas,
      syncMode
    });

    setSyncFeedback(
      result === 'shared'
        ? 'Calendário enviado para o compartilhamento do celular.'
        : 'Arquivo .ics gerado. Abra-o no celular para importar no calendário.'
    );
    setSyncOptionsOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-app-shell flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <HomeScreen />;
  }

  return (
    <div className="min-h-screen bg-app-shell text-slate-900">
      <div className="app-shell-pattern fixed inset-0 pointer-events-none" />

      {!materiaCalendarOverlayOpen && (
        <AppHeader
          user={user}
          activeView={activeView}
          totalMaterias={overview.totalMaterias}
          materiasEmRisco={overview.materiasEmRisco}
          onOpenAnalytics={() => setDashboardOpen(true)}
          onOpenLogout={() => setLogoutModalOpen(true)}
        />
      )}

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-28 pt-6 sm:px-6 lg:px-8">
        <section className="mb-6 grid gap-3 sm:grid-cols-4">
          <button
            className="card p-4 text-left transition-transform hover:-translate-y-0.5"
            onClick={() => setModalOpen(true)}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Acao rapida</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-slate-950">Adicionar materia</h2>
            <p className="mt-2 text-sm text-slate-600">Importe da UnB ou cadastre em segundos.</p>
          </button>
          <div className="card p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Materias</p>
            <strong className="mt-2 block font-display text-3xl text-slate-950">{overview.totalMaterias}</strong>
          </div>
          <div className="card p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Faltas</p>
            <strong className="mt-2 block font-display text-3xl text-slate-950">{overview.totalFaltas}</strong>
          </div>
          <div className="card p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Compromissos hoje</p>
            <strong className="mt-2 block font-display text-3xl text-slate-950">{overview.compromissosHoje}</strong>
          </div>
        </section>

        {activeView === 'materias' && (
          <section>
            <MateriaList
              setEditModalOpen={setEditModalOpen}
              setDeleteModalOpen={setDeleteModalOpen}
              setEditIndex={setEditIndex}
              setMateriaToDelete={setMateriaToDelete}
              onCalendarOverlayChange={setMateriaCalendarOverlayOpen}
            />
          </section>
        )}

        {activeView === 'agenda' && (
          <CalendarHub
            proximasAvaliacoes={overview.proximasAvaliacoes}
            onOpenAcademicCalendar={() => setAcademicCalendarOpen(true)}
            onOpenEvaluationsCalendar={() => setEvaluationsCalendarOpen(true)}
            onSyncCalendar={() => setSyncOptionsOpen(true)}
          />
        )}

        {activeView === 'analytics' && (
          <AnalyticsHub
            materias={materias}
            totalFaltas={overview.totalFaltas}
            materiasEmRisco={overview.materiasEmRisco}
            proximasAvaliacoes={overview.proximasAvaliacoes}
            onOpenDashboard={() => setDashboardOpen(true)}
            syncFeedback={syncFeedback}
          />
        )}
      </main>

      {!materiaCalendarOverlayOpen && (
        <BottomNav items={NAV_ITEMS} activeView={activeView} onChange={setActiveView} />
      )}

      {!materiaCalendarOverlayOpen && activeView === 'materias' && (
        <FloatingActionButton onClick={() => setModalOpen(true)} />
      )}

      <Suspense fallback={<LoadingSpinner size="md" />}>
        {modalOpen && <AddMateriaModal setModalOpen={setModalOpen} />}
        {editModalOpen && <EditMateriaModal setEditModalOpen={setEditModalOpen} editIndex={editIndex} />}
        {deleteModalOpen && <DeleteMateriaModal setDeleteModalOpen={setDeleteModalOpen} materiaToDelete={materiaToDelete} />}
        {logoutModalOpen && <LogoutConfirmationModal setLogoutModalOpen={setLogoutModalOpen} />}
        {dashboardOpen && <Dashboard onClose={() => setDashboardOpen(false)} />}
        {academicCalendarOpen && (
          <CalendarioAcademico
            materias={materias}
            setMaterias={() => {}}
            isOnline={false}
            onClose={() => setAcademicCalendarOpen(false)}
          />
        )}
        {evaluationsCalendarOpen && (
          <AvaliacoesCalendario
            materias={materias}
            onClose={() => setEvaluationsCalendarOpen(false)}
          />
        )}
      </Suspense>

      <BottomSheet
        isOpen={syncOptionsOpen}
        onClose={() => setSyncOptionsOpen(false)}
        title="Sincronizar calendário"
        icon={<FaSyncAlt className="text-lg sm:text-xl" />}
        className="sm:max-w-lg"
        contentClassName="space-y-3 p-4 sm:p-6"
      >
        <button
          type="button"
          onClick={() => handleCalendarSync('commitments')}
          className="w-full rounded-[1.5rem] border border-slate-200 bg-white p-4 text-left transition-colors hover:bg-slate-50"
        >
          <p className="text-sm font-semibold text-slate-900">Só compromissos</p>
          <p className="mt-1 text-sm text-slate-600">Sincroniza provas, entregas e eventos do calendário acadêmico.</p>
        </button>

        <button
          type="button"
          onClick={() => handleCalendarSync('classes')}
          className="w-full rounded-[1.5rem] border border-slate-200 bg-white p-4 text-left transition-colors hover:bg-slate-50"
        >
          <p className="text-sm font-semibold text-slate-900">Só aulas</p>
          <p className="mt-1 text-sm text-slate-600">Sincroniza somente a grade semanal das matérias com horário e sala.</p>
        </button>

        <button
          type="button"
          onClick={() => handleCalendarSync('all')}
          className="w-full rounded-[1.5rem] border border-slate-200 bg-slate-950 p-4 text-left text-white transition-colors hover:bg-slate-800"
        >
          <p className="text-sm font-semibold">Aulas e compromissos</p>
          <p className="mt-1 text-sm text-slate-200">Leva a rotina completa para o calendário do celular.</p>
        </button>
      </BottomSheet>

      <button
        type="button"
        onClick={() => setLogoutModalOpen(true)}
        className="sr-only"
      >
        <FaSignOutAlt />
      </button>
    </div>
  );
}

export default App;
