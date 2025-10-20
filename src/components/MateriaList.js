import React, { useState } from 'react';
import { FaEdit, FaTrash, FaCalendarAlt, FaPlus, FaMinus } from 'react-icons/fa';
import { useMaterias } from '../contexts/MateriasContext';
import { useError } from '../contexts/ErrorContext';
import FaltaiCalendar from './FaltaiCalendar';

function MateriaList({ setEditModalOpen, setDeleteModalOpen, setEditIndex, setMateriaToDelete }) {
  const { materias, atualizarFaltas } = useMaterias();
  const { addError } = useError();
  const [selectedMateria, setSelectedMateria] = useState(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const handleFaltaChange = async (index, delta) => {
    const materia = materias[index];
    const novasFaltas = materia.faltas + delta;

    if (novasFaltas < 0) return;
    if (novasFaltas > materia.maxFaltas) {
      addError('Número máximo de faltas atingido!');
      return;
    }

    const hoje = new Date().toISOString().split('T')[0];
    let novasDatasFaltas = [...(materia.datasFaltas || [])];

    if (delta > 0) {
      for (let i = 0; i < delta; i++) {
        novasDatasFaltas.push(hoje);
      }
    } else if (delta < 0 && novasDatasFaltas.length > 0) {
      novasDatasFaltas.pop();
    }

    try {
      await atualizarFaltas(index, novasFaltas, novasDatasFaltas);
    } catch (error) {
      addError('Erro ao atualizar faltas');
    }
  };

  const handleEdit = (index) => {
    setEditIndex(index);
    setEditModalOpen(true);
  };

  const handleDelete = (index) => {
    setMateriaToDelete(index);
    setDeleteModalOpen(true);
  };

  const openCalendar = (materia) => {
    setSelectedMateria(materias.findIndex(m => m === materia));
    setCalendarOpen(true);
  };

  if (materias.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-neutral-600">Nenhuma matéria cadastrada</p>
        <p className="text-sm text-neutral-500 mt-2">
          Adicione uma matéria para começar!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {materias.map((materia, index) => {
        const porcentagemFaltas = ((materia.faltas / materia.maxFaltas) * 100).toFixed(0);
        
        // Sistema de cores progressivo: 5 níveis
        const getBarColor = (percentage) => {
          if (percentage <= 40) return 'bg-green-500'; // Muito seguro
          if (percentage <= 60) return 'bg-lime-500'; // Seguro
          if (percentage <= 75) return 'bg-yellow-500'; // Atenção
          if (percentage <= 90) return 'bg-orange-500'; // Alerta
          return 'bg-red-500'; // Crítico
        };

        const getBarBgColor = (percentage) => {
          if (percentage <= 40) return 'bg-green-100';
          if (percentage <= 60) return 'bg-lime-100';
          if (percentage <= 75) return 'bg-yellow-100';
          if (percentage <= 90) return 'bg-orange-100';
          return 'bg-red-100';
        };

        const getTextColor = (percentage) => {
          if (percentage <= 40) return 'text-green-700';
          if (percentage <= 60) return 'text-lime-700';
          if (percentage <= 75) return 'text-yellow-700';
          if (percentage <= 90) return 'text-orange-700';
          return 'text-red-700';
        };

        const barColor = getBarColor(porcentagemFaltas);
        const barBgColor = getBarBgColor(porcentagemFaltas);
        const textColor = getTextColor(porcentagemFaltas);
        
        return (
          <div
            key={index}
            className="bg-white rounded-xl p-3 sm:p-6 shadow-soft hover-lift border border-neutral-100/50"
          >
            <div className="flex justify-between items-center mb-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-neutral-800 truncate">
                  {materia.nome}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600">
                  {materia.faltas}/{materia.maxFaltas} faltas ({materia.horas}h)
                </p>
              </div>
              
              <div className="flex gap-1 sm:gap-2 ml-2">
                <button
                  onClick={() => openCalendar(materia)}
                  className="p-1.5 sm:p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  title="Ver calendário"
                >
                  <FaCalendarAlt size={12} className="sm:w-3.5 sm:h-3.5" />
                </button>
                <button
                  onClick={() => handleEdit(index)}
                  className="p-1.5 sm:p-2 text-warning-600 hover:bg-warning-50 rounded-lg transition-colors"
                  title="Editar"
                >
                  <FaEdit size={12} className="sm:w-3.5 sm:h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(index)}
                  className="p-1.5 sm:p-2 text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                  title="Excluir"
                >
                  <FaTrash size={12} className="sm:w-3.5 sm:h-3.5" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex-1">
                <div className={`h-1.5 sm:h-2 ${barBgColor} rounded-full overflow-hidden transition-colors duration-300`}>
                  <div
                    className={`h-full ${barColor} rounded-full transition-all duration-300`}
                    style={{ width: `${porcentagemFaltas}%` }}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className={`text-xs sm:text-sm font-medium ${textColor} transition-colors duration-300`}>
                  {porcentagemFaltas}% utilizado
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleFaltaChange(index, -1)}
                    disabled={materia.faltas <= 0}
                    className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Diminuir faltas"
                  >
                    <FaMinus size={10} className="sm:w-3 sm:h-3" />
                  </button>
                  <button
                    onClick={() => handleFaltaChange(index, 1)}
                    className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-primary-500 text-white hover:bg-primary-600 rounded-full transition-colors"
                    title="Adicionar falta"
                  >
                    <FaPlus size={10} className="sm:w-3 sm:h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {calendarOpen && selectedMateria !== null && (
        <FaltaiCalendar
          selectedMateria={selectedMateria}
          onClose={() => setCalendarOpen(false)}
        />
      )}
    </div>
  );
}

export default MateriaList;
