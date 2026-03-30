import React, { useState } from 'react';
import { FaArrowRight, FaGoogle, FaUserPlus } from 'react-icons/fa';
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
      <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4">
        <p className="text-sm leading-6 text-slate-600">
          Crie sua conta para salvar faltas, grade e compromissos com sincronização.
        </p>
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-700">Nome</label>
          <input
            className="input-modern"
            placeholder="Nome"
            value={registerNome}
            onChange={(e) => setRegisterNome(e.target.value)}
          />
        </div>
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-700">Email</label>
          <input
            className="input-modern"
            placeholder="Email"
            value={registerEmail}
            onChange={(e) => setRegisterEmail(e.target.value)}
          />
        </div>
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-700">Senha</label>
          <input
            className="input-modern"
            type="password"
            placeholder="Senha"
            value={registerSenha}
            onChange={(e) => setRegisterSenha(e.target.value)}
          />
        </div>

        <div className="grid gap-3 pt-2">
          <button type="submit" className="btn-primary w-full justify-center">
            <FaArrowRight />
            Criar conta
          </button>
          <button type="button" className="btn-secondary w-full justify-center" onClick={handleGoogleRegister}>
            <FaGoogle />
            Criar com Google
          </button>
          <button
            type="button"
            className="text-sm font-semibold text-slate-500 underline underline-offset-4"
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
