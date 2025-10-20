import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useError } from '../contexts/ErrorContext';

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg w-full max-w-xs sm:max-w-sm">
        <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-blue-700">Registrar</h2>
        <form onSubmit={handleRegister}>
          <input
            className="w-full p-2 sm:p-3 mb-3 sm:mb-4 border border-blue-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50 placeholder-gray-500 text-xs sm:text-sm"
            placeholder="Nome"
            value={registerNome}
            onChange={(e) => setRegisterNome(e.target.value)}
          />
          <input
            className="w-full p-2 sm:p-3 mb-3 sm:mb-4 border border-blue-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50 placeholder-gray-500 text-xs sm:text-sm"
            placeholder="Email"
            value={registerEmail}
            onChange={(e) => setRegisterEmail(e.target.value)}
          />
          <input
            className="w-full p-2 sm:p-3 mb-3 sm:mb-6 border border-blue-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50 placeholder-gray-500 text-xs sm:text-sm"
            type="password"
            placeholder="Senha"
            value={registerSenha}
            onChange={(e) => setRegisterSenha(e.target.value)}
          />
          <button
            type="submit"
            className="w-full p-2 sm:p-3 mb-2 sm:mb-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition duration-200 text-xs sm:text-sm"
          >
            Registrar
          </button>
          <button
            type="button"
            className="w-full p-2 sm:p-3 bg-white text-blue-600 border border-blue-600 rounded-2xl hover:bg-blue-50 transition duration-200 text-xs sm:text-sm flex items-center justify-center gap-2"
            onClick={handleGoogleRegister}
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
            Registrar com Google
          </button>
          <div className="flex justify-end mt-2">
            <button
              type="button"
              className="text-blue-600 underline hover:text-blue-800 text-xs sm:text-sm"
              onClick={() => setRegisterModalOpen(false)}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RegisterModal;