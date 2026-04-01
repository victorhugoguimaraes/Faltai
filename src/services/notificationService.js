import { getPublicAssetPath } from '../utils/assets';
import { getStorageValue, setStorageValue, storageKeys } from '../utils/storage';
import {
  buildWeeklyReminderCopy,
  defaultNotificationSettings,
  loadNotificationSettings,
  normalizeNotificationSettings
} from '../features/notifications/lib/notificationState';

const getEvaluationLabel = (tipo) => {
  if (tipo === 'PROVA') {
    return 'prova';
  }

  if (tipo === 'TRABALHO') {
    return 'entrega';
  }

  return 'compromisso';
};

const parseTime = (timeValue = '13:00') => {
  const [hours = '13', minutes = '00'] = String(timeValue).split(':');
  return {
    hours: Number(hours),
    minutes: Number(minutes)
  };
};

class NotificationService {
  constructor() {
    this.scheduledNotifications = this.getScheduledNotifications();
    this.notificationTimeouts = [];
    this.dailyCheckTimer = null;
    this.schedulerInterval = null;
    this.initialized = false;
  }

  getScheduledNotifications() {
    return getStorageValue(storageKeys.scheduledNotifications, []);
  }

  saveScheduledNotifications() {
    setStorageValue(storageKeys.scheduledNotifications, this.scheduledNotifications);
  }

  getSettings() {
    return normalizeNotificationSettings(loadNotificationSettings());
  }

  initializeNotifications(settings = this.getSettings(), materias = []) {
    if (settings.weeklyReminders) {
      const hasWeeklyNotification = this.scheduledNotifications.some(
        (notification) => notification.type === 'weekly'
      );

      if (!hasWeeklyNotification) {
        this.scheduleWeeklyReminder(settings, materias);
      }
    } else {
      this.removeNotificationsByType('weekly');
    }

    this.updateNotificationScheduler();
  }

  startDailyCheck() {
    if (this.dailyCheckTimer) {
      clearInterval(this.dailyCheckTimer);
    }

    this.dailyCheckTimer = setInterval(() => {
      const settings = this.getSettings();

      if (!settings.weeklyReminders) {
        return;
      }

      const hasWeeklyNotification = this.scheduledNotifications.some(
        (notification) => notification.type === 'weekly'
      );

      if (!hasWeeklyNotification) {
        this.scheduleWeeklyReminder(settings);
      }
    }, 6 * 60 * 60 * 1000);
  }

  removeNotificationsByType(type) {
    this.scheduledNotifications = this.scheduledNotifications.filter(
      (notification) => notification.type !== type
    );
    this.saveScheduledNotifications();
  }

  scheduleEvaluationNotifications(avaliacao, materia, settings = this.getSettings()) {
    this.cancelEvaluationNotifications(avaliacao.id);

    if (!settings.systemNotifications || !settings.evaluationReminders) {
      return;
    }

    const avaliacaoDate = new Date(avaliacao.data);
    const now = new Date();
    const diasAntecedencia = [7, 3, 1];

    diasAntecedencia.forEach((dias) => {
      const notificationDate = new Date(avaliacaoDate);
      notificationDate.setDate(notificationDate.getDate() - dias);
      notificationDate.setHours(9, 0, 0, 0);

      if (notificationDate > now) {
        const notificationId = `eval-${avaliacao.id}-${dias}d`;
        const tipoText = getEvaluationLabel(avaliacao.tipo);

        this.scheduledNotifications.push({
          id: notificationId,
          type: 'evaluation',
          title: `Lembrete - ${materia}`,
          message: `Faltam ${dias} dia${dias === 1 ? '' : 's'} para ${tipoText} de ${materia}.`,
          scheduledTime: notificationDate.getTime(),
          evaluationId: avaliacao.id,
          materia,
          daysAhead: dias
        });
      }
    });
  }

  cancelEvaluationNotifications(evaluationId) {
    this.scheduledNotifications = this.scheduledNotifications.filter(
      (notification) => notification.evaluationId !== evaluationId
    );
    this.saveScheduledNotifications();
  }

  getNextWeeklyOccurrence(settings = this.getSettings()) {
    const { weeklyReminderDay, weeklyReminderTime } = settings;
    const { hours, minutes } = parseTime(weeklyReminderTime);
    const now = new Date();
    const next = new Date(now);

    next.setHours(hours, minutes, 0, 0);

    let daysUntil = (Number(weeklyReminderDay) - now.getDay() + 7) % 7;

    if (daysUntil === 0 && next <= now) {
      daysUntil = 7;
    }

    next.setDate(now.getDate() + daysUntil);
    return next;
  }

