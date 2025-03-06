import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { FaBell, FaTimes, FaClipboardCheck, FaBook } from 'react-icons/fa';

const NotificationManager = forwardRef(({ materias }, ref) => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useImperativeHandle(ref, () => ({
    addNotification: (notification) => {
      const notificationId = `${notification.tipo}-${notification.mensagem}`;
      
      // Evita duplicatas de notificações
      if (!notifications.some(n => n.id === notificationId)) {
        setNotifications(prev => [{
          id: notificationId,
          ...notification,
          timestamp: new Date()
        }, ...prev]);
      }
    }
  }));

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
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
    const hoje = new Date();
    const avaliacoesProximas = materias.flatMap(materia => 
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

        if (!notifications.some(n => n.id === notificationId)) {
          setNotifications(prev => [notification, ...prev]);
        }
      }
    });

    materias.forEach(materia => {
      if (materia.faltas >= materia.maxFaltas) {
        const notificationId = `max-faltas-${materia.nome}`;
        const notification = {
          id: notificationId,
          titulo: '⚠️ Limite de Faltas',
          mensagem: `Você atingiu o limite de faltas em ${materia.nome}`,
          tipo: 'alerta',
          timestamp: new Date()
        };

        if (!notifications.some(n => n.id === notificationId)) {
          setNotifications(prev => [notification, ...prev]);
        }
      }
    });
  }, [materias]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white rounded-full p-3 shadow-lg hover:bg-blue-700 transition-colors"
      >
        <FaBell />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {notifications.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">Notificações</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <p className="text-gray-500 text-center p-4">
                  Nenhuma notificação
                </p>
              ) : (
                <div className="divide-y">
                  {notifications.map(notification => (
                    <div
                      key={notification.id}
                      className="p-4 hover:bg-gray-50 flex items-start justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          {notification.avaliacao ? (
                            notification.titulo.includes('Prova') ? (
                              <FaClipboardCheck className="text-red-500" />
                            ) : (
                              <FaBook className="text-red-500" />
                            )
                          ) : (
                            <FaBell className={
                              notification.tipo === 'sucesso' ? 'text-green-500' :
                              notification.tipo === 'alerta' ? 'text-yellow-500' :
                              'text-blue-500'
                            } />
                          )}
                          <h3 className="font-medium text-gray-800">
                            {notification.titulo}
                          </h3>
                        </div>
                        <p className="text-gray-600 mt-1">{notification.mensagem}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTimeAgo(notification.timestamp)}
                        </p>
                      </div>
                      <button
                        onClick={() => removeNotification(notification.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
});

export default NotificationManager; 