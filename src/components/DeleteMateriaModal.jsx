import React from 'react';
import { FaTrashAlt } from 'react-icons/fa';
import { useMaterias } from '../contexts/MateriasContext';
import { useError } from '../contexts/ErrorContext';

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
    <div className="fixed inset-0 z-[10030] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-[2rem] border border-white/70 bg-white/95 p-5 shadow-strong backdrop-blur-xl sm:p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-[1.2rem] bg-rose-50 p-3 text-rose-600">
            <FaTrashAlt />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Confirmacao</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-slate-950">Excluir materia</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Deseja excluir <span className="font-semibold text-slate-900">{String(materia?.nome || 'esta materia')}</span>?
              Essa acao nao pode ser desfeita.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600"
            onClick={() => setDeleteModalOpen(false)}
          >
            Cancelar
          </button>
          <button
            className="rounded-2xl bg-rose-500 px-5 py-3 text-sm font-semibold text-white hover:bg-rose-600"
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