  scheduleWeeklyReminder(settings = this.getSettings(), materias = []) {
    this.removeNotificationsByType('weekly');

    if (!settings.systemNotifications || !settings.weeklyReminders) {
      return;
    }

    const nextReminder = this.getNextWeeklyOccurrence(settings);
    const reminderCopy = buildWeeklyReminderCopy(materias);

    this.scheduledNotifications.push({
      id: `weekly-reminder-${nextReminder.getTime()}`,
      type: 'weekly',
      title: reminderCopy.title,
      message: reminderCopy.body,
      scheduledTime: nextReminder.getTime()
    });

    this.saveScheduledNotifications();
    this.updateNotificationScheduler();
  }

  updateNotificationScheduler() {
    this.notificationTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.notificationTimeouts = [];

    const now = Date.now();
    this.scheduledNotifications = this.scheduledNotifications.filter(
      (notification) => notification.scheduledTime > now
    );

    this.scheduledNotifications.forEach((notification) => {
      const timeUntilNotification = notification.scheduledTime - now;

      if (timeUntilNotification > 0 && timeUntilNotification <= 24 * 60 * 60 * 1000) {
        const timeout = setTimeout(() => {
          this.showPushNotification(notification);
          this.removeScheduledNotification(notification.id);

          if (notification.type === 'weekly') {
            this.scheduleWeeklyReminder(this.getSettings());
          }
        }, timeUntilNotification);

        this.notificationTimeouts.push(timeout);
      }
    });

    this.saveScheduledNotifications();
  }

  showPushNotification(notification) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const pushNotification = new Notification(notification.title, {
        body: notification.message,
        icon: getPublicAssetPath('/icon-192.png'),
        badge: getPublicAssetPath('/icon-192.png'),
        tag: notification.id,
        requireInteraction: true,
        silent: false,
        vibrate: [200, 100, 200]
      });

      setTimeout(() => {
        pushNotification.close();
      }, 10000);

      pushNotification.onclick = () => {
        window.focus();
        pushNotification.close();
      };
    }
  }

  sendTestNotification() {
    this.showPushNotification({
      id: `test-${Date.now()}`,
      title: 'Faltai',
      message: 'Lembrete de teste: suas notificacoes estao funcionando.'
    });
  }

  removeScheduledNotification(notificationId) {
    this.scheduledNotifications = this.scheduledNotifications.filter(
      (notification) => notification.id !== notificationId
    );
    this.saveScheduledNotifications();
  }

  updateAllScheduledNotifications(materias, settings = this.getSettings()) {
    this.scheduledNotifications = this.scheduledNotifications.filter(
      (notification) => !['evaluation', 'weekly'].includes(notification.type)
    );

    if (settings.systemNotifications && settings.evaluationReminders) {
      (materias || []).forEach((materia) => {
        if (Array.isArray(materia.avaliacoes)) {
          materia.avaliacoes.forEach((avaliacao) => {
            this.scheduleEvaluationNotifications(avaliacao, materia.nome, settings);
          });
        }
      });
    }

    if (settings.systemNotifications && settings.weeklyReminders) {
      this.scheduleWeeklyReminder(settings, materias);
    } else {
      this.removeNotificationsByType('weekly');
      this.updateNotificationScheduler();
    }

    this.saveScheduledNotifications();
    this.updateNotificationScheduler();
  }

  syncSettings(settings = defaultNotificationSettings, materias = []) {
    const normalized = normalizeNotificationSettings(settings);

    if (!normalized.systemNotifications) {
      this.clearAllScheduledNotifications();
      return normalized;
    }

    this.updateAllScheduledNotifications(materias, normalized);
    return normalized;
  }

  init(settings = this.getSettings(), materias = []) {
    if (this.initialized) {
      this.startDailyCheck();
      this.updateNotificationScheduler();
      return;
    }

    this.initialized = true;
    this.initializeNotifications(settings, materias);
    this.startDailyCheck();
    this.updateNotificationScheduler();

    this.schedulerInterval = setInterval(() => {
      this.updateNotificationScheduler();
    }, 60 * 60 * 1000);
  }

  async requestPermission() {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  clearAllScheduledNotifications() {
    this.scheduledNotifications = [];
    this.notificationTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.notificationTimeouts = [];
    this.saveScheduledNotifications();
  }

  destroy() {
    this.notificationTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.notificationTimeouts = [];

    if (this.dailyCheckTimer) {
      clearInterval(this.dailyCheckTimer);
      this.dailyCheckTimer = null;
    }

    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }

    this.initialized = false;
  }
}

const notificationService = new NotificationService();

export default notificationService;
