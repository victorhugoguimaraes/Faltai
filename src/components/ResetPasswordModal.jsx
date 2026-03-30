import React, { useState } from 'react';
import { resetPassword } from '../services/authService';

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg w-full max-w-xs sm:max-w-sm">
        <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-blue-700">Redefinir Senha</h2>
        <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
          Insira seu email para receber um link de redefinição.
        </p>
        {message && <p className={`text-xs sm:text-sm mb-3 sm:mb-4 text-center ${message.includes('Erro') ? 'text-red-500' : 'text-green-500'}`}>{message}</p>}
        <form onSubmit={handleReset}>
          <input
            className="w-full p-2 sm:p-3 mb-3 sm:mb-6 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50 placeholder-gray-500 text-xs sm:text-sm"
            placeholder="Email"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="p-1 sm:p-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition duration-200 text-xs sm:text-sm"
              onClick={() => setResetModalOpen(false)}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="p-1 sm:p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 text-xs sm:text-sm"
            >
              Enviar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ResetPasswordModal;