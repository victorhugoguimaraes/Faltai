import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useError } from '../contexts/ErrorContext';

function LogoutConfirmationModal({ setLogoutModalOpen }) {
  const { logout } = useAuth();
  const { addSuccess, addError } = useError();

  const handleLogout = async () => {
    try {
      logout();
      addSuccess('Logout realizado com sucesso!');
      setLogoutModalOpen(false);
    } catch (error) {
      addError('Erro ao fazer logout: ' + error.message);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="text-xl font-bold mb-4 text-danger-700">Confirmar Saída</h2>
        <p className="text-sm text-neutral-600 mb-6">
          Deseja sair? Você será desconectado e retornará à tela inicial.
        </p>
        <div className="flex justify-end gap-3">
          <button
            className="btn-secondary"
            onClick={() => setLogoutModalOpen(false)}
          >
            Cancelar
          </button>
          <button
            className="btn-danger"
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