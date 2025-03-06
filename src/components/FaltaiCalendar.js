import React, { useState } from 'react';
import Calendar from 'react-calendar';
import { FaCalendarAlt, FaTimes } from 'react-icons/fa';
import { auth, db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import 'react-calendar/dist/Calendar.css';

function FaltaiCalendar({ materias, setMaterias, isOnline, selectedMateria, onClose }) {
  const handleDateClick = async (date) => {
    const materia = materias[selectedMateria];
    const dateStr = date.toISOString().split('T')[0];
    const datasFaltas = materia.datasFaltas || [];
    
    let novasFaltas;
    if (datasFaltas.includes(dateStr)) {
      novasFaltas = datasFaltas.filter(d => d !== dateStr);
      materia.faltas--;
    } else {
      if (materia.faltas >= materia.maxFaltas) {
        alert('Você já atingiu o limite máximo de faltas!');
        return;
      }
      novasFaltas = [...datasFaltas, dateStr];
      materia.faltas++;
    }

    materia.datasFaltas = novasFaltas;
    const novasMaterias = [...materias];
    novasMaterias[selectedMateria] = materia;
    setMaterias(novasMaterias);

    if (isOnline && auth.currentUser) {
      try {
        await updateDoc(doc(db, 'usuarios', auth.currentUser.uid), {
          materias: novasMaterias
        });
      } catch (error) {
        console.error('Erro ao salvar no Firebase:', error);
      }
    }

    localStorage.setItem('materias', JSON.stringify(novasMaterias));
  };

  const tileClassName = ({ date }) => {
    const materia = materias[selectedMateria];
    const dateStr = date.toISOString().split('T')[0];
    const temFalta = materia.datasFaltas?.includes(dateStr);
    const temAvaliacao = materia.avaliacoes?.some(av => 
      new Date(av.data).toISOString().split('T')[0] === dateStr
    );

    if (temFalta) return 'falta-marcada';
    if (temAvaliacao) return 'avaliacao-marcada';
    return '';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-md">
        <div className="p-4 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <FaCalendarAlt className="text-blue-600 text-xl" />
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  {materias[selectedMateria].nome}
                </h2>
                <p className="text-sm text-gray-600">
                  {materias[selectedMateria].faltas}/{materias[selectedMateria].maxFaltas} faltas
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        <div className="p-4">
          <Calendar
            onClickDay={handleDateClick}
            tileClassName={tileClassName}
            className="border-none shadow-none w-full"
            locale="pt-BR"
            minDetail="month"
            maxDetail="month"
            showNeighboringMonth={false}
            calendarType="gregory"
            value={null}
          />
        </div>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
              <span className="text-sm text-gray-600">Falta</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Avaliação</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .react-calendar {
          font-family: system-ui, -apple-system, sans-serif;
          width: 100%;
          background: transparent;
          border: none;
        }
        .react-calendar__navigation {
          margin-bottom: 1rem;
        }
        .react-calendar__navigation button {
          min-width: 44px;
          background: none;
          font-size: 16px;
          padding: 8px;
        }
        .react-calendar__month-view__weekdays {
          text-transform: uppercase;
          font-weight: bold;
          font-size: 0.75em;
          color: #6b7280;
        }
        .react-calendar__month-view__days__day {
          padding: 8px;
          position: relative;
        }
        .react-calendar__tile {
          max-width: 100%;
          text-align: center;
          padding: 0.75em 0.5em;
          background: none;
          position: relative;
        }
        .react-calendar__tile:enabled:hover {
          background-color: #f3f4f6;
          border-radius: 9999px;
        }
        .falta-marcada {
          position: relative;
          z-index: 1;
        }
        .falta-marcada::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 32px;
          height: 32px;
          background-color: #2563eb;
          border-radius: 50%;
          z-index: -1;
        }
        .falta-marcada abbr {
          color: white;
        }
        .avaliacao-marcada {
          position: relative;
          z-index: 1;
        }
        .avaliacao-marcada::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 32px;
          height: 32px;
          background-color: #ef4444;
          border-radius: 50%;
          z-index: -1;
        }
        .avaliacao-marcada abbr {
          color: white;
        }
        .react-calendar__month-view__days__day--weekend {
          color: #ef4444;
        }
        .react-calendar__month-view__days__day--neighboringMonth {
          color: #9ca3af;
        }
        .react-calendar__tile--now {
          background: transparent !important;
        }
        .react-calendar__tile--active {
          background: transparent !important;
        }
        @media (max-width: 640px) {
          .react-calendar {
            font-size: 14px;
          }
          .react-calendar__tile {
            padding: 0.5em 0.25em;
          }
        }
      `}</style>
    </div>
  );
}

export default FaltaiCalendar;