import React, { useState } from 'react';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';
import AnonymousModal from './AnonymousModal';
import ResetPasswordModal from './ResetPasswordModal';

function Home({ setLogado, setIsOnline }) {
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [anonymousModalOpen, setAnonymousModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-6 px-4 sm:px-6">
      <div className="w-full max-w-md space-y-6 sm:space-y-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-blue-600">
          Faltaí
        </h1>
        <div className="bg-white p-6 sm:p-8 rounded-lg shadow-sm space-y-4">
          <button
            className="w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 text-sm sm:text-base font-medium"
            onClick={() => setLoginModalOpen(true)}
          >
            Login
          </button>
          <button
            className="w-full p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200 text-sm sm:text-base font-medium"
            onClick={() => setRegisterModalOpen(true)}
          >
            Registre-se
          </button>
          <button
            className="w-full p-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition duration-200 text-sm sm:text-base font-medium"
            onClick={() => setAnonymousModalOpen(true)}
          >
            Conectar como Anônimo
          </button>
          <button
            className="w-full p-3 text-blue-600 hover:text-blue-700 transition duration-200 text-sm sm:text-base font-medium"
            onClick={() => setResetModalOpen(true)}
          >
            Esqueci a senha
          </button>
        </div>
        <div className="text-center text-gray-600 text-xs sm:text-sm">
          <p>
            <strong>Adicionar à tela inicial:</strong><br />
            <span className="block">Android: No Chrome, clique em "⋮" > "Adicionar à tela inicial".</span>
            <span className="block">iPhone: No Safari, clique em "⬆" > "Adicionar à Tela Inicial".</span>
          </p>
        </div>
      </div>
      {loginModalOpen && <LoginModal setLoginModalOpen={setLoginModalOpen} setLogado={setLogado} setIsOnline={setIsOnline} />}
      {registerModalOpen && <RegisterModal setRegisterModalOpen={setRegisterModalOpen} setLogado={setLogado} setIsOnline={setIsOnline} />}
      {anonymousModalOpen && <AnonymousModal setAnonymousModalOpen={setAnonymousModalOpen} setLogado={setLogado} setIsOnline={setIsOnline} />}
      {resetModalOpen && <ResetPasswordModal setResetModalOpen={setResetModalOpen} />}
    </div>
  );
}

export default Home;