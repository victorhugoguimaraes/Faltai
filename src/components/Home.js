import React, { useState } from 'react';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';
import AnonymousModal from './AnonymousModal';

function Home({ setLogado, setIsOnline }) {
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [anonymousModalOpen, setAnonymousModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <div className="p-4 sm:p-6 w-full max-w-md">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-center mb-6 sm:mb-8 text-blue-600 bg-gradient-to-r from-blue-500 to-blue-700 text-transparent bg-clip-text">
          Faltaí
        </h1>
        <div className="space-y-4">
          <button
            className="w-full p-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition duration-200 text-sm sm:text-base shadow-md"
            onClick={() => setLoginModalOpen(true)}
          >
            Login
          </button>
          <button
            className="w-full p-3 bg-blue-500 text-white rounded-2xl hover:bg-blue-600 transition duration-200 text-sm sm:text-base shadow-md"
            onClick={() => setRegisterModalOpen(true)}
          >
            Registre-se
          </button>
          <button
            className="w-full p-3 bg-gray-500 text-white rounded-2xl hover:bg-gray-600 transition duration-200 text-sm sm:text-base shadow-md"
            onClick={() => setAnonymousModalOpen(true)}
          >
            Conectar como Anônimo
          </button>
        </div>
      </div>

      {loginModalOpen && <LoginModal setLoginModalOpen={setLoginModalOpen} setLogado={setLogado} setIsOnline={setIsOnline} />}
      {registerModalOpen && <RegisterModal setRegisterModalOpen={setRegisterModalOpen} setLogado={setLogado} setIsOnline={setIsOnline} />}
      {anonymousModalOpen && <AnonymousModal setAnonymousModalOpen={setAnonymousModalOpen} setLogado={setLogado} setIsOnline={setIsOnline} />}
    </div>
  );
}

export default Home;