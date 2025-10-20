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
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[10000] p-0 sm:p-4">
      <div className="bg-white w-full sm:w-[360px] max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-xl border border-blue-200 transition-all duration-300">
        <div className="sticky top-0 bg-white z-10">
          <div className="sm:hidden flex justify-center pt-2 pb-1">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
          </div>
          <div className="flex justify-between items-center gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b">
            <h3 className="text-base sm:text-2xl font-bold text-blue-700 text-center flex-grow truncate">
              Faltas de {materia.nome}
            </h3>
            <button
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold transition-colors duration-200 shrink-0"
              onClick={onClose}
              aria-label="Fechar"
            >
              ×
            </button>
          </div>
        </div>
        <div className="bg-blue-50 p-4 rounded-t-xl sm:rounded-xl shadow-inner">
          <div className="overflow-x-auto">
            <Calendar
              onClickDay={handleDateClick}
              tileClassName={tileClassName}
              tileContent={tileContent}
              className="w-full min-w-[320px] border-none text-sm font-medium text-gray-700"
              value={selectedDate}
              minDetail="month"
              next2Label={null}
              prev2Label={null}
              locale="pt-BR"
              navigationLabel={({ date }) => {
                const mes = date.toLocaleString('pt-BR', { month: 'long' });
                const ano = date.toLocaleString('pt-BR', { year: 'numeric' });
                return (
                  <div className="flex items-center justify-center gap-2 min-w-0" title={`${mes} ${ano}`}>
                    <span className="truncate text-base sm:text-lg font-semibold capitalize">{mes}</span>
                    <span className="shrink-0 text-base sm:text-lg font-semibold">{ano}</span>
                  </div>
                );
              }}
            />
          </div>
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