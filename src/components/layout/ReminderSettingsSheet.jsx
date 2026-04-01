import React from 'react';
import { FaBell, FaCheckCircle } from 'react-icons/fa';
import BottomSheet from './BottomSheet';
import { reminderWeekdays } from '../../features/notifications/lib/notificationState';

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-[1.4rem] border border-slate-200 bg-white px-4 py-4">
      <div>
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
      </div>
      <span className="relative mt-1 inline-flex h-6 w-11 shrink-0 items-center">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className="absolute inset-0 rounded-full bg-slate-200 transition-colors peer-checked:bg-slate-900" />
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

function ReminderSettingsSheet({
  isOpen,
  onClose,
  settings,
  notificationPermission,
  pushSupported,
  nextReminderLabel,
  feedback,
  onChange,
  onEnableNotifications,
  onSave,
  onSendTest
}) {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Lembretes"
      icon={<FaBell className="text-lg sm:text-xl" />}
      className="sm:max-w-lg"
      contentClassName="space-y-4 p-4 sm:p-6"
    >
      <div className="rounded-[1.5rem] bg-slate-950 px-4 py-4 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">Proximo lembrete</p>
        <p className="mt-2 text-sm font-semibold">{nextReminderLabel}</p>
        <p className="mt-1 text-sm text-slate-300">
          Ajuste o ritmo do lembrete semanal e teste a notificacao sem sair do app.
        </p>
      </div>

      {feedback ? (
        <div className="flex items-start gap-3 rounded-[1.4rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900">
          <FaCheckCircle className="mt-0.5 shrink-0" />
          <p className="text-sm font-medium">{feedback}</p>
        </div>
      ) : null}

      {!pushSupported && (
        <div className="rounded-[1.4rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
          Este dispositivo nao oferece suporte completo a push web. Os lembretes vao depender do app aberto.
        </div>
      )}

      {notificationPermission !== 'granted' && notificationPermission !== 'unsupported' && (
        <button
          type="button"
          onClick={onEnableNotifications}
          className="w-full rounded-[1.4rem] bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
        >
          Ativar notificacoes do sistema
        </button>
      )}

      <ToggleRow
        label="Notificacoes do sistema"
        description="Liga ou desliga todos os lembretes do Faltai."
        checked={settings.systemNotifications}
        onChange={(value) => onChange('systemNotifications', value)}
      />

      <ToggleRow
        label="Lembretes de avaliacoes"
        description="Avisa antes de provas, entregas e compromissos."
        checked={settings.evaluationReminders}
        onChange={(value) => onChange('evaluationReminders', value)}
      />

      <ToggleRow
        label="Lembrete semanal"
        description="Reserva um horario fixo para voce revisar e marcar as faltas."
        checked={settings.weeklyReminders}
        onChange={(value) => onChange('weeklyReminders', value)}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="rounded-[1.4rem] border border-slate-200 bg-white px-4 py-3">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Dia</span>
          <select
            value={settings.weeklyReminderDay}
            onChange={(event) => onChange('weeklyReminderDay', Number(event.target.value))}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800 outline-none"
          >
            {reminderWeekdays.map((weekday) => (
              <option key={weekday.value} value={weekday.value}>
                {weekday.label}
              </option>
            ))}
          </select>
        </label>

        <label className="rounded-[1.4rem] border border-slate-200 bg-white px-4 py-3">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Horario</span>
          <input
            type="time"
            value={settings.weeklyReminderTime}
            onChange={(event) => onChange('weeklyReminderTime', event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800 outline-none"
          />
        </label>
      </div>

      <ToggleRow
        label="Avisos de presenca"
        description="Mantem os sinais de risco de faltas ligados na experiencia do app."
        checked={settings.attendanceAlerts}
        onChange={(value) => onChange('attendanceAlerts', value)}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={onSendTest}
          className="rounded-[1.4rem] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
        >
          Enviar teste
        </button>
        <button
          type="button"
          onClick={onSave}
          className="rounded-[1.4rem] bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
        >
          Salvar lembretes
        </button>
      </div>
    </BottomSheet>
  );
}

export default ReminderSettingsSheet;
