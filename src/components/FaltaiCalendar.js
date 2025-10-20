import React from 'react';
import Calendar from 'react-calendar';
import { FaCalendarAlt, FaTimes } from 'react-icons/fa';
import { useMaterias } from '../contexts/MateriasContext';
import { useError } from '../contexts/ErrorContext';
import 'react-calendar/dist/Calendar.css';

function FaltaiCalendar({ selectedMateria, onClose }) {
  const { materias, atualizarFaltas } = useMaterias();
  const { addError, addSuccess } = useError();
  
  console.log('FaltaiCalendar - selectedMateria:', selectedMateria);
  console.log('FaltaiCalendar - materias:', materias);
  
  if (typeof selectedMateria !== 'number' || !Array.isArray(materias)) {
    console.warn('FaltaiCalendar - dados inválidos');
    return null;
  }
  
  const materia = materias[selectedMateria];
  console.log('FaltaiCalendar - materia:', materia);
  
  if (!materia || typeof materia !== 'object') {
    console.warn('FaltaiCalendar - matéria não encontrada');
    return null;
  }

  const handleDateClick = async (date) => {
    const dateStr = date.toISOString().split('T')[0];
    const datasFaltas = materia.datasFaltas || [];
    
    let novasFaltas;
    let novasDatasFaltas;
    
    if (datasFaltas.includes(dateStr)) {
      novasFaltas = materia.faltas - 1;
      novasDatasFaltas = datasFaltas.filter(d => d !== dateStr);
      addSuccess('Falta removida com sucesso!');
    } else {
      if (materia.faltas >= materia.maxFaltas) {
        addError('Você já atingiu o limite máximo de faltas!');
        return;
      }
      novasFaltas = materia.faltas + 1;
      novasDatasFaltas = [...datasFaltas, dateStr];
      addSuccess('Falta adicionada com sucesso!');
    }

    try {
      await atualizarFaltas(selectedMateria, novasFaltas, novasDatasFaltas);
    } catch (error) {
      addError('Erro ao atualizar faltas');
    }
  };

  const tileClassName = ({ date }) => {
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
    <div className="modal-overlay fixed inset-0 z-[10000] bg-black/50 p-0 sm:p-4 flex items-end sm:items-center justify-center">
      <div className="modal-content bg-white w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl shadow-2xl">
        <div className="sticky top-0 bg-white z-10">
          <div className="sm:hidden flex justify-center pt-2 pb-1">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
          </div>
          <div className="flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4 border-b border-neutral-200">
            <div className="flex items-center gap-3 min-w-0">
              <FaCalendarAlt className="text-primary-600 text-xl sm:text-2xl shrink-0" />
              <div className="min-w-0">
                <h2 className="text-base sm:text-xl font-semibold text-neutral-800 truncate">
                  {String(materia.nome || 'Matéria sem nome')}
                </h2>
                <p className="text-xs sm:text-sm text-neutral-600">
                  {String(materia.faltas || 0)}/{String(materia.maxFaltas || 0)} faltas
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="p-2 hover:bg-neutral-100 rounded-xl transition-colors text-neutral-500 shrink-0"
            >
              <FaTimes size={20} />
            </button>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-4">
          <Calendar
            onClickDay={handleDateClick}
            tileClassName={tileClassName}
            className="border-none shadow-none w-full"
            locale="pt-BR"
            minDetail="month"
            maxDetail="month"
            showNeighboringMonth={false}
            calendarType="gregory"
            next2Label={null}
            prev2Label={null}
            navigationLabel={({ date }) => {
              const mes = date.toLocaleString('pt-BR', { month: 'long' });
              const ano = date.toLocaleString('pt-BR', { year: 'numeric' });
              return (
                <div className="flex items-center justify-center gap-2 min-w-0" title={`${mes} ${ano}`}>
                  <span className="truncate text-sm sm:text-base font-semibold capitalize">{mes}</span>
                  <span className="shrink-0 text-sm sm:text-base font-semibold">{ano}</span>
                </div>
              );
            }}
            value={null}
          />
        </div>

        <div className="flex items-center justify-center gap-6 px-4 sm:px-6 pb-4 pt-3 border-t border-neutral-200">
          <div className="flex items-center space-x-2">
            <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-primary-600 rounded-full"></div>
            <span className="text-xs sm:text-sm text-neutral-600 font-medium">Falta</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-danger-500 rounded-full"></div>
            <span className="text-xs sm:text-sm text-neutral-600 font-medium">Avaliação</span>
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
          display: flex;
          align-items: center;
        }
        .react-calendar__navigation button {
          min-width: 44px;
          background: none;
          font-size: 16px;
          padding: 8px;
          border-radius: 8px;
          transition: all 0.2s;
        }
        .react-calendar__navigation__label {
          flex: 1;
          min-width: 0;
        }
        .react-calendar__navigation__label > span {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .react-calendar__navigation button:hover {
          background-color: #f1f5f9;
        }
        .react-calendar__month-view__weekdays {
          text-transform: uppercase;
          font-weight: bold;
          font-size: 0.75em;
          color: #6b7280;
        }
        .react-calendar__tile {
          max-width: 100%;
          text-align: center;
          padding: 0.75em 0.5em;
          background: none;
          position: relative;
          border-radius: 8px;
          transition: all 0.2s;
        }
        .react-calendar__tile:enabled:hover {
          background-color: #f1f5f9;
          transform: scale(1.05);
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
          background: linear-gradient(135deg, #0ea5e9, #0284c7);
          border-radius: 50%;
          z-index: -1;
        }
        .falta-marcada abbr {
          color: white;
          font-weight: bold;
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
          background: linear-gradient(135deg, #ef4444, #dc2626);
          border-radius: 50%;
          z-index: -1;
        }
        .avaliacao-marcada abbr {
          color: white;
          font-weight: bold;
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
          .react-calendar__navigation button {
            min-width: 36px;
            font-size: 14px;
            padding: 6px;
          }
        }
      `}</style>
    </div>
  );
}

export default FaltaiCalendar;