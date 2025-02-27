import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

function CalendarModal({ materia, materias, setMaterias, isOnline, onClose }) {
  const [selectedDate, setSelectedDate] = useState(null);

  const handleDateClick = async (date) => {
    if (!Array.isArray(materias)) {
      console.error('materias não é um array:', materias);
      return;
    }

    const novasMaterias = [...materias];
    const materiaIndex = novasMaterias.findIndex(m => m.nome === materia.nome);

    if (materiaIndex === -1) return;

    const dateStr = date.toISOString().split('T')[0];
    novasMaterias[materiaIndex].datasFaltas = novasMaterias[materiaIndex].datasFaltas || [];

    const faltaExistente = novasMaterias[materiaIndex].datasFaltas.includes(dateStr);

    if (!faltaExistente && novasMaterias[materiaIndex].faltas < novasMaterias[materiaIndex].maxFaltas) {
      novasMaterias[materiaIndex].faltas += 1;
      novasMaterias[materiaIndex].datasFaltas.push(dateStr);
    } else if (faltaExistente) {
      novasMaterias[materiaIndex].faltas -= 1;
      novasMaterias[materiaIndex].datasFaltas = novasMaterias[materiaIndex].datasFaltas.filter(d => d !== dateStr);
    }

    if (isOnline && auth.currentUser) {
      await setDoc(doc(db, 'usuarios', auth.currentUser.uid), { materias: novasMaterias });
    }

    setMaterias(novasMaterias);
    setSelectedDate(date);
  };

  const tileClassName = ({ date }) => {
    const dateStr = date.toISOString().split('T')[0];
    const isFalta = materia.datasFaltas && materia.datasFaltas.includes(dateStr);
    const isToday = dateStr === new Date().toISOString().split('T')[0];

    return [
      'transition-all duration-200 ease-in-out',
      'rounded-full w-8 h-8 flex items-center justify-center mx-auto',
      isFalta ? 'border-2 border-blue-600' : 'hover:border hover:border-blue-200',
      isToday && !isFalta ? 'border-2 border-blue-300' : '',
    ].filter(Boolean).join(' ');
  };

  const tileContent = ({ date }) => {
    const dateStr = date.toISOString().split('T')[0];
    if (materia.datasFaltas && materia.datasFaltas.includes(dateStr)) {
      return <div className="text-sm font-bold text-blue-600">●</div>;
    }
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-xl w-[320px] sm:w-[360px] max-w-sm border border-blue-200 transition-all duration-300">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl sm:text-2xl font-bold text-blue-700 text-center flex-grow">
            Faltas de {materia.nome}
          </h3>
          <button
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold transition-colors duration-200"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="bg-blue-50 p-4 rounded-xl shadow-inner">
          <Calendar
            onClickDay={handleDateClick}
            tileClassName={tileClassName}
            tileContent={tileContent}
            className="w-full border-none text-sm font-medium text-gray-700"
            value={selectedDate}
            minDetail="month"
            next2Label={null}
            prev2Label={null}
            navigationLabel={({ date }) => (
              <span className="text-lg font-semibold text-blue-600">
                {date.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </span>
            )}
          />
          <div className="mt-4 text-xs text-gray-600 text-center">
            Clique para adicionar/remover faltas ({materia.faltas}/{materia.maxFaltas})
          </div>
        </div>
      </div>

      <style jsx>{`
        .react-calendar {
          background: transparent;
          font-family: 'Inter', sans-serif;
        }
        .react-calendar__tile {
          padding: 0.5rem;
          transition: border 0.2s, transform 0.2s;
        }
        .react-calendar__tile:hover {
          transform: scale(1.05);
        }
      `}</style>
    </div>
  );
}

export default CalendarModal;