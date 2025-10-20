import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { FaTimes, FaPlus, FaClipboardCheck, FaBook } from 'react-icons/fa';
import { useMaterias } from '../contexts/MateriasContext';
import { useError } from '../contexts/ErrorContext';
import { validateMateria, sanitizeMateria } from '../utils/validation';

function AddMateriaModal({ setModalOpen }) {
  const { adicionarMateria } = useMaterias();
  const { addError, addSuccess } = useError();
  
  const [nome, setNome] = useState('');
  const [horas, setHoras] = useState('');
  const [pesoFalta, setPesoFalta] = useState('1');
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [novaAvaliacao, setNovaAvaliacao] = useState({
    tipo: '',
    data: '',
    descricao: ''
  });
  const [mostrarAvaliacoes, setMostrarAvaliacoes] = useState(false);
  const [mostrarCalendario, setMostrarCalendario] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nome || !horas) {
      addError('Nome e carga horária são obrigatórios');
      return;
    }

    const formData = { nome, horas, pesoFalta };
    const validation = validateMateria(formData);
    
    if (!validation.isValid) {
      const errors = Object.values(validation.errors).join(', ');
      addError(`Erro: ${errors}`);
      return;
    }

    try {
      const maxFaltas = Math.floor((parseInt(horas) * 0.25) / parseInt(pesoFalta));
      const novaMateria = {
        nome: nome.trim(),
        horas: parseInt(horas),
        pesoFalta: parseInt(pesoFalta),
        maxFaltas,
        faltas: 0,
        datasFaltas: [],
        avaliacoes: avaliacoes
      };

      const materiaSanitizada = sanitizeMateria(novaMateria);
      await adicionarMateria(materiaSanitizada);
      addSuccess('Matéria adicionada com sucesso!');
      setModalOpen(false);
    } catch (error) {
      addError('Erro ao adicionar matéria');
    }
  };

  const adicionarAvaliacao = () => {
    if (!novaAvaliacao.tipo || !novaAvaliacao.data) {
      addError('Tipo e data são obrigatórios para a avaliação');
      return;
    }

    setAvaliacoes(prev => [...prev, { ...novaAvaliacao, id: Date.now() }]);
    setNovaAvaliacao({
      tipo: '',
      data: '',
      descricao: ''
    });
    addSuccess('Avaliação adicionada!');
  };

  const removerAvaliacao = (id) => {
    setAvaliacoes(prev => prev.filter(av => av.id !== id));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[10001] p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-lg shadow-2xl">
        <div className="sticky top-0 bg-white z-10 border-b">
          <div className="sm:hidden flex justify-center pt-2 pb-1">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
          </div>
          <div className="flex justify-between items-center px-4 sm:px-6 py-3">
            <h2 className="text-base sm:text-xl font-semibold text-gray-800">Nova Matéria</h2>
            <button
              onClick={() => setModalOpen(false)}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-lg"
              aria-label="Fechar"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-4 sm:px-6 py-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome da Matéria
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm"
              placeholder="Ex: Cálculo 1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Carga Horária
            </label>
            <select
              value={horas}
              onChange={(e) => setHoras(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm"
              required
            >
              <option value="">Selecione</option>
              <option value="30">30 horas</option>
              <option value="45">45 horas</option>
              <option value="60">60 horas</option>
              <option value="75">75 horas</option>
              <option value="90">90 horas</option>
              <option value="120">120 horas</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Peso da Falta
            </label>
            <select
              value={pesoFalta}
              onChange={(e) => setPesoFalta(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm"
            >
              <option value="1">1 falta por vez</option>
              <option value="2">2 faltas por vez</option>
              <option value="4">4 faltas por vez</option>
            </select>
          </div>

          <div className="border-t pt-4">
            <button
              type="button"
              onClick={() => setMostrarAvaliacoes(!mostrarAvaliacoes)}
              className="text-blue-600 hover:text-blue-700 text-sm flex items-center"
            >
              <FaPlus className="mr-1" /> {mostrarAvaliacoes ? 'Ocultar Avaliações' : 'Adicionar Avaliações'}
            </button>
          </div>

          {mostrarAvaliacoes && (
            <>
              <div className="space-y-3 mb-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={novaAvaliacao.tipo}
                    onChange={(e) => setNovaAvaliacao(prev => ({ ...prev, tipo: e.target.value }))}
                    className="w-full sm:flex-1 min-w-0 px-3 py-2 border rounded-md text-sm"
                    placeholder="Tipo (ex: Prova, Trabalho, Seminário)"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarCalendario(!mostrarCalendario)}
                    className="w-full sm:w-[180px] px-3 py-2 border rounded-md text-sm text-left hover:bg-gray-50 transition-colors"
                  >
                    {novaAvaliacao.data 
                      ? new Date(novaAvaliacao.data + 'T00:00:00').toLocaleDateString('pt-BR')
                      : 'Selecionar data'}
                  </button>
                </div>

                {mostrarCalendario && (
                  <div className="border rounded-lg p-3 bg-gray-50">
                    <Calendar
                      onChange={(date) => {
                        setNovaAvaliacao(prev => ({ 
                          ...prev, 
                          data: date.toISOString().split('T')[0] 
                        }));
                        setMostrarCalendario(false);
                      }}
                      value={novaAvaliacao.data ? new Date(novaAvaliacao.data + 'T00:00:00') : new Date()}
                      locale="pt-BR"
                      minDetail="month"
                      next2Label={null}
                      prev2Label={null}
                      navigationLabel={({ date }) => {
                        const mes = date.toLocaleString('pt-BR', { month: 'long' });
                        const ano = date.toLocaleString('pt-BR', { year: 'numeric' });
                        return (
                          <div className="flex items-center justify-center gap-2 min-w-0" title={`${mes} ${ano}`}>
                            <span className="truncate text-sm font-semibold capitalize">{mes}</span>
                            <span className="shrink-0 text-sm font-semibold">{ano}</span>
                          </div>
                        );
                      }}
                      className="border-none w-full"
                    />
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={novaAvaliacao.descricao}
                    onChange={(e) => setNovaAvaliacao(prev => ({ ...prev, descricao: e.target.value }))}
                    className="w-full sm:flex-1 min-w-0 px-3 py-2 border rounded-md text-sm"
                    placeholder="Descrição (opcional)"
                  />
                  <button
                    type="button"
                    onClick={adicionarAvaliacao}
                    className="w-full sm:w-auto px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                  >
                    Adicionar
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {avaliacoes.map(av => (
                  <div
                    key={av.id}
                    className="flex items-center justify-between bg-gray-50 p-2 rounded-md gap-3"
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      {av.tipo === 'PROVA' ? (
                        <FaClipboardCheck className="text-red-500" />
                      ) : (
                        <FaBook className="text-red-500" />
                      )}
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium">
                          {new Date(av.data).toLocaleDateString('pt-BR')}
                        </p>
                        {av.descricao && (
                          <p className="text-xs text-gray-500 break-words">{av.descricao}</p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removerAvaliacao(av.id)}
                      className="text-gray-400 hover:text-red-500 shrink-0"
                    >
                      <FaTimes />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Adicionar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddMateriaModal;
