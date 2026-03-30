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

export const defaultNotificationSettings = {
  evaluationReminders: true,
  weeklyReminders: true,
  attendanceAlerts: true,
  systemNotifications: true
};

export const loadNotificationSettings = () =>
  getStorageValue(storageKeys.notificationSettings, defaultNotificationSettings);

export const persistNotificationSettings = (settings) => {
  setStorageValue(storageKeys.notificationSettings, settings);
  return settings;
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
        mensagem = `Amanhã tem ${tipoLabel} de ${avaliacao.materia}`;
      } else if (diasAteAvaliacao <= 7) {
        mensagem = `Daqui a ${diasAteAvaliacao} dias tem ${tipoLabel} de ${avaliacao.materia}`;
      } else {
        const semanas = Math.ceil(diasAteAvaliacao / 7);
        mensagem = `Daqui a ${semanas} semana${semanas > 1 ? 's' : ''} tem ${tipoLabel} de ${avaliacao.materia}`;
      }

      return {
        id: notificationId,
        titulo: avaliacao.tipo === 'PROVA' ? '📝 Prova Próxima' : '📚 Compromisso Próximo',
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
      titulo: '⚠️ Limite de Faltas',
      mensagem: `Você atingiu o limite de faltas em ${materia.nome}`,
      tipo: 'alerta',
      timestamp: now
    }));

export const formatTimeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  const intervals = {
    ano: 31536000,
    mês: 2592000,
    semana: 604800,
    dia: 86400,
    hora: 3600,
    minuto: 60
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `há ${interval} ${unit}${interval > 1 ? (unit === 'mês' ? 'es' : 's') : ''}`;
    }
  }

  return 'agora mesmo';
};
