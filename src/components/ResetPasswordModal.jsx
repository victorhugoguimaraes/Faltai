import React, { useState } from 'react';
import { FaEnvelope, FaKey } from 'react-icons/fa';
import { resetPassword } from '../services/authService';
import BottomSheet from './layout/BottomSheet';

function ResetPasswordModal({ setResetModalOpen }) {
  const [resetEmail, setResetEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleReset = async (e) => {
    e.preventDefault();
    const result = await resetPassword(resetEmail);
    setMessage(result.message);
    if (result.success) {
      setTimeout(() => {
        setResetModalOpen(false);
        setResetEmail('');
        setMessage('');
      }, 2000); // Fecha o modal após 2 segundos se sucesso
    }
  };

  return (
    <BottomSheet
      isOpen
      onClose={() => setResetModalOpen(false)}
      title="Redefinir senha"
      icon={<FaKey className="text-lg sm:text-xl" />}
      className="sm:max-w-md"
      contentClassName="space-y-4 p-4 sm:p-6"
      mobileFullHeight
    >
      <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4">
        <p className="text-sm leading-6 text-slate-600">
          Insira seu email para receber um link de redefinição.
        </p>
      </div>

      {message && (
        <p className={`rounded-2xl px-4 py-3 text-sm ${message.includes('Erro') ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700'}`}>
          {message}
        </p>
      )}

      <form onSubmit={handleReset} className="space-y-4">
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-700">Email</label>
          <input
            className="input-modern"
            placeholder="Email"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
          />
        </div>

        <div className="grid gap-3 pt-2">
          <button type="submit" className="btn-primary w-full justify-center">
            <FaEnvelope />
            Enviar link
          </button>
          <button
            type="button"
            className="text-sm font-semibold text-slate-500 underline underline-offset-4"
            onClick={() => setResetModalOpen(false)}
          >
            Cancelar
          </button>
        </div>
      </form>
    </BottomSheet>
  );
}

export default ResetPasswordModal;
