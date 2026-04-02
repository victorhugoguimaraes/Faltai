import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import {
  FaBell,
  FaCalendarDay,
  FaChartLine,
  FaClipboardList,
  FaDownload,
  FaRegCalendarAlt,
  FaSignOutAlt,
  FaSyncAlt
} from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { useMaterias } from '../contexts/MateriasContext';
import notificationService from '../services/notificationService';
import { initAnalytics } from '../firebase';
import AppHeader from '../components/layout/AppHeader';
import BottomNav from '../components/layout/BottomNav';
import FloatingActionButton from '../components/layout/FloatingActionButton';
import SemesterStatusPanel from '../components/layout/SemesterStatusPanel';
import ReminderSettingsSheet from '../components/layout/ReminderSettingsSheet';
import LoadingSpinner from '../components/common/LoadingSpinner';
import HomeScreen from '../features/home/screens/HomeScreen';
import CalendarHub from '../features/calendar/screens/CalendarHub';
import AnalyticsHub from '../features/dashboard/screens/AnalyticsHub';
import MateriaList from '../components/MateriaList';
import { buildCalendarEvents, syncCalendarFile } from '../features/schedule/lib/calendarSync';
import { loadAcademicEvents } from '../features/calendar/lib/academicEvents';
import { loadTurmas, subscribeToTurmas, syncTurmasWithMaterias } from '../features/schedule/lib/turmasStorage';
import BottomSheet from '../components/layout/BottomSheet';
import {
  buildPushMetadata,
  loadNotificationSettings,
  persistNotificationSettings,
  reminderWeekdays
} from '../features/notifications/lib/notificationState';
import {
  isPushSupported,
  sendPushTest,
  syncPushSubscription,
  unsubscribePush,
  updatePushSettings
} from '../features/notifications/lib/pushNotifications';
import {
  getNotificationPermissionState,
  onInstallPromptChange,
  showInstallPrompt,
  updateAppBadge
} from '../utils/pwaUtils';

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

const weekdayToCode = {
  0: 'DOM',
  1: 'SEG',
  2: 'TER',
  3: 'QUA',
  4: 'QUI',
  5: 'SEX',
  6: 'SAB'
};

const weekdayLabels = {
  SEG: 'Segunda',
  TER: 'Terca',
  QUA: 'Quarta',
  QUI: 'Quinta',
  SEX: 'Sexta',
  SAB: 'Sabado'
};

const toMinutes = (timeValue = '00:00') => {
  const [hours = '0', minutes = '0'] = String(timeValue).split(':');
  return Number(hours) * 60 + Number(minutes);
};

