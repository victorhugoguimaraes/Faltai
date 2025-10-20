import React, { useState } from 'react';
import { loginWithEmail, loginWithGoogle } from '../services/authService';
import RegisterModal from './RegisterModal';
import ResetPasswordModal from './ResetPasswordModal';

function Login({ setLogado, setIsOnline }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);

  const handleLogin = async () => {
    const result = await loginWithEmail(email, senha);
    if (result.success) {
      setLogado(true);
      setIsOnline(true);
      setEmail('');
      setSenha('');
    } else {
      setErro(result.message);
    }
  };

  const handleGoogleLogin = async () => {
    const result = await loginWithGoogle();
    if (result.success) {
      setLogado(true);
      setIsOnline(true);
    } else {
      setErro(result.message);
    }
  };

  const handleAnonymousMode = () => {
    setLogado(true);
    setIsOnline(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <div className="p-4 sm:p-6 bg-white rounded-2xl shadow-lg w-full max-w-xs sm:max-w-sm">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-center mb-4 sm:mb-6 text-blue-600 bg-gradient-to-r from-blue-500 to-blue-700 text-transparent bg-clip-text">
          Faltaí
        </h1>
        {erro && <p className="text-red-500 mb-3 sm:mb-4 text-center text-xs sm:text-sm">{erro}</p>}
        <input
          className="w-full p-2 sm:p-3 mb-3 sm:mb-4 border border-blue-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50 placeholder-gray-500 text-xs sm:text-sm"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full p-2 sm:p-3 mb-4 sm:mb-6 border border-blue-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50 placeholder-gray-500 text-xs sm:text-sm"
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
          className="w-full p-2 sm:p-3 mb-2 sm:mb-3 bg-blue-500 text-white rounded-2xl hover:bg-blue-600 transition duration-200 text-xs sm:text-sm"
          onClick={() => setRegisterModalOpen(true)}
        >
          Registrar
        </button>
        <button
          className="w-full p-2 sm:p-3 mb-2 sm:mb-3 bg-white text-blue-600 border border-blue-600 rounded-2xl hover:bg-blue-50 transition duration-200 text-xs sm:text-sm"
          onClick={handleGoogleLogin}
        >
          Entrar com Google
        </button>
        <button
          className="w-full p-2 sm:p-3 mb-2 sm:mb-3 bg-gray-500 text-white rounded-2xl hover:bg-gray-600 transition duration-200 text-xs sm:text-sm"
          onClick={handleAnonymousMode}
        >
          Usar Modo Anônimo (Offline)
        </button>
        <button
          className="w-full p-2 sm:p-3 bg-transparent text-blue-600 underline hover:text-blue-800 transition duration-200 text-xs sm:text-sm"
          onClick={() => setResetModalOpen(true)}
        >
          Esqueci a senha
        </button>
      </div>

      {registerModalOpen && <RegisterModal setRegisterModalOpen={setRegisterModalOpen} setErro={setErro} setLogado={setLogado} />}
      {resetModalOpen && <ResetPasswordModal setResetModalOpen={setResetModalOpen} setErro={setErro} />}
    </div>
  );
}

export default Login;