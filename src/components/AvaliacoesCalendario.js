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
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[10000] p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-4xl max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl shadow-2xl">
        <div className="sticky top-0 bg-white z-10 border-b border-gray-100">
          <div className="sm:hidden flex justify-center pt-2 pb-1">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
          </div>
          <div className="px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <FaCalendarAlt className="text-blue-600 text-lg sm:text-xl shrink-0" />
              <h2 className="text-base sm:text-xl font-semibold text-gray-800 truncate">
                Provas e Trabalhos
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setModalAberto(true)}
                className="px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Adicionar
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                aria-label="Fechar"
              >
                <FaTimes />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 sm:px-6 py-4">
          <div className="overflow-x-auto">
            <Calendar
              tileContent={tileContent}
              tileClassName={tileClassName}
              className="border-none shadow-none w-full min-w-[320px]"
              locale="pt-BR"
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
            />
          </div>

          <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
            <h3 className="font-semibold text-gray-700 mb-3 sm:mb-4">Próximas Avaliações</h3>
            <div className="space-y-3">
              {avaliacoes
                .sort((a, b) => new Date(a.data) - new Date(b.data))
                .map(avaliacao => (
                  <div
                    key={avaliacao.id}
                    className="bg-white p-3 rounded-lg shadow-sm flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        {avaliacao.tipo === 'PROVA' ? (
                          <FaClipboardCheck className="text-red-500 shrink-0" />
                        ) : (
                          <FaBook className="text-blue-500 shrink-0" />
                        )}
                        <span className="font-medium truncate">{avaliacao.materia}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">
                        {new Date(avaliacao.data).toLocaleDateString('pt-BR')}
                      </p>
                      {avaliacao.descricao && (
                        <p className="text-xs sm:text-sm text-gray-500 mt-1 break-words">
                          {avaliacao.descricao}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => removerAvaliacao(avaliacao.id)}
                      className="text-gray-400 hover:text-red-500 shrink-0"
                      aria-label="Remover"
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
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[10001] p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-xl shadow-xl">
            <div className="sticky top-0 bg-white z-10 border-b px-4 sm:px-6 py-3">
              <div className="sm:hidden flex justify-center pt-1 pb-1">
                <div className="w-10 h-1.5 bg-gray-300 rounded-full"></div>
              </div>
              <div className="flex justify-between items-center">
                <h3 className="text-base sm:text-lg font-semibold">Nova Avaliação</h3>
                <button
                  onClick={() => setModalAberto(false)}
                  className="text-gray-500 hover:text-gray-700 p-2 rounded-lg"
                  aria-label="Fechar"
                >
                  <FaTimes />
                </button>
              </div>
            </div>

            <div className="space-y-4 px-4 sm:px-6 py-4">
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
                  className="w-full px-3 py-2 border rounded-md text-sm"
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
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição (opcional)
                </label>
                <textarea
                  value={novaAvaliacao.descricao}
                  onChange={(e) => setNovaAvaliacao(prev => ({ ...prev, descricao: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md text-sm"
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