function getUpcomingClass(turmas, now) {
  if (turmas.length === 0) {
    return null;
  }

  const currentWeekday = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const ranked = turmas
    .filter((turma) => turma.diaSemana && weekdayLabels[turma.diaSemana])
    .map((turma) => {
      const targetWeekday = Object.entries(weekdayToCode).find(([, code]) => code === turma.diaSemana)?.[0];

      if (targetWeekday === undefined) {
        return null;
      }

      let daysUntil = Number(targetWeekday) - currentWeekday;
      const turmaStartMinutes = toMinutes(turma.inicio);

      if (daysUntil < 0 || (daysUntil === 0 && turmaStartMinutes <= currentMinutes)) {
        daysUntil += 7;
      }

      return {
        ...turma,
        dayLabel: weekdayLabels[turma.diaSemana],
        daysUntil,
        startMinutes: turmaStartMinutes
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.daysUntil - right.daysUntil || left.startMinutes - right.startMinutes);

  return ranked[0] || null;
}

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
  const [remindersOpen, setRemindersOpen] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [materiaToDelete, setMateriaToDelete] = useState(null);
  const [syncFeedback, setSyncFeedback] = useState('');
  const [turmas, setTurmas] = useState(() => loadTurmas());
  const [notificationPermission, setNotificationPermission] = useState(() => getNotificationPermissionState());
  const [installPromptAvailable, setInstallPromptAvailable] = useState(false);
  const [reminderSettings, setReminderSettings] = useState(() => loadNotificationSettings());
  const [remindersFeedback, setRemindersFeedback] = useState('');
  const [pushSupported] = useState(() => isPushSupported());

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    if (user && notificationPermission === 'granted') {
      notificationService.init(reminderSettings);
      notificationService.updateAllScheduledNotifications(materias, reminderSettings);
    }
  }, [user, materias, notificationPermission, reminderSettings]);

  useEffect(() => {
    setTurmas(loadTurmas());
    return subscribeToTurmas(setTurmas);
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    syncTurmasWithMaterias(materias);
  }, [materias, user]);

  useEffect(() => onInstallPromptChange(setInstallPromptAvailable), []);

  const overview = useMemo(() => {
    const todayCode = weekdayToCode[new Date().getDay()];
    const totalMaterias = materias.length;
    const totalFaltas = materias.reduce((sum, materia) => sum + (Number(materia.faltas) || 0), 0);
    const materiasEmRisco = materias.filter((materia) => {
      const faltas = Number(materia.faltas) || 0;
      const maxFaltas = Number(materia.maxFaltas) || 1;
      return maxFaltas > 0 && faltas / maxFaltas >= 0.75;
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

    const attendancePercentage =
      totalMaterias === 0
        ? 0
        : materias.reduce((sum, materia) => {
            const faltas = Number(materia.faltas) || 0;
            const maxFaltas = Number(materia.maxFaltas) || 1;
            return sum + (maxFaltas > 0 ? (faltas / maxFaltas) * 100 : 0);
          }, 0) / totalMaterias;

    const nextClass = getUpcomingClass(turmas, new Date());
    const todayClassesCount = turmas.filter((turma) => turma.diaSemana === todayCode).length;
    const materiaMaisCritica = [...materias].sort((left, right) => {
      const leftRatio = (Number(left.faltas) || 0) / (Number(left.maxFaltas) || 1);
      const rightRatio = (Number(right.faltas) || 0) / (Number(right.maxFaltas) || 1);
      return rightRatio - leftRatio;
    })[0];

    return {
      totalMaterias,
      totalFaltas,
      materiasEmRisco,
      compromissosHoje,
      proximasAvaliacoes,
      attendancePercentage: Number(attendancePercentage.toFixed(1)) || 0,
      nextClass,
      todayClassesCount,
      materiaMaisCritica
    };
  }, [materias, turmas]);

  useEffect(() => {
    updateAppBadge(reminderSettings.attendanceAlerts ? overview.materiasEmRisco : 0);
  }, [overview.materiasEmRisco, reminderSettings.attendanceAlerts]);

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    const searchParams = new URLSearchParams(window.location.search);
    const requestedView = searchParams.get('view');
    const action = searchParams.get('action');

    if (requestedView && NAV_ITEMS.some((item) => item.id === requestedView)) {
      setActiveView(requestedView);
    }

    if (action === 'add-materia') {
      setActiveView('materias');
      setModalOpen(true);
    }

    if (action === 'review-faltas') {
      setActiveView('materias');
      window.requestAnimationFrame(() => {
        document.getElementById('materias-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    if (requestedView || action) {
      const cleanUrl = `${window.location.pathname}${window.location.hash || ''}`;
      window.history.replaceState({}, document.title, cleanUrl);
    }

    return undefined;
  }, [user]);

  const semesterStatus = useMemo(() => {
    if (overview.totalMaterias === 0) {
      return {
        tone: 'empty',
        badge: 'comecar',
        title: 'Monte sua base',
        description: 'Adicione materias e grade para o Faltai virar um painel vivo do seu semestre.'
      };
    }

    if (overview.materiasEmRisco > 0) {
      return {
        tone: 'risk',
        badge: 'alerta',
        title: 'Semana pede atencao',
        description: overview.materiaMaisCritica
          ? `${overview.materiaMaisCritica.nome} e a materia que mais pressiona agora.`
          : 'Algumas materias estao perto do limite de faltas e merecem mais presenca.'
      };
    }

    if (overview.proximasAvaliacoes.length > 0 || overview.attendancePercentage >= 55) {
      return {
        tone: 'attention',
        badge: 'ritmo',
        title: 'Semestre sob observacao',
        description: overview.proximasAvaliacoes[0]
          ? `A proxima avaliacao de ${overview.proximasAvaliacoes[0].materia} ajuda a ditar o ritmo dos proximos dias.`
          : 'Sua leitura geral esta boa, mas vale acompanhar faltas e entregas mais de perto.'
      };
    }

    return {
      tone: 'calm',
      badge: 'estavel',
      title: 'Semestre sob controle',
      description: 'A leitura geral esta saudavel. Continue marcando faltas e mantendo a grade em dia.'
    };
  }, [overview]);

  const sectionIntro = useMemo(() => {
    if (activeView === 'agenda') {
      return {
        eyebrow: 'Rotina',
        title: 'Agenda centralizada',
        description: 'Calendario academico, avaliacoes e sincronizacao no mesmo fluxo para a semana nao se perder.',
        actionLabel: 'Ver insights',
        action: () => setActiveView('analytics')
      };
    }

    if (activeView === 'analytics') {
      return {
        eyebrow: 'Leitura',
        title: 'Insights do semestre',
        description: 'Veja o que esta puxando risco, onde a presenca pesa mais e qual deve ser sua proxima decisao.',
        actionLabel: 'Abrir agenda',
        action: () => setActiveView('agenda')
      };
    }

    return {
      eyebrow: 'Execucao',
      title: 'Materias e grade no mesmo lugar',
      description: 'Acompanhe faltas, confira os horarios importados e ajuste sua rotina sem trocar de contexto.',
      actionLabel: 'Abrir agenda',
      action: () => setActiveView('agenda')
    };
  }, [activeView]);

  const nextReminderLabel = useMemo(() => {
    if (!reminderSettings.weeklyReminders) {
      return 'Lembrete semanal desativado';
    }

    const weekdayLabel =
      reminderWeekdays.find((item) => item.value === Number(reminderSettings.weeklyReminderDay))?.label || 'Sabado';

    return `${weekdayLabel}, ${reminderSettings.weeklyReminderTime}`;
  }, [reminderSettings]);

  const handleCalendarSync = async (syncMode = 'all') => {
    const academicEvents = loadAcademicEvents();
    const currentTurmas = loadTurmas();

    const events = buildCalendarEvents({
      materias,
      academicEvents,
      turmas: currentTurmas,
      syncMode
    });

    if (events.length === 0) {
      setSyncFeedback(
        syncMode === 'classes'
          ? 'Adicione turmas com horario antes de sincronizar as aulas.'
          : syncMode === 'commitments'
            ? 'Adicione compromissos, avaliacoes ou eventos antes de sincronizar.'
            : 'Adicione turmas, avaliacoes ou eventos antes de sincronizar.'
      );
      return;
    }

    const result = await syncCalendarFile({
      materias,
      academicEvents,
      turmas: currentTurmas,
      syncMode
    });

    setSyncFeedback(
      result === 'shared'
        ? 'Calendario enviado para o compartilhamento do celular.'
        : 'Arquivo .ics gerado. Abra-o no celular para importar no calendario.'
    );
    setSyncOptionsOpen(false);
  };

  const handleEnableNotifications = async () => {
    const granted = await notificationService.requestPermission();
    const nextPermission = getNotificationPermissionState();
    setNotificationPermission(nextPermission);

    if (granted) {
      const pushMetadata = buildPushMetadata(materias);
      notificationService.init(reminderSettings, materias);
      notificationService.updateAllScheduledNotifications(materias, reminderSettings);
      if (pushSupported) {
        await syncPushSubscription({ settings: reminderSettings, metadata: pushMetadata });
      }
      setRemindersFeedback('Notificacoes ativadas com sucesso.');
    }
  };

  const handleInstallApp = async () => {
    const installed = await showInstallPrompt();

    if (installed) {
      setInstallPromptAvailable(false);
    }
  };

  const handleOpenWeeklySchedule = () => {
    setActiveView('materias');
    window.requestAnimationFrame(() => {
      document.getElementById('grade-semanal')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const handleReminderSettingChange = (field, value) => {
    setReminderSettings((current) => ({
      ...current,
      [field]: value
    }));
  };

  const handleSaveReminderSettings = () => {
    const savedSettings = persistNotificationSettings(reminderSettings);
    const pushMetadata = buildPushMetadata(materias);
    setReminderSettings(savedSettings);

    if (notificationPermission === 'granted') {
      notificationService.syncSettings(savedSettings, materias);
      if (pushSupported) {
        updatePushSettings({ settings: savedSettings, metadata: pushMetadata }).catch(() => {});
      }

      if (!savedSettings.systemNotifications && pushSupported) {
        unsubscribePush().catch(() => {});
      }

      setRemindersFeedback('Lembretes atualizados.');
    } else {
      setRemindersFeedback('Preferencias salvas. Ative as notificacoes para receber os lembretes.');
    }
  };

  const handleSendReminderTest = async () => {
    let granted = notificationPermission === 'granted';

    if (!granted) {
      granted = await notificationService.requestPermission();
      setNotificationPermission(getNotificationPermissionState());
    }

    if (!granted) {
      setRemindersFeedback('Permita notificacoes para testar os lembretes.');
      return;
    }

    notificationService.sendTestNotification();

    if (pushSupported) {
      try {
        await syncPushSubscription({ settings: reminderSettings, metadata: buildPushMetadata(materias) });
        await sendPushTest();
        setRemindersFeedback('Push de teste enviado pela API.');
        return;
      } catch (_error) {
        setRemindersFeedback('Teste local enviado. O push remoto ainda nao foi entregue.');
        return;
      }
    }

    setRemindersFeedback('Notificacao de teste enviada.');
  };

  useEffect(() => {
    if (!user || !pushSupported || notificationPermission !== 'granted' || !reminderSettings.systemNotifications) {
      return;
    }

    updatePushSettings({
      settings: reminderSettings,
      metadata: buildPushMetadata(materias)
    }).catch(() => {});
  }, [materias, reminderSettings, notificationPermission, pushSupported, user]);

  const mobileHeroTitle =
    activeView === 'materias'
      ? overview.totalMaterias === 0
        ? 'Comece pelas materias'
        : semesterStatus.title
      : sectionIntro.title;

  const mobileHeroDescription =
    activeView === 'materias'
      ? overview.totalMaterias === 0
        ? 'Adicione suas materias para ativar a grade, os lembretes e o painel do semestre.'
        : overview.nextClass
          ? `Proxima aula: ${overview.nextClass.nome} em ${overview.nextClass.dayLabel}, ${overview.nextClass.inicio}.`
          : 'Marque faltas e mantenha sua grade em dia sem sair da tela principal.'
      : sectionIntro.description;

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

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col overflow-x-clip px-4 pb-40 pt-4 sm:px-6 sm:pb-36 sm:pt-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
          {!materiaCalendarOverlayOpen && (
            <div className="hidden xl:block">
              <SemesterStatusPanel
                activeView={activeView}
                status={semesterStatus}
                nextClass={overview.nextClass}
                nextEvaluation={overview.proximasAvaliacoes[0] || null}
                todayClassesCount={overview.todayClassesCount}
                totalFaltas={overview.totalFaltas}
                totalMaterias={overview.totalMaterias}
                materiasEmRisco={overview.materiasEmRisco}
                attendancePercentage={overview.attendancePercentage}
                onAddMateria={() => setModalOpen(true)}
                onChangeView={setActiveView}
              />
            </div>
          )}

          <div className="min-w-0 space-y-4 sm:space-y-5">
            <section className="hero-surface rounded-[1.75rem] px-4 py-4 sm:rounded-[2rem] sm:px-6 sm:py-5">
              <div className="hidden xl:block">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-800">
                  {sectionIntro.eyebrow}
                </p>
                <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div className="max-w-2xl">
                    <h2 className="font-display text-3xl font-bold text-slate-950">{sectionIntro.title}</h2>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{sectionIntro.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={sectionIntro.action}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-soft transition-colors hover:bg-slate-50"
                  >
                    {sectionIntro.actionLabel}
                  </button>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="summary-chip">
                    <span className="summary-chip__label">Materias</span>
                    <strong className="summary-chip__value">{overview.totalMaterias}</strong>
                  </div>
                  <div className="summary-chip">
                    <span className="summary-chip__label">Faltas</span>
                    <strong className="summary-chip__value">{overview.totalFaltas}</strong>
                  </div>
                  <div className="summary-chip">
                    <span className="summary-chip__label">Compromissos hoje</span>
                    <strong className="summary-chip__value">{overview.compromissosHoje}</strong>
                  </div>
                </div>
              </div>

              <div className="space-y-3 xl:hidden">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-800">
                      {activeView === 'materias' ? 'Hoje' : sectionIntro.eyebrow}
                    </p>
                    <h2 className="mt-2 font-display text-[1.65rem] font-bold leading-tight text-slate-950">
                      {mobileHeroTitle}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {mobileHeroDescription}
                    </p>
                  </div>

                  {activeView !== 'materias' && (
                    <button
                      type="button"
                      onClick={sectionIntro.action}
                      className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-soft"
                    >
                      {sectionIntro.actionLabel}
                    </button>
                  )}
                </div>

                {activeView === 'materias' && (
                  <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <div className="summary-chip min-w-[8.2rem] px-3 py-2.5">
                      <span className="summary-chip__label">Em risco</span>
                      <strong className="summary-chip__value text-xl">{overview.materiasEmRisco}</strong>
                    </div>
                    <div className="summary-chip min-w-[8.2rem] px-3 py-2.5">
                      <span className="summary-chip__label">Aulas hoje</span>
                      <strong className="summary-chip__value text-xl">{overview.todayClassesCount}</strong>
                    </div>
                    <div className="summary-chip min-w-[8.8rem] px-3 py-2.5">
                      <span className="summary-chip__label">Faltas</span>
                      <strong className="summary-chip__value text-xl">{overview.totalFaltas}</strong>
                    </div>
                  </div>
                )}

                {activeView === 'materias' && (
                  <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <button
                      type="button"
                      onClick={() => setRemindersOpen(true)}
                      className="inline-flex min-w-max items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-soft"
                    >
                      <FaBell size={14} />
                      Lembretes
                    </button>

                    <button
                      type="button"
                      onClick={handleOpenWeeklySchedule}
                      className="inline-flex min-w-max items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-soft"
                    >
                      <FaRegCalendarAlt size={14} />
                      Ver grade semanal
                    </button>

                    {installPromptAvailable && (
                      <button
                        type="button"
                        onClick={handleInstallApp}
                        className="inline-flex min-w-max items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-soft"
                      >
                        <FaDownload size={14} />
                        Instalar app
                      </button>
                    )}

                    {notificationPermission !== 'granted' && notificationPermission !== 'unsupported' ? (
                      <button
                        type="button"
                        onClick={handleEnableNotifications}
                        className="inline-flex min-w-max items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-soft"
                      >
                        <FaBell size={14} />
                        Ativar lembretes
                      </button>
                    ) : (
                      <div className="inline-flex min-w-max items-center rounded-full bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-600">
                        {nextReminderLabel}
                      </div>
                    )}
                  </div>
                )}

                {activeView !== 'materias' && (
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="summary-chip">
                      <span className="summary-chip__label">Materias</span>
                      <strong className="summary-chip__value">{overview.totalMaterias}</strong>
                    </div>
                    <div className="summary-chip">
                      <span className="summary-chip__label">Faltas</span>
                      <strong className="summary-chip__value">{overview.totalFaltas}</strong>
                    </div>
                    <div className="summary-chip">
                      <span className="summary-chip__label">Compromissos hoje</span>
                      <strong className="summary-chip__value">{overview.compromissosHoje}</strong>
                    </div>
                  </div>
                )}
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
          </div>
        </div>
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
        title="Sincronizar calendario"
        icon={<FaSyncAlt className="text-lg sm:text-xl" />}
        className="sm:max-w-lg"
        contentClassName="space-y-3 p-4 sm:p-6"
      >
        <button
          type="button"
          onClick={() => handleCalendarSync('commitments')}
          className="w-full rounded-[1.5rem] border border-slate-200 bg-white p-4 text-left transition-colors hover:bg-slate-50"
        >
          <p className="text-sm font-semibold text-slate-900">So compromissos</p>
          <p className="mt-1 text-sm text-slate-600">Sincroniza provas, entregas e eventos do calendario academico.</p>
        </button>

        <button
          type="button"
          onClick={() => handleCalendarSync('classes')}
          className="w-full rounded-[1.5rem] border border-slate-200 bg-white p-4 text-left transition-colors hover:bg-slate-50"
        >
          <p className="text-sm font-semibold text-slate-900">So aulas</p>
          <p className="mt-1 text-sm text-slate-600">Sincroniza somente a grade semanal das materias com horario e sala.</p>
        </button>

        <button
          type="button"
          onClick={() => handleCalendarSync('all')}
          className="w-full rounded-[1.5rem] border border-slate-200 bg-slate-950 p-4 text-left text-white transition-colors hover:bg-slate-800"
        >
          <p className="text-sm font-semibold">Aulas e compromissos</p>
          <p className="mt-1 text-sm text-slate-200">Leva a rotina completa para o calendario do celular.</p>
        </button>
      </BottomSheet>

      <ReminderSettingsSheet
        isOpen={remindersOpen}
        onClose={() => setRemindersOpen(false)}
        settings={reminderSettings}
        notificationPermission={notificationPermission}
        pushSupported={pushSupported}
        nextReminderLabel={nextReminderLabel}
        feedback={remindersFeedback}
        onChange={handleReminderSettingChange}
        onEnableNotifications={handleEnableNotifications}
        onSave={handleSaveReminderSettings}
        onSendTest={handleSendReminderTest}
      />

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
