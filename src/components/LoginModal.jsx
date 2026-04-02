import React, { useState } from 'react';
import {
  FaArrowRight,
  FaCalendarAlt,
  FaGoogle,
  FaLock,
  FaRegClock
} from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { useError } from '../contexts/ErrorContext';
import BottomSheet from './layout/BottomSheet';

function LoginModal({ setLoginModalOpen }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const { login, loginWithGoogle } = useAuth();
  const { addError } = useError();

  const handleLogin = async () => {
    const result = await login(email, senha);
    if (result.success) {
      setLoginModalOpen(false);
      setEmail('');
      setSenha('');
    } else {
      addError(result.message);
    }
  };

  const handleGoogleLogin = async () => {
    const result = await loginWithGoogle();
    if (result.success) {
      setLoginModalOpen(false);
    } else {
      addError(result.message);
    }
  };

  return (
    <BottomSheet
      isOpen
      onClose={() => setLoginModalOpen(false)}
      title="Entrar"
      icon={<FaArrowRight className="text-lg sm:text-xl" />}
      className="sm:max-w-md"
      contentClassName="space-y-4 p-4 sm:p-6"
      mobileFullHeight
    >
      <div className="app-panel-muted">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-800">Sincronização</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Use sua conta para manter matérias, horários e compromissos alinhados entre dispositivos.
        </p>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <div className="rounded-2xl bg-white px-3 py-3 text-sm text-slate-600">
            <FaCalendarAlt className="mb-2 text-sky-700" />
            Horários e eventos no mesmo estado.
          </div>
          <div className="rounded-2xl bg-white px-3 py-3 text-sm text-slate-600">
            <FaRegClock className="mb-2 text-sky-700" />
            Continue de onde parou sem reconfigurar.
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-700">Email</label>
        <input
          className="app-input"
          placeholder="voce@exemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-700">Senha</label>
        <input
          className="app-input"
          type="password"
          placeholder="Sua senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />
      </div>

      <div className="grid gap-3 pt-1">
        <button className="btn-primary flex w-full items-center justify-center gap-2 py-3.5 text-base" onClick={handleLogin}>
          <FaLock />
          Entrar
        </button>
        <button
          className="app-button-secondary w-full py-3.5 text-base text-sky-700 border-sky-200 hover:bg-sky-50"
          onClick={handleGoogleLogin}
        >
          <FaGoogle />
          Entrar com Google
        </button>
        <button
          className="app-text-button"
          onClick={() => setLoginModalOpen(false)}
        >
          Cancelar
        </button>
      </div>
    </BottomSheet>
  );
}

export default LoginModal;
