// Service para gerenciar notificações push agendadas
import { getPublicAssetPath } from '../utils/assets';
import { getStorageValue, setStorageValue, storageKeys } from '../utils/storage';

const getEvaluationLabel = (tipo) => {
  if (tipo === 'PROVA') {
    return 'prova';
  }

  if (tipo === 'TRABALHO') {
    return 'entrega';
  }

  return 'compromisso';
};

class NotificationService {
  constructor() {
    this.scheduledNotifications = this.getScheduledNotifications();
    this.notificationTimeouts = [];
    this.dailyCheckTimer = null;
    this.schedulerInterval = null;
    this.initialized = false;
  }

    // Método para inicializar notificações na inicialização da aplicação
  initializeNotifications() {
    // As notificações já foram carregadas no constructor
    // Verifica se precisa agendar lembrete semanal
    const hasWeeklyNotification = this.scheduledNotifications.some(
      notification => notification.type === 'weekly'
    );
    
    if (!hasWeeklyNotification) {
      this.scheduleWeeklyReminder();
    }
    
    // Atualiza o scheduler
    this.updateNotificationScheduler();
  }

  // Inicia verificação diária para manter lembretes semanais
  startDailyCheck() {
    // Limpa timer anterior se existir
    if (this.dailyCheckTimer) {
      clearInterval(this.dailyCheckTimer);
    }
    
    // Verifica a cada 6 horas se há lembrete semanal agendado
    this.dailyCheckTimer = setInterval(() => {
      const hasWeeklyNotification = this.scheduledNotifications.some(
        notification => notification.type === 'weekly'
      );
      
      if (!hasWeeklyNotification) {
        console.log('Reagendando lembrete semanal perdido...');
        this.scheduleWeeklyReminder();
      }
    }, 6 * 60 * 60 * 1000); // A cada 6 horas
  }

  // Carrega notificações salvas do localStorage
  getScheduledNotifications() {
    return getStorageValue(storageKeys.scheduledNotifications, []);
  }

  // Salva notificações agendadas no localStorage
  saveScheduledNotifications() {
    setStorageValue(storageKeys.scheduledNotifications, this.scheduledNotifications);
  }

  // Agenda notificações para uma avaliação
  scheduleEvaluationNotifications(avaliacao, materia) {
    const avaliacaoDate = new Date(avaliacao.data);
    const hoje = new Date();
    
    // Remove notificações antigas desta avaliação
    this.cancelEvaluationNotifications(avaliacao.id);
    
    // Define os dias de antecedência para notificações
    const diasAntecedencia = [7, 3, 1];
    
    diasAntecedencia.forEach(dias => {
      const notificationDate = new Date(avaliacaoDate);
      notificationDate.setDate(notificationDate.getDate() - dias);
      notificationDate.setHours(9, 0, 0, 0); // 9h da manhã
      
      // Só agenda se a data for futura
      if (notificationDate > hoje) {
        const notificationId = `eval-${avaliacao.id}-${dias}d`;
        const tipoText = getEvaluationLabel(avaliacao.tipo);
        
        const scheduledNotification = {
          id: notificationId,
          type: 'evaluation',
          title: `📚 Lembrete - ${materia}`,
          message: `Falta${dias === 1 ? '' : 'm'} ${dias} dia${dias === 1 ? '' : 's'} para ${tipoText} de ${materia}, não se esqueça!!`,
          scheduledTime: notificationDate.getTime(),
          evaluationId: avaliacao.id,
          materia: materia,
          daysAhead: dias
        };
        
        this.scheduledNotifications.push(scheduledNotification);
      }
    });
    
    this.saveScheduledNotifications();
    this.updateNotificationScheduler();
  }

  // Cancela notificações de uma avaliação específica
  cancelEvaluationNotifications(evaluationId) {
    this.scheduledNotifications = this.scheduledNotifications.filter(
      notification => notification.evaluationId !== evaluationId
    );
    this.saveScheduledNotifications();
  }

  // Agenda lembrete semanal (sábados às 13h)
  scheduleWeeklyReminder() {
    // Cancela lembrete semanal anterior
    this.scheduledNotifications = this.scheduledNotifications.filter(
      notification => notification.type !== 'weekly'
    );
    
    const proximoSabado = this.getNextSaturday();
    
    const weeklyNotification = {
      id: `weekly-reminder-${proximoSabado.getTime()}`,
      type: 'weekly',
      title: '📋 Lembrete Semanal - Faltaí',
      message: 'Lembre-se de marcar as faltas desta semana se tiver!',
      scheduledTime: proximoSabado.getTime()
    };
    
    this.scheduledNotifications.push(weeklyNotification);
    this.saveScheduledNotifications();
    this.updateNotificationScheduler();
  }

