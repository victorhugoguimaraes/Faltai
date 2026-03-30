import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { FaBell, FaBook, FaClipboardCheck, FaClock, FaCog, FaTimes } from 'react-icons/fa';
import ScheduledNotifications from './ScheduledNotifications';
import BottomSheet from './layout/BottomSheet';
import { getPublicAssetPath } from '../utils/assets';
import {
  buildAttendanceNotifications,
  buildEvaluationNotifications,
  defaultNotificationSettings,
  formatTimeAgo,
  insertNotification,
  loadNotificationSettings,
  loadStoredNotifications,
  persistNotificationSettings,
  storeNotifications
} from '../features/notifications/lib/notificationState';

function SettingsToggle({ checked, title, description, onChange }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex-1">
        <h4 className="text-sm font-medium text-slate-800 sm:text-base">{title}</h4>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <label className="relative inline-flex cursor-pointer items-center">
        <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
        <div className="h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-sky-600 peer-checked:after:translate-x-full" />
      </label>
    </div>
  );
}

const NotificationManager = forwardRef(
  ({ materias, isOpen: controlledIsOpen, onOpenChange, hideTrigger = false }, ref) => {
    const [notifications, setNotifications] = useState([]);
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const [permissionGranted, setPermissionGranted] = useState(false);
    const [scheduledNotificationsOpen, setScheduledNotificationsOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [notificationSettings, setNotificationSettings] = useState(defaultNotificationSettings);

    const isControlled = typeof controlledIsOpen === 'boolean';
    const isOpen = isControlled ? controlledIsOpen : internalIsOpen;
    const unreadCount = useMemo(() => notifications.length, [notifications]);

    const setOpen = (value) => {
      if (!isControlled) {
        setInternalIsOpen(value);
      }

      if (onOpenChange) {
        onOpenChange(value);
      }
    };

    const showSystemNotification = (notification) => {
      if (!permissionGranted || !('Notification' in window) || !notificationSettings.systemNotifications) {
        return;
      }

      const systemNotification = new Notification(notification.titulo, {
        body: notification.mensagem,
        icon: getPublicAssetPath('/icon-192.png'),
        tag: notification.id,
        requireInteraction: false,
        silent: false
      });

      setTimeout(() => systemNotification.close(), 5000);
    };

    const saveNotificationSettings = (newSettings) => {
      setNotificationSettings(newSettings);
      persistNotificationSettings(newSettings);
    };

    const pushNotification = (notification) => {
      setNotifications((current) => {
        const nextNotifications = insertNotification(current, notification);

        if (nextNotifications !== current) {
          storeNotifications(nextNotifications);

          if (document.hidden || !document.hasFocus()) {
            showSystemNotification(notification);
          }
        }

        return nextNotifications;
      });
    };

    useImperativeHandle(ref, () => ({
      addNotification: (notification) => {
        pushNotification({
          id: `${notification.tipo}-${notification.mensagem}`,
          ...notification,
          timestamp: new Date()
        });
      }
    }));

    useEffect(() => {
      setNotificationSettings(loadNotificationSettings());
      setNotifications(loadStoredNotifications());

      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          setPermissionGranted(true);
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then((permission) => {
            setPermissionGranted(permission === 'granted');
          });
        }
      }
    }, []);

    useEffect(() => {
      const now = new Date();
      const nextNotifications = [
        ...(notificationSettings.evaluationReminders ? buildEvaluationNotifications(materias, now) : []),
        ...(notificationSettings.attendanceAlerts ? buildAttendanceNotifications(materias, now) : [])
      ];

      nextNotifications.forEach((notification) => {
        pushNotification(notification);
      });
    }, [materias, notificationSettings.attendanceAlerts, notificationSettings.evaluationReminders]);

    const removeNotification = (id) => {
      setNotifications((current) => {
        const nextNotifications = current.filter((notification) => notification.id !== id);
        storeNotifications(nextNotifications);
        return nextNotifications;
      });
    };

    const settingsHeaderActions = (
      <span className="rounded-full bg-sky-50 p-2 text-sky-700">
        <FaCog className="h-4 w-4" />
      </span>
    );

    return (
      <>
        {!hideTrigger && (
          <button
            onClick={() => setOpen(true)}
            className="fixed bottom-4 right-4 z-[9999] rounded-full bg-sky-600 p-3 text-white shadow-2xl transition-all hover:scale-110 hover:bg-sky-700 active:scale-95 sm:p-4"
            style={{ touchAction: 'manipulation' }}
            aria-label="Abrir notificações"
          >
            <FaBell className="h-5 w-5 sm:h-6 sm:w-6" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white sm:h-6 sm:w-6">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        )}

        <BottomSheet
          isOpen={isOpen}
          onClose={() => setOpen(false)}
          title="Notificações"
          icon={<FaBell />}
          className="sm:max-w-md"
          contentClassName="flex max-h-[80vh] flex-col"
          headerActions={
            <>
              <button
                onClick={() => setSettingsOpen(true)}
                className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-sky-700"
                title="Configurações de notificações"
              >
                <FaCog className="h-4 w-4" />
              </button>
              <button
                onClick={() => setScheduledNotificationsOpen(true)}
                className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-sky-700"
                title="Ver notificações agendadas"
              >
                <FaClock className="h-4 w-4" />
              </button>
            </>
          }
        >
          <div className="overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-10 text-center text-slate-500">Nenhuma notificação</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-start justify-between gap-3 px-4 py-4 transition-colors hover:bg-slate-50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        {notification.avaliacao ? (
                          notification.titulo.includes('Prova') ? (
                            <FaClipboardCheck className="h-4 w-4 text-rose-500" />
                          ) : (
                            <FaBook className="h-4 w-4 text-emerald-500" />
                          )
                        ) : (
                          <FaBell
                            className={`h-4 w-4 ${
                              notification.tipo === 'sucesso'
                                ? 'text-emerald-500'
                                : notification.tipo === 'alerta'
                                  ? 'text-amber-500'
                                  : 'text-sky-500'
                            }`}
                          />
                        )}
                        <h3 className="text-sm font-medium text-slate-800 sm:text-base">{notification.titulo}</h3>
                      </div>
                      <p className="text-sm text-slate-600">{notification.mensagem}</p>
                      <p className="mt-1 text-xs text-slate-400">{formatTimeAgo(notification.timestamp)}</p>
                    </div>

                    <button
                      onClick={() => removeNotification(notification.id)}
                      className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                      aria-label="Remover notificação"
                    >
                      <FaTimes className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </BottomSheet>

        <BottomSheet
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          title="Configurações de Notificações"
          className="sm:max-w-md"
          contentClassName="p-4 pb-6 sm:p-5"
          headerActions={settingsHeaderActions}
        >
          <div className="space-y-4">
            <SettingsToggle
              checked={notificationSettings.evaluationReminders}
              title="Lembretes de Avaliações"
              description="Notificações 7, 3 e 1 dia antes"
              onChange={(event) =>
                saveNotificationSettings({
                  ...notificationSettings,
                  evaluationReminders: event.target.checked
                })
              }
            />
            <SettingsToggle
              checked={notificationSettings.weeklyReminders}
              title="Lembrete Semanal"
              description="Todo sábado às 13h para marcar faltas"
              onChange={(event) =>
                saveNotificationSettings({
                  ...notificationSettings,
                  weeklyReminders: event.target.checked
                })
              }
            />
            <SettingsToggle
              checked={notificationSettings.attendanceAlerts}
              title="Alertas de Presença"
              description="Quando atingir limite de faltas"
              onChange={(event) =>
                saveNotificationSettings({
                  ...notificationSettings,
                  attendanceAlerts: event.target.checked
                })
              }
            />
            <SettingsToggle
              checked={notificationSettings.systemNotifications}
              title="Notificações do Sistema"
              description="Notificações push quando o app não estiver em foco"
              onChange={(event) =>
                saveNotificationSettings({
                  ...notificationSettings,
                  systemNotifications: event.target.checked
                })
              }
            />

            <div className="border-t border-slate-100 pt-4 text-xs leading-relaxed text-slate-500">
              <p>• As configurações são salvas automaticamente.</p>
              <p>• Notificações do sistema requerem permissão do navegador.</p>
              <p>• As alterações afetam novas notificações.</p>
            </div>
          </div>
        </BottomSheet>

        <ScheduledNotifications
          isOpen={scheduledNotificationsOpen}
          onClose={() => setScheduledNotificationsOpen(false)}
        />
      </>
    );
  }
);

export default NotificationManager;
