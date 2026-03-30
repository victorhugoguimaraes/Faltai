import React, { useState } from 'react';
import { FaArrowRight, FaGoogle, FaLock } from 'react-icons/fa';
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
      <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4">
        <p className="text-sm leading-6 text-slate-600">
          Use sua conta para sincronizar matérias, horários e compromissos entre dispositivos.
        </p>
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-700">Email</label>
        <input
          className="input-modern"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-700">Senha</label>
        <input
          className="input-modern"
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />
      </div>

      <div className="grid gap-3">
        <button className="btn-primary w-full justify-center" onClick={handleLogin}>
          <FaLock />
          Entrar
        </button>
        <button className="btn-secondary w-full justify-center" onClick={handleGoogleLogin}>
          <FaGoogle />
          Entrar com Google
        </button>
        <button
          className="text-sm font-semibold text-slate-500 underline underline-offset-4"
          onClick={() => setLoginModalOpen(false)}
        >
          Cancelar
        </button>
      </div>
    </BottomSheet>
  );
}

export default LoginModal;
