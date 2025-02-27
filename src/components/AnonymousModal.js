import React from 'react';

function AnonymousModal({ setAnonymousModalOpen, setLogado, setIsOnline }) {
  const handleAnonymousLogin = () => {
    setLogado(true);
    setIsOnline(false); // Garante que o modo anônimo seja offline
    setAnonymousModalOpen(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg w-full max-w-xs sm:max-w-sm">
        <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-blue-700">Modo Anônimo</h2>
        <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
          Se você conectar anonimamente, seu registro de faltas não ficará online.<br />
          Isso significa que você pode perder a contagem ao limpar dados ou trocar de dispositivo.
        </p>
        <div className="flex justify-end gap-2">
          <button
            className="p-1 sm:p-2 bg-gray-400 text-white rounded-2xl hover:bg-gray-500 transition duration-200 text-xs sm:text-sm"
            onClick={() => setAnonymousModalOpen(false)}
          >
            Cancelar
          </button>
          <button
            className="p-1 sm:p-2 bg-gray-500 text-white rounded-2xl hover:bg-gray-600 transition duration-200 text-xs sm:text-sm"
            onClick={handleAnonymousLogin}
          >
            Continuar Anônimo
          </button>
        </div>
      </div>
    </div>
  );
}

export default AnonymousModal;