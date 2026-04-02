import React from 'react';
import { FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { useError } from '../contexts/ErrorContext';
import BottomSheet from './layout/BottomSheet';

function LogoutConfirmationModal({ setLogoutModalOpen }) {
  const { logout } = useAuth();
  const { addSuccess, addError } = useError();

  const handleLogout = async () => {
    try {
      await logout();
      addSuccess('Logout realizado com sucesso!');
      setLogoutModalOpen(false);
    } catch (error) {
      addError(`Erro ao fazer logout: ${error.message}`);
    }
  };

  return (
    <BottomSheet
      isOpen
      onClose={() => setLogoutModalOpen(false)}
      title="Confirmar saida"
      icon={<FaSignOutAlt className="text-lg sm:text-xl" />}
      className="sm:max-w-md"
      contentClassName="space-y-4 p-4 sm:p-6"
    >
      <div className="app-panel-muted">
        <p className="text-sm leading-6 text-slate-600">
          Deseja sair? Você será desconectado e retornará para a tela inicial.
        </p>
      </div>

      <div className="flex justify-end gap-3">
        <button className="app-button-secondary" onClick={() => setLogoutModalOpen(false)}>
          Cancelar
        </button>
        <button className="app-button-danger" onClick={handleLogout}>
          Sair
        </button>
      </div>
    </BottomSheet>
  );
}

export default LogoutConfirmationModal;