  // Obtém o próximo sábado às 13h
  getNextSaturday() {
    const agora = new Date();
    const proximoSabado = new Date();
    
    // Calcula quantos dias até o próximo sábado
    const diasParaSabado = (6 - agora.getDay() + 7) % 7;
    
    if (diasParaSabado === 0) {
      // Hoje é sábado
      if (agora.getHours() < 13) {
        // Ainda não passou das 13h, agenda para hoje
        proximoSabado.setHours(13, 0, 0, 0);
      } else {
        // Já passou das 13h, agenda para próximo sábado
        proximoSabado.setDate(agora.getDate() + 7);
        proximoSabado.setHours(13, 0, 0, 0);
      }
    } else {
      // Agenda para o próximo sábado
      proximoSabado.setDate(agora.getDate() + diasParaSabado);
      proximoSabado.setHours(13, 0, 0, 0);
    }
    
    return proximoSabado;
  }

  // Atualiza o agendador de notificações
  updateNotificationScheduler() {
    // Limpa timeouts anteriores
    if (this.notificationTimeouts) {
      this.notificationTimeouts.forEach(timeout => clearTimeout(timeout));
    }
    this.notificationTimeouts = [];
    
    const agora = Date.now();
    
    // Remove notificações que já passaram
    this.scheduledNotifications = this.scheduledNotifications.filter(notification => {
      return notification.scheduledTime > agora;
    });
    
    // Agenda as notificações restantes
    this.scheduledNotifications.forEach(notification => {
      const timeUntilNotification = notification.scheduledTime - agora;
      
      if (timeUntilNotification > 0 && timeUntilNotification <= 24 * 60 * 60 * 1000) {
        // Agenda apenas notificações nas próximas 24 horas para evitar problemas de timeout longo
        const timeout = setTimeout(() => {
          this.showPushNotification(notification);
          this.removeScheduledNotification(notification.id);
          
          // Re-agenda lembrete semanal se foi executado
          if (notification.type === 'weekly') {
            setTimeout(() => this.scheduleWeeklyReminder(), 1000);
          }
        }, timeUntilNotification);
        
        this.notificationTimeouts.push(timeout);
      }
    });
    
    this.saveScheduledNotifications();
  }

  // Mostra notificação push
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
      
      // Fecha automaticamente após 10 segundos
      setTimeout(() => {
        pushNotification.close();
      }, 10000);
      
      // Click handler para abrir o app
      pushNotification.onclick = () => {
        window.focus();
        pushNotification.close();
      };
    }
  }

  // Método para limpar recursos quando o serviço não é mais usado
  destroy() {
    if (this.notificationTimeouts) {
      this.notificationTimeouts.forEach(timeout => clearTimeout(timeout));
      this.notificationTimeouts = [];
    }
    
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

  // Remove notificação agendada
  removeScheduledNotification(notificationId) {
    this.scheduledNotifications = this.scheduledNotifications.filter(
      notification => notification.id !== notificationId
    );
    this.saveScheduledNotifications();
  }

  // Atualiza todas as notificações agendadas baseado nas matérias atuais
  updateAllScheduledNotifications(materias) {
    // Limpa todas as notificações de avaliações
    this.scheduledNotifications = this.scheduledNotifications.filter(
      notification => notification.type !== 'evaluation'
    );
    
    // Re-agenda notificações para todas as avaliações
    materias.forEach(materia => {
      if (materia.avaliacoes && Array.isArray(materia.avaliacoes)) {
        materia.avaliacoes.forEach(avaliacao => {
          this.scheduleEvaluationNotifications(avaliacao, materia.nome);
        });
      }
    });
    
    // Garante que o lembrete semanal está agendado
    this.scheduleWeeklyReminder();
    
    this.saveScheduledNotifications();
    this.updateNotificationScheduler();
  }

  // Inicializa o serviço
  init() {
    if (this.initialized) {
      this.updateNotificationScheduler();
      return;
    }

    this.initialized = true;
    this.initializeNotifications();
    this.startDailyCheck();
    this.scheduleWeeklyReminder();
    this.updateNotificationScheduler();
    
    // Atualiza o scheduler a cada hora
    this.schedulerInterval = setInterval(() => {
      this.updateNotificationScheduler();
    }, 60 * 60 * 1000);
  }

  // Solicita permissão para notificações
  async requestPermission() {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        return true;
      }

      if (Notification.permission === 'denied') {
        return false;
      }

      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  // Limpa todas as notificações agendadas
  clearAllScheduledNotifications() {
    this.scheduledNotifications = [];
    if (this.notificationTimeouts) {
      this.notificationTimeouts.forEach(timeout => clearTimeout(timeout));
      this.notificationTimeouts = [];
    }
    this.saveScheduledNotifications();
  }
}

// Instância global do serviço
const notificationService = new NotificationService();

export default notificationService;
