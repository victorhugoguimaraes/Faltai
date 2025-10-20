import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { FaBell, FaTimes, FaClipboardCheck, FaBook, FaClock, FaCog } from 'react-icons/fa';
import ScheduledNotifications from './ScheduledNotifications';

const NotificationManager = forwardRef(({ materias }, ref) => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [scheduledNotificationsOpen, setScheduledNotificationsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // Configurações padrão das notificações
  const [notificationSettings, setNotificationSettings] = useState({
    evaluationReminders: true,    // Lembretes de avaliações (7, 3, 1 dia)
    weeklyReminders: true,        // Lembrete semanal de faltas
    attendanceAlerts: true,       // Alertas de limite de faltas
    systemNotifications: true     // Notificações do sistema
  });

  // Solicita permissão para notificações do sistema
  useEffect(() => {
    // Carrega configurações salvas
    const savedSettings = localStorage.getItem('notification_settings');
    if (savedSettings) {
      try {
        setNotificationSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Erro ao carregar configurações:', e);
      }
    }
    
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        setPermissionGranted(true);
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          setPermissionGranted(permission === 'granted');
        });
      }
    }
  }, []);

  // Função para mostrar notificação do sistema
  const showSystemNotification = (notification) => {
    if (permissionGranted && 'Notification' in window && notificationSettings.systemNotifications) {
      const systemNotification = new Notification(notification.titulo, {
        body: notification.mensagem,
        icon: '/icon-192.png',
        tag: notification.id,
        requireInteraction: false,
        silent: false
      });
      
      setTimeout(() => systemNotification.close(), 5000);
    }
  };

  // Salva configurações no localStorage
  const saveNotificationSettings = (newSettings) => {
    setNotificationSettings(newSettings);
    localStorage.setItem('notification_settings', JSON.stringify(newSettings));
  };

  useImperativeHandle(ref, () => ({
    addNotification: (notification) => {
      const notificationId = `${notification.tipo}-${notification.mensagem}`;
      
      // Evita duplicatas de notificações
      setNotifications(prev => {
        if (!prev.some(n => n.id === notificationId)) {
          const newNotification = {
            id: notificationId,
            ...notification,
            timestamp: new Date()
          };
          const updatedNotifications = [newNotification, ...prev];
          
          // Salva no localStorage
          localStorage.setItem('app_notifications', JSON.stringify(updatedNotifications));
          
          // Mostra notificação do sistema se a app não estiver em foco
          if (document.hidden || !document.hasFocus()) {
            showSystemNotification(newNotification);
          }
          
          return updatedNotifications;
        }
        return prev;
      });
    }
  }));

  const removeNotification = (id) => {
    setNotifications(prev => {
      const updatedNotifications = prev.filter(n => n.id !== id);
      localStorage.setItem('app_notifications', JSON.stringify(updatedNotifications));
      return updatedNotifications;
    });
  };

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
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

  useEffect(() => {
    // Carrega notificações salvas no localStorage
    const savedNotifications = localStorage.getItem('app_notifications');
    if (savedNotifications) {
      try {
        const parsed = JSON.parse(savedNotifications);
        // Filtra notificações antigas (mais de 7 dias)
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const validNotifications = parsed.filter(n => new Date(n.timestamp) > weekAgo);
        setNotifications(validNotifications);
        
        // Atualiza localStorage removendo notificações antigas
        if (validNotifications.length !== parsed.length) {
          localStorage.setItem('app_notifications', JSON.stringify(validNotifications));
        }
      } catch (e) {
        console.error('Erro ao carregar notificações:', e);
      }
    }

    const hoje = new Date();
    const avaliacoesProximas = (materias || []).flatMap(materia => 
      (materia.avaliacoes || []).map(av => ({
        ...av,
        materia: materia.nome,
        data: new Date(av.data)
      }))
    ).filter(av => av.data >= hoje)
    .sort((a, b) => a.data - b.data);

    avaliacoesProximas.forEach(av => {
      const diasAteAvaliacao = Math.ceil((av.data - hoje) / (1000 * 60 * 60 * 24));
      const notificationId = `${av.id}-${av.data}`;
      
      let mensagem = '';
      if (diasAteAvaliacao === 0) {
        mensagem = `Hoje tem ${av.tipo === 'PROVA' ? 'prova' : 'trabalho'} de ${av.materia}`;
      } else if (diasAteAvaliacao === 1) {
        mensagem = `Amanhã tem ${av.tipo === 'PROVA' ? 'prova' : 'trabalho'} de ${av.materia}`;
      } else if (diasAteAvaliacao <= 7) {
        mensagem = `Daqui a ${diasAteAvaliacao} dias tem ${av.tipo === 'PROVA' ? 'prova' : 'trabalho'} de ${av.materia}`;
      } else if (diasAteAvaliacao <= 14) {
        const semanas = Math.ceil(diasAteAvaliacao / 7);
        mensagem = `Daqui a ${semanas} semana${semanas > 1 ? 's' : ''} tem ${av.tipo === 'PROVA' ? 'prova' : 'trabalho'} de ${av.materia}`;
      }

      if (mensagem) {
        const notification = {
          id: notificationId,
          titulo: av.tipo === 'PROVA' ? '📝 Prova Próxima' : '📚 Trabalho Próximo',
          mensagem,
          tipo: 'info',
          timestamp: new Date(),
          avaliacao: true
        };

        setNotifications(prev => {
          if (!prev.some(n => n.id === notificationId)) {
            const updatedNotifications = [notification, ...prev];
            localStorage.setItem('app_notifications', JSON.stringify(updatedNotifications));
            return updatedNotifications;
          }
          return prev;
        });
      }
    });

    (materias || []).forEach(materia => {
      if (materia.faltas >= materia.maxFaltas) {
        const notificationId = `max-faltas-${materia.nome}`;
        const notification = {
          id: notificationId,
          titulo: '⚠️ Limite de Faltas',
          mensagem: `Você atingiu o limite de faltas em ${materia.nome}`,
          tipo: 'alerta',
          timestamp: new Date()
        };

        setNotifications(prev => {
          if (!prev.some(n => n.id === notificationId)) {
            const updatedNotifications = [notification, ...prev];
            localStorage.setItem('app_notifications', JSON.stringify(updatedNotifications));
            return updatedNotifications;
          }
          return prev;
        });
      }
    });
  }, [materias]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white rounded-full p-3 sm:p-4 shadow-2xl hover:bg-blue-700 transition-all z-[9999] hover:scale-110 active:scale-95"
        style={{ touchAction: 'manipulation' }}
        aria-label="Abrir notificações"
      >
        <FaBell className="w-5 h-5 sm:w-6 sm:h-6" />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center animate-pulse">
            {notifications.length > 99 ? '99+' : notifications.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-[10000] p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-lg w-full sm:max-w-md max-h-[90vh] sm:max-h-[80vh] flex flex-col shadow-2xl">
              <div className="sm:hidden flex justify-center pt-2 pb-1">
                <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
              </div>
            
              <div className="flex justify-between items-center p-3 sm:p-4 border-b sticky top-0 bg-white z-10">
                <h2 className="text-base sm:text-lg font-semibold text-gray-800">Notificações</h2>
                <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setSettingsOpen(true)}
                  className="text-gray-600 hover:text-blue-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Configurações de notificações"
              >
                  <FaCog className="w-4 h-4" />
              </button>
              <button
                onClick={() => setScheduledNotificationsOpen(true)}
                  className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                title="Ver notificações agendadas"
              >
                  <FaClock className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                  <FaTimes className="w-5 h-5" />
              </button>
            </div>
          </div>            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                  <p className="text-gray-500 text-center p-8 sm:p-12">
                  Nenhuma notificação
                </p>
              ) : (
                <div className="divide-y">
                  {notifications.map(notification => (
                    <div
                      key={notification.id}
                        className="p-3 sm:p-4 hover:bg-gray-50 active:bg-gray-100 flex items-start justify-between gap-2 sm:gap-4"
                    >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                          {notification.avaliacao ? (
                            notification.titulo.includes('Prova') ? (
                                <FaClipboardCheck className="text-red-500 w-4 h-4" />
                            ) : (
                                <FaBook className="text-red-500 w-4 h-4" />
                            )
                          ) : (
                            <FaBell className={
                                'w-4 h-4 ' + (
                              notification.tipo === 'sucesso' ? 'text-green-500' :
                              notification.tipo === 'alerta' ? 'text-yellow-500' :
                                'text-blue-500')
                            } />
                          )}
                            <h3 className="font-medium text-gray-800 text-sm sm:text-base">
                            {notification.titulo}
                          </h3>
                        </div>
                          <p className="text-gray-600 text-sm sm:text-base mt-1">{notification.mensagem}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTimeAgo(notification.timestamp)}
                        </p>
                      </div>
                      <button
                        onClick={() => removeNotification(notification.id)}
                          className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded"
                      >
                          <FaTimes className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <ScheduledNotifications 
        isOpen={scheduledNotificationsOpen}
        onClose={() => setScheduledNotificationsOpen(false)}
      />
      
      {/* Modal de Configurações de Notificações */}
      {settingsOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-[10001] p-0 sm:p-4">
            <div className="bg-white rounded-t-3xl sm:rounded-lg w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
              <div className="sm:hidden flex justify-center pt-2 pb-1 sticky top-0 bg-white z-10">
                <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
              </div>
            
              <div className="flex justify-between items-center p-3 sm:p-4 border-b sticky top-4 sm:top-0 bg-white z-10">
                <h2 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <FaCog className="text-blue-600 w-4 h-4 sm:w-5 sm:h-5" />
                Configurações de Notificações
              </h2>
              <button
                onClick={() => setSettingsOpen(false)}
                  className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg"
              >
                  <FaTimes className="w-5 h-5" />
              </button>
            </div>

              <div className="p-3 sm:p-4 space-y-4 pb-6">
              <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800 text-sm sm:text-base">Lembretes de Avaliações</h4>
                    <p className="text-xs text-gray-500">Notificações 7, 3 e 1 dia antes</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.evaluationReminders}
                      onChange={(e) => saveNotificationSettings({
                        ...notificationSettings,
                        evaluationReminders: e.target.checked
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800 text-sm sm:text-base">Lembrete Semanal</h4>
                    <p className="text-xs text-gray-500">Todo sábado às 13h para marcar faltas</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.weeklyReminders}
                      onChange={(e) => saveNotificationSettings({
                        ...notificationSettings,
                        weeklyReminders: e.target.checked
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800 text-sm sm:text-base">Alertas de Presença</h4>
                    <p className="text-xs text-gray-500">Quando atingir limite de faltas</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.attendanceAlerts}
                      onChange={(e) => saveNotificationSettings({
                        ...notificationSettings,
                        attendanceAlerts: e.target.checked
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800 text-sm sm:text-base">Notificações do Sistema</h4>
                    <p className="text-xs text-gray-500">Notificações push quando app fechado</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.systemNotifications}
                      onChange={(e) => saveNotificationSettings({
                        ...notificationSettings,
                        systemNotifications: e.target.checked
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

                <div className="pt-3 sm:pt-4 border-t">
                  <div className="text-xs text-gray-600 space-y-1 leading-relaxed">
                  <p>• As configurações são salvas automaticamente</p>
                  <p>• Notificações do sistema requerem permissão do navegador</p>
                  <p>• Alterações afetam apenas novas notificações</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

export default NotificationManager; 