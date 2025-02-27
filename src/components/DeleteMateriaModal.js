import React from 'react';
import { deleteMateria } from '../services/materiaService';

function DeleteMateriaModal({ setDeleteModalOpen, materiaToDelete, materias, setMaterias, isOnline }) {
  const handleDeleteMateria = async () => {
    const novasMaterias = await deleteMateria(materiaToDelete, materias, isOnline);
    setMaterias(novasMaterias);
    setDeleteModalOpen(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg w-full max-w-xs sm:max-w-sm">
        <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-blue-700">Confirmação</h2>
        <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
          Deseja excluir "{materias[materiaToDelete]?.nome}"? Ação irreversível.
        </p>
        <div className="flex justify-end gap-2">
          <button
            className="p-1 sm:p-2 bg-gray-400 text-white rounded-2xl hover:bg-gray-500 transition duration-200 text-xs sm:text-sm"
            onClick={() => setDeleteModalOpen(false)}
          >
            Cancelar
          </button>
          <button
            className="p-1 sm:p-2 bg-red-500 text-white rounded-2xl hover:bg-red-600 transition duration-200 text-xs sm:text-sm"
            onClick={handleDeleteMateria}
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteMateriaModal;