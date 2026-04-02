import React from 'react';
import { FaBell, FaCircleCheck, FaCircleInfo, FaTriangleExclamation } from 'react-icons/fa6';
import BottomSheet from './BottomSheet';
import { reminderWeekdays } from '../../features/notifications/lib/notificationState';

function ToggleRow({ label, description, checked, onChange, statusText, helpText }) {
  return (
    <div className="app-panel !rounded-[1.4rem] !border-slate-200 !bg-white !p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">{label}</p>
          <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
        </div>
        <label className="relative mt-1 inline-flex h-6 w-11 shrink-0 items-center">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={checked}
            onChange={(event) => onChange(event.target.checked)}
          />
          <span className="absolute inset-0 rounded-full bg-slate-200 transition-colors peer-checked:bg-slate-900" />
          <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
        </label>
      </div>

      <div className="mt-3 space-y-2">
        <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${checked ? 'text-emerald-700' : 'text-slate-400'}`}>
          {statusText}
        </p>
        <p className="text-xs leading-5 text-slate-500">{helpText}</p>
      </div>
    </div>
  );
}

function StatusCard({ title, tone = 'neutral', children }) {
  const toneClass =
    tone === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
      : tone === 'warning'
        ? 'border-amber-200 bg-amber-50 text-amber-900'
        : 'border-slate-200 bg-slate-50 text-slate-700';

  return (
    <div className={`rounded-[1.4rem] border px-4 py-3 ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em]">{title}</p>
      <div className="mt-2 text-sm leading-6">{children}</div>
    </div>
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
  const permissionLabel =
    notificationPermission === 'granted'
      ? 'Permitidas'
      : notificationPermission === 'denied'
        ? 'Bloqueadas'
        : notificationPermission === 'unsupported'
          ? 'Nao suportadas'
          : 'Ainda nao ativadas';

  const canWorkWithAppClosed = pushSupported && notificationPermission === 'granted' && settings.systemNotifications;
  const systemToggleEffective = settings.systemNotifications && notificationPermission === 'granted';
  const evaluationToggleEffective = systemToggleEffective && settings.evaluationReminders;
  const weeklyToggleEffective = systemToggleEffective && settings.weeklyReminders;
  const attendanceToggleEffective = settings.attendanceAlerts;
  const weeklyReminderWeekday =
    reminderWeekdays.find((weekday) => weekday.value === Number(settings.weeklyReminderDay))?.label || 'Sabado';

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Lembretes"
      icon={<FaBell className="text-lg sm:text-xl" />}
      className="sm:max-w-xl"
      contentClassName="space-y-4 p-4 sm:p-6"
    >
      <div className="rounded-[1.6rem] bg-slate-950 px-4 py-4 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">Estado atual</p>
        <p className="mt-2 text-sm font-semibold">Notificacoes do sistema: {permissionLabel}</p>
        <p className="mt-1 text-sm text-slate-300">Proximo lembrete semanal: {nextReminderLabel}</p>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Aqui voce escolhe o que o Faltai vai te lembrar e quando isso deve acontecer.
        </p>
      </div>

      {feedback ? (
        <div className="flex items-start gap-3 rounded-[1.4rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900">
          <FaCircleCheck className="mt-0.5 shrink-0" />
          <p className="text-sm font-medium">{feedback}</p>
        </div>
      ) : null}

      <div className="grid gap-3">
        <StatusCard title="O que funciona com o app fechado" tone={canWorkWithAppClosed ? 'success' : 'warning'}>
          {canWorkWithAppClosed ? (
            <p>
              Push web esta disponivel neste dispositivo. Os lembretes podem chegar mesmo com o app fechado.
            </p>
          ) : (
            <p>
              Hoje os lembretes podem depender do app aberto ou das permissoes do navegador. Para push real, o dispositivo
              precisa suportar Web Push e as notificacoes precisam estar permitidas.
            </p>
          )}
        </StatusCard>

        <StatusCard title="O que cada grupo controla">
          <div className="space-y-2">
            <p><strong>Notificacoes do sistema</strong>: liga ou corta todos os lembretes do Faltai.</p>
            <p><strong>Lembretes de avaliacoes</strong>: avisa antes de provas, entregas e compromissos cadastrados.</p>
            <p><strong>Lembrete semanal</strong>: cria um lembrete recorrente para revisar faltas.</p>
            <p><strong>Avisos de presenca</strong>: controla os sinais de risco na experiencia do app e o badge quando suportado.</p>
          </div>
        </StatusCard>

        <StatusCard title="Como ler os estados">
          <div className="space-y-2">
            <p><strong>Ativo</strong>: a chave esta ligada e o recurso pode agir agora.</p>
            <p><strong>Parcial</strong>: a chave esta ligada, mas falta permissao do navegador ou suporte do aparelho.</p>
            <p><strong>Desligado</strong>: o Faltai nao tenta enviar ou destacar esse tipo de lembrete.</p>
          </div>
        </StatusCard>
      </div>

      {notificationPermission !== 'granted' && notificationPermission !== 'unsupported' && (
        <button
          type="button"
          onClick={onEnableNotifications}
          className="app-button-primary w-full !rounded-[1.4rem]"
        >
          Ativar notificacoes do sistema
        </button>
      )}

      {notificationPermission === 'denied' && (
        <div className="flex items-start gap-3 rounded-[1.4rem] border border-rose-200 bg-rose-50 px-4 py-3 text-rose-900">
          <FaTriangleExclamation className="mt-0.5 shrink-0" />
          <p className="text-sm font-medium">
            As notificacoes foram bloqueadas no navegador. Mesmo com as chaves abaixo ligadas, o sistema nao vai te avisar
            ate a permissao ser liberada.
          </p>
        </div>
      )}

      {!pushSupported && (
        <div className="flex items-start gap-3 rounded-[1.4rem] border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
          <FaCircleInfo className="mt-0.5 shrink-0" />
          <p className="text-sm font-medium">
            Este dispositivo nao oferece suporte completo a push web. Aqui os lembretes funcionam melhor com o app aberto.
          </p>
        </div>
      )}

      <ToggleRow
        label="Notificacoes do sistema"
        description="Chave principal do Faltai. Se ela estiver desligada, nenhum lembrete vai ser enviado."
        checked={settings.systemNotifications}
        onChange={(value) => onChange('systemNotifications', value)}
        statusText={
          settings.systemNotifications
            ? notificationPermission === 'granted'
              ? 'Ativo'
              : 'Parcial'
            : 'Desligado'
        }
        helpText={
          settings.systemNotifications
            ? notificationPermission === 'granted'
              ? 'Esta chave esta ligada e o navegador ja liberou notificacoes. O Faltai pode enviar alertas para voce.'
              : 'A chave esta ligada, mas o navegador ainda nao liberou notificacoes. Sem essa permissao, os avisos nao chegam fora da tela.'
            : 'Tudo fica desativado: lembrete semanal, avisos de avaliacoes e push remoto.'
        }
      />

      <ToggleRow
        label="Lembretes de avaliacoes"
        description="Avisa antes de provas, trabalhos e outros compromissos que voce cadastrou nas materias."
        checked={settings.evaluationReminders}
        onChange={(value) => onChange('evaluationReminders', value)}
        statusText={
          settings.evaluationReminders
            ? evaluationToggleEffective
              ? 'Ativo'
              : 'Parcial'
            : 'Desligado'
        }
        helpText={
          settings.evaluationReminders
            ? evaluationToggleEffective
              ? 'Quando voce cadastrar provas ou trabalhos, o Faltai pode avisar com antecedencia.'
              : 'A chave esta ligada, mas depende das notificacoes do sistema estarem liberadas para funcionar de verdade.'
            : 'Mesmo com avaliacoes cadastradas, nenhum aviso de prova ou entrega sera enviado.'
        }
      />

      <ToggleRow
        label="Lembrete semanal"
        description="Te lembra de revisar as faltas no mesmo dia e horario toda semana."
        checked={settings.weeklyReminders}
        onChange={(value) => onChange('weeklyReminders', value)}
        statusText={
          settings.weeklyReminders
            ? weeklyToggleEffective
              ? 'Ativo'
              : 'Parcial'
            : 'Desligado'
        }
        helpText={
          settings.weeklyReminders
            ? weeklyToggleEffective
              ? `Hoje ele esta programado para ${weeklyReminderWeekday}, ${settings.weeklyReminderTime}.`
              : `O horario continua salvo para ${weeklyReminderWeekday}, ${settings.weeklyReminderTime}, mas ainda falta liberar as notificacoes do sistema.`
            : 'Nao existe nenhum lembrete recorrente de revisao semanal configurado.'
        }
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="app-panel !rounded-[1.4rem] !border-slate-200 !bg-white !px-4 !py-3">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Dia do lembrete semanal</span>
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

        <label className="app-panel !rounded-[1.4rem] !border-slate-200 !bg-white !px-4 !py-3">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Horario do lembrete semanal</span>
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
        description="Mantem os sinais de risco dentro do app e o badge do icone quando o navegador suportar."
        checked={settings.attendanceAlerts}
        onChange={(value) => onChange('attendanceAlerts', value)}
        statusText={settings.attendanceAlerts ? (pushSupported ? 'Ativo' : 'Parcial') : 'Desligado'}
        helpText={
          settings.attendanceAlerts
            ? attendanceToggleEffective && pushSupported
              ? 'O app continua destacando materias em risco e pode usar badge no icone quando o dispositivo suportar.'
              : 'Os avisos visuais dentro do app continuam, mas badge no icone e alguns sinais externos dependem do navegador.'
            : 'O Faltai para de destacar os avisos de risco na camada de lembretes.'
        }
      />

      <div className="app-panel-muted !rounded-[1.4rem] !border-slate-200">
        <p className="text-sm font-semibold text-slate-900">Como testar</p>
        <div className="mt-2 space-y-2 text-sm leading-6 text-slate-600">
          <p>1. Ative as notificacoes do sistema.</p>
          <p>2. Salve os lembretes depois de ajustar as chaves.</p>
          <p>3. Use o botao de teste para ver se o dispositivo esta recebendo o aviso.</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={onSendTest}
          className="app-button-secondary !rounded-[1.4rem]"
        >
          Enviar teste
        </button>
        <button
          type="button"
          onClick={onSave}
          className="app-button-primary !rounded-[1.4rem]"
        >
          Salvar lembretes
        </button>
      </div>
    </BottomSheet>
  );
}

export default ReminderSettingsSheet;
