import React, { useState, useEffect } from 'react';
import { FaBell, FaTimes, FaClock, FaCalendarAlt } from 'react-icons/fa';
import notificationService from '../services/notificationService';

function ScheduledNotifications({ isOpen, onClose }) {
  const [scheduledNotifications, setScheduledNotifications] = useState([]);

  useEffect(() => {
    if (isOpen) {
      loadScheduledNotifications();
    }
  }, [isOpen]);

  const loadScheduledNotifications = () => {
    const notifications = notificationService.getScheduledNotifications();
    setScheduledNotifications(notifications);
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const options = {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString('pt-BR', options);
  };

  const getNotificationIcon = (notification) => {
    if (notification.type === 'weekly') {
      return <FaCalendarAlt className="text-blue-500" />;
    }
    return <FaBell className="text-orange-500" />;
  };

  const cancelNotification = (notificationId) => {
    notificationService.removeScheduledNotification(notificationId);
    loadScheduledNotifications(); // Recarrega a lista
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FaClock className="text-blue-600" />
            Notificações Agendadas
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {scheduledNotifications.length === 0 ? (
            <div className="p-6 text-center">
              <FaClock className="mx-auto text-4xl text-gray-300 mb-3" />
              <p className="text-gray-500">
                Nenhuma notificação agendada
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Adicione avaliações para receber lembretes automáticos!
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {scheduledNotifications.map(notification => (
                <div
                  key={notification.id}
                  className="p-4 hover:bg-gray-50 flex items-start justify-between gap-3"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getNotificationIcon(notification)}
                      <h3 className="font-medium text-gray-800 text-sm">
                        {notification.title}
                      </h3>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <FaClock />
                      <span>{formatDate(notification.scheduledTime)}</span>
                    </div>
                    
                    {notification.type === 'evaluation' && (
                      <div className="mt-1">
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {notification.daysAhead} dia{notification.daysAhead === 1 ? '' : 's'} antes
                        </span>
                      </div>
                    )}
                    
                    {notification.type === 'weekly' && (
                      <div className="mt-1">
                        <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Lembrete Semanal
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {notification.type !== 'weekly' && (
                    <button
                      onClick={() => cancelNotification(notification.id)}
                      className="text-gray-400 hover:text-red-600 p-1"
                      title="Cancelar notificação"
                    >
                      <FaTimes className="text-sm" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50">
          <div className="text-xs text-gray-600 space-y-1">
            <p>• Avaliações: lembretes 7, 3 e 1 dia antes</p>
            <p>• Sábados 13h: lembrete para marcar faltas</p>
            <p>• Notificações aparecem mesmo com app fechado</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ScheduledNotifications;