import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useError } from '../contexts/ErrorContext';

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg w-full max-w-xs sm:max-w-sm">
        <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-blue-700">Login</h2>
        <input
          className="w-full p-2 sm:p-3 mb-3 sm:mb-4 border border-blue-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50 placeholder-gray-500 text-xs sm:text-sm"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full p-2 sm:p-3 mb-3 sm:mb-6 border border-blue-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50 placeholder-gray-500 text-xs sm:text-sm"
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />
        <button
          className="w-full p-2 sm:p-3 mb-2 sm:mb-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition duration-200 text-xs sm:text-sm"
          onClick={handleLogin}
        >
          Entrar
        </button>
        <button
          className="w-full p-2 sm:p-3 bg-white text-blue-600 border border-blue-600 rounded-2xl hover:bg-blue-50 transition duration-200 text-xs sm:text-sm flex items-center justify-center gap-2"
          onClick={handleGoogleLogin}
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
          Entrar com Google
        </button>
        <div className="flex justify-end mt-2">
          <button
            className="text-blue-600 underline hover:text-blue-800 text-xs sm:text-sm"
            onClick={() => setLoginModalOpen(false)}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginModal;