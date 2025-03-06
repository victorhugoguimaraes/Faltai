import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import { 
  FaCalendarAlt, 
  FaBook, 
  FaClipboardCheck, 
  FaBell, 
  FaTimes,
  FaGraduationCap,
  FaClock,
  FaExclamationTriangle
} from 'react-icons/fa';

const TIPOS_EVENTOS = {
  AULA: {
    nome: 'Aula Regular',
    cor: 'bg-blue-100 border-blue-500',
    icone: <FaBook className="text-blue-500" />
  },
  PROVA: {
    nome: 'Prova/Avaliação',
    cor: 'bg-red-100 border-red-500',
    icone: <FaClipboardCheck className="text-red-500" />
  },
  TRABALHO: {
    nome: 'Trabalho/Apresentação',
    cor: 'bg-green-100 border-green-500',
    icone: <FaGraduationCap className="text-green-500" />
  },
  FERIADO: {
    nome: 'Feriado/Recesso',
    cor: 'bg-gray-100 border-gray-500',
    icone: <FaCalendarAlt className="text-gray-500" />
  },
  OUTRO: {
    nome: 'Outro Evento',
    cor: 'bg-purple-100 border-purple-500',
    icone: <FaBell className="text-purple-500" />
  }
};

function CalendarioAcademico({ materias, setMaterias, isOnline }) {
  const [eventos, setEventos] = useState(() => {
    const savedEventos = localStorage.getItem('eventos_academicos');
    return savedEventos ? JSON.parse(savedEventos) : [];
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [modalAberto, setModalAberto] = useState(false);
  const [novoEvento, setNovoEvento] = useState({
    titulo: '',
    tipo: 'AULA',
    materia: '',
    descricao: '',
    data: new Date(),
    horario: ''
  });
  const [viewMode, setViewMode] = useState('mes'); // 'mes' ou 'semana'

  useEffect(() => {
    localStorage.setItem('eventos_academicos', JSON.stringify(eventos));
  }, [eventos]);

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setNovoEvento(prev => ({ ...prev, data: date }));
    setModalAberto(true);
  };

  const adicionarEvento = () => {
    if (!novoEvento.titulo) return;

    const novoEventoCompleto = {
      ...novoEvento,
      id: Date.now(),
      data: novoEvento.data.toISOString()
    };

    setEventos(prev => [...prev, novoEventoCompleto]);
    setModalAberto(false);
    setNovoEvento({
      titulo: '',
      tipo: 'AULA',
      materia: '',
      descricao: '',
      data: new Date(),
      horario: ''
    });
  };

  const getEventosDoDia = (date) => {
    return eventos.filter(evento => 
      new Date(evento.data).toDateString() === date.toDateString()
    );
  };

  const tileContent = ({ date }) => {
    const eventosNoDia = getEventosDoDia(date);
    if (eventosNoDia.length === 0) return null;

    return (
      <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-1 pb-1">
        {eventosNoDia.map((evento, index) => (
          <div
            key={evento.id}
            className={`w-2 h-2 rounded-full ${TIPOS_EVENTOS[evento.tipo].cor.split(' ')[0]}`}
          />
        ))}
      </div>
    );
  };

  const tileClassName = ({ date }) => {
    const classes = ['relative', 'h-20'];
    const eventosNoDia = getEventosDoDia(date);
    
    if (eventosNoDia.length > 0) {
      classes.push('font-bold');
    }

    return classes.join(' ');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl">
        <div className="p-4 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <FaCalendarAlt className="text-blue-600 text-xl" />
              <h2 className="text-xl font-semibold text-gray-800">
                Calendário Acadêmico
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
                className="px-3 py-1 border rounded-md"
              >
                <option value="mes">Mensal</option>
                <option value="semana">Semanal</option>
              </select>
              <button
                onClick={() => setModalAberto(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Novo Evento
              </button>
            </div>
          </div>
        </div>

        <div className="p-4">
          <Calendar
            onChange={setSelectedDate}
            value={selectedDate}
            onClickDay={handleDateClick}
            tileContent={tileContent}
            tileClassName={tileClassName}
            view={viewMode === 'semana' ? 'week' : 'month'}
            className="border-none shadow-none w-full"
            locale="pt-BR"
          />
        </div>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center justify-center space-x-4">
            {Object.entries(TIPOS_EVENTOS).map(([key, { nome, cor, icone }]) => (
              <div key={key} className="flex items-center space-x-2">
                {icone}
                <span className="text-sm text-gray-600">{nome}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal de Novo Evento */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Novo Evento</h3>
              <button
                onClick={() => setModalAberto(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título
                </label>
                <input
                  type="text"
                  value={novoEvento.titulo}
                  onChange={(e) => setNovoEvento(prev => ({ ...prev, titulo: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Nome do evento"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <select
                  value={novoEvento.tipo}
                  onChange={(e) => setNovoEvento(prev => ({ ...prev, tipo: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  {Object.entries(TIPOS_EVENTOS).map(([key, { nome }]) => (
                    <option key={key} value={key}>
                      {nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Matéria
                </label>
                <select
                  value={novoEvento.materia}
                  onChange={(e) => setNovoEvento(prev => ({ ...prev, materia: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">Selecione uma matéria</option>
                  {materias.map((materia, index) => (
                    <option key={index} value={materia.nome}>
                      {materia.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data
                </label>
                <input
                  type="date"
                  value={novoEvento.data.toISOString().split('T')[0]}
                  onChange={(e) => setNovoEvento(prev => ({ ...prev, data: new Date(e.target.value) }))}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Horário
                </label>
                <input
                  type="time"
                  value={novoEvento.horario}
                  onChange={(e) => setNovoEvento(prev => ({ ...prev, horario: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={novoEvento.descricao}
                  onChange={(e) => setNovoEvento(prev => ({ ...prev, descricao: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md"
                  rows="3"
                  placeholder="Detalhes do evento"
                />
              </div>

              <button
                onClick={adicionarEvento}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Adicionar Evento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CalendarioAcademico; 