import React, { useState } from 'react';
import { addFalta, removeFalta } from '../services/materiaService';
import CalendarModal from './CalendarModal';

function MateriaList({ materias, setMaterias, setEditModalOpen, setDeleteModalOpen, setEditIndex, setMateriaToDelete, isOnline }) {
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
    return <p className="text-center text-gray-600 text-xs sm:text-sm px-2 sm:px-4">Nenhuma matéria cadastrada.</p>;
  }

  return (
    <>
      {materias.map((materia, index) => (
        <div
          key={index}
          className="relative p-2 sm:p-3 mb-2 sm:mb-3 bg-white rounded-3xl shadow-md border-l-4 border-blue-300 transition-transform transform hover:scale-105 z-10 flex justify-between items-center mx-2 sm:mx-4"
        >
          <div className="flex-grow">
            <h3 className="text-sm sm:text-base font-semibold text-blue-700">
              {materia.nome} ({materia.horas}h)
            </h3>
            <p className="text-xs sm:text-sm text-gray-700">
              Faltas: {materia.faltas}/{materia.maxFaltas}
            </p>
          </div>
          <div className="flex gap-1 sm:gap-2">
            <button
              className={`p-1 sm:p-2 rounded-3xl text-white ${materia.faltas >= materia.maxFaltas ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} transition duration-200 text-xs sm:text-sm`}
              onClick={() => handleAddFalta(index)}
              disabled={materia.faltas >= materia.maxFaltas}
            >
              +
            </button>
            <button
              className={`p-1 sm:p-2 rounded-3xl text-white ${materia.faltas <= 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} transition duration-200 text-xs sm:text-sm`}
              onClick={() => handleRemoveFalta(index)}
              disabled={materia.faltas <= 0}
            >
              -
            </button>
            <button
              className="p-1 sm:p-2 bg-yellow-500 text-white rounded-3xl hover:bg-yellow-600 transition duration-200 text-xs sm:text-sm"
              onClick={() => handleEdit(index)}
            >
              Editar
            </button>
            <button
              className="p-1 sm:p-2 bg-red-600 text-white rounded-3xl hover:bg-red-700 transition duration-200 text-xs sm:text-sm"
              onClick={() => handleDelete(index)}
            >
              Excluir
            </button>
          </div>
          <button
            className="absolute right-[-30px] top-1/2 transform -translate-y-1/2 p-1 sm:p-2 bg-blue-400 text-white rounded-full hover:bg-blue-500 transition duration-200 text-xs sm:text-sm"
            onClick={() => handleCalendar(index)}
          >
            📅
          </button>
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
    </>
  );
}

export default MateriaList;