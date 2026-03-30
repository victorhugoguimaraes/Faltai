import React from 'react';
import { FaCompass, FaUserSecret } from 'react-icons/fa';
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
      <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4">
        <p className="text-sm leading-6 text-slate-600">
          Se você conectar anonimamente, seu registro de faltas não ficará online.<br />
          Isso significa que você pode perder a contagem ao limpar dados ou trocar de dispositivo.
        </p>
      </div>

      <div className="grid gap-3">
        <button className="btn-primary w-full justify-center" onClick={handleAnonymousLogin}>
          <FaUserSecret />
          Continuar sem conta
        </button>
        <button
          className="text-sm font-semibold text-slate-500 underline underline-offset-4"
          onClick={() => setAnonymousModalOpen(false)}
        >
          Cancelar
        </button>
      </div>
    </BottomSheet>
  );
}

export default AnonymousModal;
