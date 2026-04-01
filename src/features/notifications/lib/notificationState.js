import { getStorageValue, setStorageValue, storageKeys } from '../../../utils/storage';

const getEvaluationLabel = (tipo) => {
  if (tipo === 'PROVA') {
    return 'prova';
  }

  if (tipo === 'TRABALHO') {
    return 'entrega';
  }

  return 'compromisso';
};

export const reminderWeekdays = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terca' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sabado' }
];

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export const defaultNotificationSettings = {
  evaluationReminders: true,
  weeklyReminders: true,
  attendanceAlerts: true,
  systemNotifications: true,
  weeklyReminderDay: 6,
  weeklyReminderTime: '13:00'
};

export const normalizeNotificationSettings = (settings = {}) => {
  const merged = {
    ...defaultNotificationSettings,
    ...(settings || {})
  };

  const reminderDay = Number(merged.weeklyReminderDay);
  const validDay = Number.isInteger(reminderDay) && reminderDay >= 0 && reminderDay <= 6 ? reminderDay : 6;
  const validTime = /^\d{2}:\d{2}$/.test(String(merged.weeklyReminderTime))
    ? String(merged.weeklyReminderTime)
    : '13:00';

  return {
    ...merged,
    evaluationReminders: Boolean(merged.evaluationReminders),
    weeklyReminders: Boolean(merged.weeklyReminders),
    attendanceAlerts: Boolean(merged.attendanceAlerts),
    systemNotifications: Boolean(merged.systemNotifications),
    weeklyReminderDay: validDay,
    weeklyReminderTime: validTime
  };
};

export const loadNotificationSettings = () =>
  normalizeNotificationSettings(getStorageValue(storageKeys.notificationSettings, defaultNotificationSettings));

export const persistNotificationSettings = (settings) => {
  const normalized = normalizeNotificationSettings(settings);
  setStorageValue(storageKeys.notificationSettings, normalized);
  return normalized;
};

export const pruneNotifications = (notifications) => {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return notifications.filter((notification) => new Date(notification.timestamp) > weekAgo);
};

export const storeNotifications = (notifications) => {
  setStorageValue(storageKeys.appNotifications, notifications);
  return notifications;
};

export const loadStoredNotifications = () =>
  pruneNotifications(getStorageValue(storageKeys.appNotifications, []));

export const insertNotification = (notifications, notification) => {
  if (notifications.some((item) => item.id === notification.id)) {
    return notifications;
  }

  return [notification, ...notifications];
};

export const buildEvaluationNotifications = (materias, now = new Date()) => {
  return (materias || [])
    .flatMap((materia) =>
      (materia.avaliacoes || []).map((avaliacao) => ({
        ...avaliacao,
        materia: materia.nome,
        data: new Date(avaliacao.data)
      }))
    )
    .filter((avaliacao) => avaliacao.data >= now)
    .sort((a, b) => a.data - b.data)
    .map((avaliacao) => {
      const diasAteAvaliacao = Math.ceil((avaliacao.data - now) / (1000 * 60 * 60 * 24));
      const notificationId = `${avaliacao.id}-${avaliacao.data.toISOString()}`;

      if (diasAteAvaliacao > 14) {
        return null;
      }

      let mensagem = '';
      const tipoLabel = getEvaluationLabel(avaliacao.tipo);

      if (diasAteAvaliacao === 0) {
        mensagem = `Hoje tem ${tipoLabel} de ${avaliacao.materia}`;
      } else if (diasAteAvaliacao === 1) {
        mensagem = `Amanha tem ${tipoLabel} de ${avaliacao.materia}`;
      } else if (diasAteAvaliacao <= 7) {
        mensagem = `Daqui a ${diasAteAvaliacao} dias tem ${tipoLabel} de ${avaliacao.materia}`;
      } else {
        const semanas = Math.ceil(diasAteAvaliacao / 7);
        mensagem = `Daqui a ${semanas} semana${semanas > 1 ? 's' : ''} tem ${tipoLabel} de ${avaliacao.materia}`;
      }

      return {
        id: notificationId,
        titulo: avaliacao.tipo === 'PROVA' ? 'Prova proxima' : 'Compromisso proximo',
        mensagem,
        tipo: 'info',
        timestamp: now,
        avaliacao: true
      };
    })
    .filter(Boolean);
};

export const buildAttendanceNotifications = (materias, now = new Date()) =>
  (materias || [])
    .filter((materia) => materia.faltas >= materia.maxFaltas)
    .map((materia) => ({
      id: `max-faltas-${materia.nome}`,
      titulo: 'Limite de faltas',
      mensagem: `Voce atingiu o limite de faltas em ${materia.nome}`,
      tipo: 'alerta',
      timestamp: now
    }));

export const buildWeeklyReminderCopy = (materias = [], now = new Date()) => {
  if (!Array.isArray(materias) || materias.length === 0) {
    return {
      title: 'Faltai',
      body: 'Reserve um minuto para revisar as faltas da semana e manter o semestre organizado.'
    };
  }

  const totalFaltas = materias.reduce((sum, materia) => sum + (Number(materia?.faltas) || 0), 0);
  const materiasEmRisco = materias.filter((materia) => {
    const faltas = Number(materia?.faltas) || 0;
    const maxFaltas = Number(materia?.maxFaltas) || 1;
    return maxFaltas > 0 && faltas / maxFaltas >= 0.75;
  });

  const latestAttendanceUpdate = materias
    .map((materia) => materia?.lastFaltasUpdateAt)
    .filter(Boolean)
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((left, right) => right.getTime() - left.getTime())[0];

  const daysSinceLastUpdate = latestAttendanceUpdate
    ? Math.floor((now.getTime() - latestAttendanceUpdate.getTime()) / DAY_IN_MS)
    : null;

  if (materiasEmRisco.length > 0) {
    return {
      title: 'Faltai',
      body: `Tem materia pedindo presenca. ${materiasEmRisco[0].nome} merece uma checagem nas faltas hoje.`
    };
  }

  if (totalFaltas > 0 && daysSinceLastUpdate !== null && daysSinceLastUpdate >= 14) {
    return {
      title: 'Faltai',
      body: 'Nossa, ou voce parou de faltar ou esqueceu de atualizar. Bora conferir suas faltas?'
    };
  }

  if (totalFaltas > 0 && daysSinceLastUpdate !== null && daysSinceLastUpdate >= 7) {
    return {
      title: 'Faltai',
      body: 'Faz uns dias que suas faltas nao mudam. Vale abrir o app e confirmar se esta tudo em dia.'
    };
  }

  if (totalFaltas === 0 && daysSinceLastUpdate !== null && daysSinceLastUpdate >= 14) {
    return {
      title: 'Faltai',
      body: 'Semana calma ou controle esquecido? Passa no app e garante que as faltas continuam zeradas mesmo.'
    };
  }

  return {
    title: 'Faltai',
    body: 'Hora de revisar as faltas da semana e deixar o semestre em ordem.'
  };
};

export const buildPushMetadata = (materias = [], now = new Date()) => {
  const weeklyReminder = buildWeeklyReminderCopy(materias, now);

  return {
    weeklyReminderTitle: weeklyReminder.title,
    weeklyReminderBody: weeklyReminder.body,
    totalMaterias: Array.isArray(materias) ? materias.length : 0,
    totalFaltas: Array.isArray(materias)
      ? materias.reduce((sum, materia) => sum + (Number(materia?.faltas) || 0), 0)
      : 0
  };
};
