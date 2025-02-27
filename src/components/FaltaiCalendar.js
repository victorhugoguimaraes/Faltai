import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { auth, db } from './firebase';
import { doc, updateDoc } from 'firebase/firestore';

function FaltaiCalendar({ materias, setMaterias, isOnline, selectedMateria, setSelectedMateria }) {
  const [selectedDate, setSelectedDate] = useState(null);

  const handleDateClick = async (date) => {
    if (selectedMateria === null || selectedMateria < 0 || selectedMateria >= materias.length) {
      console.log('Matéria inválida:', selectedMateria);
      return;
    }

    const novasMaterias = [...materias];
    const dateStr = date.toISOString().split('T')[0];
    novasMaterias[selectedMateria].datasFaltas = novasMaterias[selectedMateria].datasFaltas || [];

    const hasFalta = novasMaterias[selectedMateria].datasFaltas.includes(dateStr);

    if (!hasFalta && novasMaterias[selectedMateria].faltas < novasMaterias[selectedMateria].maxFaltas) {
      novasMaterias[selectedMateria].faltas += 1;
      novasMaterias[selectedMateria].datasFaltas.push(dateStr);
    } else if (hasFalta) {
      novasMaterias[selectedMateria].faltas -= 1;
      novasMaterias[selectedMateria].datasFaltas = novasMaterias[selectedMateria].datasFaltas.filter(d => d !== dateStr);
    }

    if (isOnline && auth.currentUser) {
      await updateDoc(doc(db, 'usuarios', auth.currentUser.uid), { materias: novasMaterias });
    }
    setMaterias(novasMaterias);
    setSelectedDate(date);
  };

  const tileClassName = ({ date }) => {
    if (selectedMateria === null || !materias[selectedMateria]) return 'rounded-full w-8 h-8 flex items-center justify-center mx-auto';

    const dateStr = date.toISOString().split('T')[0];
    const isFalta = materias[selectedMateria].datasFaltas?.includes(dateStr);
    const isToday = dateStr === new Date().toISOString().split('T')[0];

    return [
      'transition-all duration-200 ease-in-out',
      'rounded-full w-8 h-8 flex items-center justify-center mx-auto',
      isFalta ? 'border-2 border-blue-600' : 'hover:border hover:border-blue-200',
      isToday ? 'border-2 border-blue-300' : '',
    ].filter(Boolean).join(' ');
  };

  const tileContent = ({ date }) => {
    if (selectedMateria !== null && materias[selectedMateria]?.datasFaltas) {
      const dateStr = date.toISOString().split('T')[0];
      if (materias[selectedMateria].datasFaltas.includes(dateStr)) {
        return <div className="text-sm text-blue-600">●</div>;
      }
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-start p-4">
      <style jsx>{`
        .react-calendar {
          border: none;
          font-family: 'Inter', sans-serif;
          width: 100%;
          max-width: 350px;
        }
        .react-calendar__tile {
          padding: 0.5em;
          transition: all 0.2s;
        }
        .react-calendar__tile:hover {
          transform: scale(1.05);
        }
        .react-calendar__navigation button {
          min-width: 32px;
          background: #EFF6FF;
          border-radius: 9999px;
          transition: background-color 0.2s;
        }
        .react-calendar__navigation button:hover {
          background-color: #DBEAFE;
        }
      `}</style>
      {selectedMateria !== null && (
        <div className="bg-white rounded-3xl shadow-lg p-4 w-full max-w-md">
          <select
            className="w-full p-2 mb-4 border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50 text-gray-700 text-sm"
            value={selectedMateria}
            onChange={(e) => setSelectedMateria(Number(e.target.value))}
          >
            {materias.map((materia, index) => (
              <option key={index} value={index}>
                {materia.nome} ({materia.faltas}/{materia.maxFaltas})
              </option>
            ))}
          </select>
          <Calendar
            key={selectedMateria + JSON.stringify(materias[selectedMateria]?.datasFaltas)}
            onClickDay={handleDateClick}
            tileClassName={tileClassName}
            tileContent={tileContent}
            className="border-none shadow-sm rounded-xl w-full"
            value={selectedDate}
          />
          <div className="mt-4 text-xs text-gray-600 text-center">
            Clique em um dia para adicionar/remover falta
          </div>
        </div>
      )}
    </div>
  );
}

export default FaltaiCalendar;