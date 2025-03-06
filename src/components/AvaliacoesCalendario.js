import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import { FaCalendarAlt, FaTimes, FaClipboardCheck, FaBook } from 'react-icons/fa';
import 'react-calendar/dist/Calendar.css';

function AvaliacoesCalendario({ materias, onClose }) {
  const [avaliacoes, setAvaliacoes] = useState(() => {
    const saved = localStorage.getItem('avaliacoes');
    return saved ? JSON.parse(saved) : [];
  });
  const [modalAberto, setModalAberto] = useState(false);
  const [novaAvaliacao, setNovaAvaliacao] = useState({
    tipo: 'PROVA', 
    materia: '',
    data: new Date(),
    descricao: ''
  });

  useEffect(() => {
    localStorage.setItem('avaliacoes', JSON.stringify(avaliacoes));
  }, [avaliacoes]);

  const adicionarAvaliacao = () => {
    if (!novaAvaliacao.materia) {
      alert('Selecione uma matéria');
      return;
    }

    const novaAvaliacaoCompleta = {
      ...novaAvaliacao,
      id: Date.now()
    };

    setAvaliacoes(prev => [...prev, novaAvaliacaoCompleta]);
    setModalAberto(false);
    setNovaAvaliacao({
      tipo: 'PROVA',
      materia: '',
      data: new Date(),
      descricao: ''
    });
  };

  const getAvaliacoesDoDia = (date) => {
    return avaliacoes.filter(avaliacao => 
      new Date(avaliacao.data).toDateString() === date.toDateString()
    );
  };

  const removerAvaliacao = (id) => {
    setAvaliacoes(prev => prev.filter(av => av.id !== id));
  };

  const tileContent = ({ date }) => {
    const avaliacoesDia = getAvaliacoesDoDia(date);
    if (avaliacoesDia.length === 0) return null;

    return (
      <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-1 pb-1">
        {avaliacoesDia.map((av) => (
          <div
            key={av.id}
            className={`w-2 h-2 rounded-full ${
              av.tipo === 'PROVA' ? 'bg-red-500' : 'bg-blue-500'
            }`}
          />
        ))}
      </div>
    );
  };

  const tileClassName = ({ date }) => {
    const classes = ['relative', 'h-16'];
    const avaliacoesDia = getAvaliacoesDoDia(date);
    
    if (avaliacoesDia.length > 0) {
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
                Provas e Trabalhos
              </h2>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setModalAberto(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Adicionar
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
              >
                <FaTimes />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          <div>
            <Calendar
              tileContent={tileContent}
              tileClassName={tileClassName}
              className="border-none shadow-none w-full"
              locale="pt-BR"
            />
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-700 mb-4">Próximas Avaliações</h3>
            <div className="space-y-3">
              {avaliacoes
                .sort((a, b) => new Date(a.data) - new Date(b.data))
                .map(avaliacao => (
                  <div
                    key={avaliacao.id}
                    className="bg-white p-3 rounded-lg shadow-sm flex items-start justify-between"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        {avaliacao.tipo === 'PROVA' ? (
                          <FaClipboardCheck className="text-red-500" />
                        ) : (
                          <FaBook className="text-blue-500" />
                        )}
                        <span className="font-medium">{avaliacao.materia}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(avaliacao.data).toLocaleDateString('pt-BR')}
                      </p>
                      {avaliacao.descricao && (
                        <p className="text-sm text-gray-500 mt-1">
                          {avaliacao.descricao}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => removerAvaliacao(avaliacao.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <FaTimes />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Nova Avaliação */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Nova Avaliação</h3>
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
                  Tipo
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={novaAvaliacao.tipo === 'PROVA'}
                      onChange={() => setNovaAvaliacao(prev => ({ ...prev, tipo: 'PROVA' }))}
                      className="mr-2"
                    />
                    Prova
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={novaAvaliacao.tipo === 'TRABALHO'}
                      onChange={() => setNovaAvaliacao(prev => ({ ...prev, tipo: 'TRABALHO' }))}
                      className="mr-2"
                    />
                    Trabalho
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Matéria
                </label>
                <select
                  value={novaAvaliacao.materia}
                  onChange={(e) => setNovaAvaliacao(prev => ({ ...prev, materia: e.target.value }))}
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
                  value={novaAvaliacao.data.toISOString().split('T')[0]}
                  onChange={(e) => setNovaAvaliacao(prev => ({ ...prev, data: new Date(e.target.value) }))}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição (opcional)
                </label>
                <textarea
                  value={novaAvaliacao.descricao}
                  onChange={(e) => setNovaAvaliacao(prev => ({ ...prev, descricao: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md"
                  rows="3"
                  placeholder="Ex: Conteúdo da prova, detalhes do trabalho..."
                />
              </div>

              <button
                onClick={adicionarAvaliacao}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AvaliacoesCalendario; 