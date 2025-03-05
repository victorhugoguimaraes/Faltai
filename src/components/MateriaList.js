import React, { useState, memo } from 'react';
import { addFalta, removeFalta } from '../services/materiaService';
import CalendarModal from './CalendarModal';

const MateriaList = memo(({ materias, setMaterias, setEditModalOpen, setDeleteModalOpen, setEditIndex, setMateriaToDelete, isOnline }) => {
  const [selectedMateria, setSelectedMateria] = useState(null);
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);

  const handleAddFalta = async (index) => {
    const novasMaterias = await addFalta(index, materias, isOnline);
    setMaterias(novasMaterias);
  };

  const handleRemoveFalta = async (index) => {
    const novasMaterias = await removeFalta(index, materias, isOnline);
    setMaterias(novasMaterias);
  };

  const handleEdit = (index) => {
    setEditIndex(index);
    setEditModalOpen(true);
  };

  const handleDelete = (index) => {
    setMateriaToDelete(index);
    setDeleteModalOpen(true);
  };

  const handleCalendar = (index) => {
    setSelectedMateria(index);
    setCalendarModalOpen(true);
  };

  if (materias.length === 0) {
    return <p className="text-center text-gray-600 text-sm sm:text-base">Nenhuma matéria cadastrada.</p>;
  }

  return (
    <div className="space-y-4">
      {materias.map((materia, index) => (
        <div
          key={index}
          className="bg-white p-4 sm:p-6 rounded-lg shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center transition-transform hover:scale-[1.02]"
        >
          <div className="flex-grow mb-2 sm:mb-0">
            <h3 className="text-sm sm:text-base md:text-lg font-medium text-blue-600">
              {materia.nome} ({materia.horas}h)
            </h3>
            <p className="text-xs sm:text-sm text-gray-600">
              Faltas: {materia.faltas}/{materia.maxFaltas}
            </p>
          </div>
          <div className="flex gap-2 sm:gap-3">
            <button
              className={`p-2 rounded-full text-white ${materia.faltas >= materia.maxFaltas ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} transition duration-200 text-xs sm:text-sm`}
              onClick={() => handleAddFalta(index)}
              disabled={materia.faltas >= materia.maxFaltas}
            >
              +
            </button>
            <button
              className={`p-2 rounded-full text-white ${materia.faltas <= 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} transition duration-200 text-xs sm:text-sm`}
              onClick={() => handleRemoveFalta(index)}
              disabled={materia.faltas <= 0}
            >
              -
            </button>
            <button
              className="p-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition duration-200 text-xs sm:text-sm"
              onClick={() => handleEdit(index)}
            >
              Editar
            </button>
            <button
              className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-200 text-xs sm:text-sm"
              onClick={() => handleDelete(index)}
            >
              Excluir
            </button>
            <button
              className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition duration-200 text-xs sm:text-sm"
              onClick={() => handleCalendar(index)}
            >
              📅
            </button>
          </div>
        </div>
      ))}
      {calendarModalOpen && (
        <CalendarModal
          materia={materias[selectedMateria]}
          materias={materias}
          setMaterias={setMaterias}
          isOnline={isOnline}
          onClose={() => setCalendarModalOpen(false)}
        />
      )}
    </div>
  );
});

export default MateriaList;