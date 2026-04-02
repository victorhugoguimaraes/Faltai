import React from 'react';
import { FaCompass, FaExclamationTriangle, FaUserSecret } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import BottomSheet from './layout/BottomSheet';

function AnonymousModal({ setAnonymousModalOpen }) {
  const { loginAnonymously } = useAuth();

  const handleAnonymousLogin = () => {
    loginAnonymously();
    setAnonymousModalOpen(false);
  };

  return (
    <BottomSheet
      isOpen
      onClose={() => setAnonymousModalOpen(false)}
      title="Usar sem conta"
      icon={<FaCompass className="text-lg sm:text-xl" />}
      className="sm:max-w-md"
      contentClassName="space-y-4 p-4 sm:p-6"
      mobileFullHeight
    >
      <div className="rounded-[1.75rem] border border-amber-200 bg-amber-50/90 p-4 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-800">Modo local</p>
        <p className="mt-2 text-sm leading-6 text-amber-900">
          Você pode testar a interface e marcar faltas normalmente, mas os dados não ficam sincronizados online.
        </p>
      </div>

      <div className="rounded-[1.75rem] border border-white/80 bg-slate-50/90 p-4 shadow-soft">
        <div className="flex items-start gap-3">
          <FaExclamationTriangle className="mt-1 shrink-0 text-amber-600" />
          <p className="text-sm leading-6 text-slate-600">
            Se limpar os dados do navegador ou trocar de dispositivo, você pode perder a contagem salva localmente.
          </p>
        </div>
      </div>

      <div className="grid gap-3">
        <button className="btn-primary flex w-full items-center justify-center gap-2 py-3.5 text-base" onClick={handleAnonymousLogin}>
          <FaUserSecret />
          Continuar sem conta
        </button>
        <button
          className="text-sm font-semibold text-slate-500 transition-colors hover:text-slate-700"
          onClick={() => setAnonymousModalOpen(false)}
        >
          Cancelar
        </button>
      </div>
    </BottomSheet>
  );
}

export default AnonymousModal;
