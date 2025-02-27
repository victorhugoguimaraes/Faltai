import React from 'react';
import { logout } from '../services/authService';

function LogoutConfirmationModal({ setLogoutModalOpen, setLogado, setIsOnline, onLogout }) {
  const handleLogout = async () => {
    try {
      await logout(); // Chama a função de logout do Firebase
    } catch (error) {
      console.error('Erro ao fazer logout:', error.message);
    }
    onLogout(); // Chama a função para resetar os estados no App
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg w-full max-w-xs sm:max-w-sm">
        <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-blue-700">Confirmar Saída</h2>
        <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
          Deseja sair? Você será desconectado e retornará à tela inicial.
        </p>
        <div className="flex justify-end gap-2">
          <button
            className="p-1 sm:p-2 bg-gray-400 text-white rounded-2xl hover:bg-gray-500 transition duration-200 text-xs sm:text-sm"
            onClick={() => setLogoutModalOpen(false)}
          >
            Cancelar
          </button>
          <button
            className="p-1 sm:p-2 bg-red-600 text-white rounded-2xl hover:bg-red-700 transition duration-200 text-xs sm:text-sm"
            onClick={handleLogout}
          >
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}

export default LogoutConfirmationModal;