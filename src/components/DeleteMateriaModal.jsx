import React from 'react';
import { FaTrashAlt } from 'react-icons/fa';
import { useMaterias } from '../contexts/MateriasContext';
import { useError } from '../contexts/ErrorContext';
import BottomSheet from './layout/BottomSheet';

function DeleteMateriaModal({ setDeleteModalOpen, materiaToDelete }) {
  const { materias, excluirMateria } = useMaterias();
  const { addError, addSuccess } = useError();

  if (materiaToDelete === null || !Array.isArray(materias) || !materias[materiaToDelete]) {
    return null;
  }

  const materia = materias[materiaToDelete];

  const handleDeleteMateria = async () => {
    try {
      await excluirMateria(materiaToDelete);
      addSuccess('Materia excluida com sucesso!');
      setDeleteModalOpen(false);
    } catch (error) {
      addError('Erro ao excluir materia');
      console.error('Erro:', error);
    }
  };

  return (
    <BottomSheet
      isOpen
      onClose={() => setDeleteModalOpen(false)}
      title="Excluir materia"
      icon={<FaTrashAlt className="text-lg sm:text-xl" />}
      className="sm:max-w-md"
      contentClassName="space-y-4 p-4 sm:p-6"
    >
      <div className="app-panel-muted">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Confirmacao</p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Deseja excluir <span className="font-semibold text-slate-900">{String(materia?.nome || 'esta materia')}</span>?
          Essa acao nao pode ser desfeita.
        </p>
      </div>

      <div className="flex justify-end gap-3">
        <button className="app-button-secondary" onClick={() => setDeleteModalOpen(false)}>
          Cancelar
        </button>
        <button className="app-button-danger" onClick={handleDeleteMateria}>
          Excluir
        </button>
      </div>
    </BottomSheet>
  );
}

export default DeleteMateriaModal;
