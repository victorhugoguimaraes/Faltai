import React, { useState } from 'react';
import { FaEdit, FaTrash, FaCalendarAlt, FaPlus, FaMinus } from 'react-icons/fa';
import { auth, db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import FaltaiCalendar from './FaltaiCalendar';

function MateriaList({ materias, setMaterias, setEditModalOpen, setDeleteModalOpen, setEditIndex, setMateriaToDelete, isOnline }) {
  const [selectedMateria, setSelectedMateria] = useState(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const handleFaltaChange = async (index, delta) => {
    const materia = materias[index];
    const novasFaltas = materia.faltas + delta;

    if (novasFaltas < 0) return;
    if (novasFaltas > materia.maxFaltas) {
      alert('Número máximo de faltas atingido!');
      return;
    }

    const novasMaterias = [...materias];
    const hoje = new Date().toISOString().split('T')[0];

    if (delta > 0) {
      if (!novasMaterias[index].datasFaltas) {
        novasMaterias[index].datasFaltas = [];
      }
      for (let i = 0; i < delta; i++) {
        novasMaterias[index].datasFaltas.push(hoje);
      }
    } 
    else if (delta < 0) {
      if (novasMaterias[index].datasFaltas && novasMaterias[index].datasFaltas.length > 0) {
        novasMaterias[index].datasFaltas.pop();
      }
    }

    novasMaterias[index] = {
      ...materia,
      faltas: novasFaltas,
      datasFaltas: novasMaterias[index].datasFaltas || []
    };

    setMaterias(novasMaterias);

    if (isOnline && auth.currentUser) {
      try {
        await updateDoc(doc(db, 'usuarios', auth.currentUser.uid), {
          materias: novasMaterias
        });
      } catch (error) {
        console.error('Erro ao atualizar faltas:', error);
      }
    }

    localStorage.setItem('materias', JSON.stringify(novasMaterias));
  };

  const handleEdit = (index) => {
    setEditIndex(index);
    setEditModalOpen(true);
  };

  const handleDelete = (index) => {
    setMateriaToDelete(index);
    setDeleteModalOpen(true);
  };

  const handleCalendarClick = (index) => {
    setSelectedMateria(index);
    setCalendarOpen(true);
  };

  const calcularPorcentagemFaltas = (materia) => {
    return ((materia.faltas / materia.maxFaltas) * 100).toFixed(0);
  };

  const getStatusColor = (porcentagem) => {
    if (porcentagem >= 100) return 'bg-red-500';
    if (porcentagem >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-4">
      {materias.map((materia, index) => {
        const porcentagemFaltas = calcularPorcentagemFaltas(materia);
        const statusColor = getStatusColor(porcentagemFaltas);
        const proximasAvaliacoes = (materia.avaliacoes || [])
          .filter(av => new Date(av.data) >= new Date())
          .sort((a, b) => new Date(a.data) - new Date(b.data))
          .slice(0, 2);

        return (
          <div
            key={index}
            className="bg-white rounded-lg shadow-sm p-4 space-y-3"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {materia.nome}
                </h3>
                <p className="text-sm text-gray-600">
                  {materia.horas}h • {materia.faltas}/{materia.maxFaltas} faltas
                </p>
                {proximasAvaliacoes.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {proximasAvaliacoes.map((av, idx) => (
                      <p key={idx} className="text-xs text-gray-500 flex items-center">
                        {av.tipo === 'PROVA' ? (
                          <span className="w-2 h-2 rounded-full bg-red-500 mr-2" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                        )}
                        {new Date(av.data).toLocaleDateString('pt-BR')}
                        {av.descricao && ` - ${av.descricao}`}
                      </p>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleCalendarClick(index)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                >
                  <FaCalendarAlt />
                </button>
                <button
                  onClick={() => handleEdit(index)}
                  className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-full transition-colors"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => handleDelete(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                >
                  <FaTrash />
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${statusColor} transition-all duration-500`}
                    style={{ width: `${porcentagemFaltas}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleFaltaChange(index, -1)}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                >
                  <FaMinus />
                </button>
                <span className="text-sm font-medium text-gray-600">
                  {porcentagemFaltas}%
                </span>
                <button
                  onClick={() => handleFaltaChange(index, 1)}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                >
                  <FaPlus />
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {calendarOpen && selectedMateria !== null && (
        <FaltaiCalendar
          materias={materias}
          setMaterias={setMaterias}
          isOnline={isOnline}
          selectedMateria={selectedMateria}
          onClose={() => setCalendarOpen(false)}
        />
      )}
    </div>
  );
}

export default MateriaList;