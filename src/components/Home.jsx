import React, { useState } from 'react';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';
import AnonymousModal from './AnonymousModal';
import ResetPasswordModal from './ResetPasswordModal';

function Home() {
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [anonymousModalOpen, setAnonymousModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center py-8 px-4 sm:px-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center animate-fade-in">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold gradient-text mb-4">
            Faltaí
          </h1>
          <p className="text-neutral-600 text-lg">
            Controle suas faltas de forma <span className="font-semibold text-primary-600">intuitiva</span>
          </p>
        </div>
        
        <div className="card p-8 space-y-6 animate-slide-up">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-neutral-800 mb-2">
              Comece agora mesmo
            </h2>
            <p className="text-sm text-neutral-600">
              Escolha como deseja acessar o Faltaí
            </p>
          </div>

          <button
            className="btn-primary w-full text-lg hover-lift"
            onClick={() => setLoginModalOpen(true)}
          >
            Fazer Login
          </button>
          
          <button
            className="btn-secondary w-full text-lg hover-lift"
            onClick={() => setRegisterModalOpen(true)}
          >
            Criar Conta
          </button>
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-neutral-500">ou</span>
            </div>
          </div>
          
          <button
            className="w-full p-4 bg-neutral-100 text-neutral-700 border-2 border-neutral-200 rounded-xl hover:bg-neutral-200 hover:border-neutral-300 transition-all duration-200 font-medium text-lg hover-lift"
            onClick={() => setAnonymousModalOpen(true)}
          >
            Usar sem Conta
          </button>
          
          <button
            className="w-full text-primary-600 hover:text-primary-700 transition duration-200 font-medium underline"
            onClick={() => setResetModalOpen(true)}
          >
            🔑 Esqueci a senha
          </button>
        </div>
        
        <div className="glass-effect p-4 rounded-2xl text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-xl">📱</span>
            <span className="font-semibold text-neutral-700">PWA - Adicionar à Tela Inicial</span>
          </div>
          <div className="text-xs text-neutral-600 space-y-1">
            <p className="flex items-center justify-center gap-2">
              <span className="font-medium">Android:</span>
              <span>Chrome → ⋮ → "Adicionar à tela inicial"</span>
            </p>
            <p className="flex items-center justify-center gap-2">
              <span className="font-medium">iPhone:</span>
              <span>Safari → ⬆ → "Adicionar à Tela Inicial"</span>
            </p>
          </div>
        </div>
      </div>
      {loginModalOpen && <LoginModal setLoginModalOpen={setLoginModalOpen} />}
      {registerModalOpen && <RegisterModal setRegisterModalOpen={setRegisterModalOpen} />}
      {anonymousModalOpen && <AnonymousModal setAnonymousModalOpen={setAnonymousModalOpen} />}
      {resetModalOpen && <ResetPasswordModal setResetModalOpen={setResetModalOpen} />}
    </div>
  );
}

export default Home;