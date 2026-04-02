import React, { useState } from 'react';
import { FaArrowRight, FaGoogle, FaShieldAlt, FaUserPlus } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { useError } from '../contexts/ErrorContext';
import BottomSheet from './layout/BottomSheet';

function RegisterModal({ setRegisterModalOpen }) {
  const [registerNome, setRegisterNome] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerSenha, setRegisterSenha] = useState('');
  const { register, loginWithGoogle } = useAuth();
  const { addError } = useError();

  const handleRegister = async (e) => {
    e.preventDefault();
    const result = await register(registerNome, registerEmail, registerSenha);
    if (result.success) {
      setRegisterModalOpen(false);
      setRegisterNome('');
      setRegisterEmail('');
      setRegisterSenha('');
    } else {
      addError(result.message);
    }
  };

  const handleGoogleRegister = async () => {
    const result = await loginWithGoogle();
    if (result.success) {
      setRegisterModalOpen(false);
    } else {
      addError(result.message);
    }
  };

  return (
    <BottomSheet
      isOpen
      onClose={() => setRegisterModalOpen(false)}
      title="Criar conta"
      icon={<FaUserPlus className="text-lg sm:text-xl" />}
      className="sm:max-w-md"
      contentClassName="space-y-4 p-4 sm:p-6"
      mobileFullHeight
    >
      <div className="app-panel-muted">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-800">Conta sincronizada</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Crie sua conta para salvar faltas, agenda e compromissos com sincronização entre dispositivos.
        </p>
        <div className="mt-4 rounded-2xl bg-white px-3 py-3 text-sm text-slate-600">
          <FaShieldAlt className="mb-2 text-sky-700" />
          Seu progresso continua disponível quando você trocar de aparelho ou reinstalar o app.
        </div>
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-700">Nome</label>
          <input
            className="app-input"
            placeholder="Seu nome"
            value={registerNome}
            onChange={(e) => setRegisterNome(e.target.value)}
          />
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-700">Email</label>
          <input
            className="app-input"
            placeholder="voce@exemplo.com"
            value={registerEmail}
            onChange={(e) => setRegisterEmail(e.target.value)}
          />
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-700">Senha</label>
          <input
            className="app-input"
            type="password"
            placeholder="Defina uma senha"
            value={registerSenha}
            onChange={(e) => setRegisterSenha(e.target.value)}
          />
        </div>

        <div className="grid gap-3 pt-1">
          <button type="submit" className="btn-primary flex w-full items-center justify-center gap-2 py-3.5 text-base">
            <FaArrowRight />
            Criar conta
          </button>
          <button
            type="button"
            className="app-button-secondary w-full py-3.5 text-base text-sky-700 border-sky-200 hover:bg-sky-50"
            onClick={handleGoogleRegister}
          >
            <FaGoogle />
            Criar com Google
          </button>
          <button
            type="button"
            className="app-text-button"
            onClick={() => setRegisterModalOpen(false)}
          >
            Cancelar
          </button>
        </div>
      </form>
    </BottomSheet>
  );
}

export default RegisterModal;
