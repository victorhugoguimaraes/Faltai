import React, { useState } from 'react';
import { FaTimes, FaPlus, FaClipboardCheck, FaBook } from 'react-icons/fa';
import { auth, db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

function EditMateriaModal({
  setEditModalOpen,
  editIndex,
  materias,
  setMaterias,
  isOnline
}) {
  const [nome, setNome] = useState(materias[editIndex].nome);
  const [horas, setHoras] = useState(materias[editIndex].horas.toString());
  const [pesoFalta, setPesoFalta] = useState(materias[editIndex].pesoFalta.toString());
  const [avaliacoes, setAvaliacoes] = useState(materias[editIndex].avaliacoes || []);
  const [novaAvaliacao, setNovaAvaliacao] = useState({
    tipo: 'PROVA',
    data: '',
    descricao: ''
  });
  const [mostrarAvaliacoes, setMostrarAvaliacoes] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nome || !horas) return;

    const maxFaltas = Math.floor((parseInt(horas) * 0.25) / parseInt(pesoFalta));
    const materiaAtualizada = {
      ...materias[editIndex],
      nome,
      horas: parseInt(horas),
      pesoFalta: parseInt(pesoFalta),
      maxFaltas,
      avaliacoes
    };

    const novasMaterias = [...materias];
    novasMaterias[editIndex] = materiaAtualizada;
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
    setEditModalOpen(false);
  };

  const adicionarAvaliacao = () => {
    if (!novaAvaliacao.data) {
      alert('Selecione uma data para a avaliação');
      return;
    }

    setAvaliacoes(prev => [...prev, { ...novaAvaliacao, id: Date.now() }]);
    setNovaAvaliacao({
      tipo: 'PROVA',
      data: '',
      descricao: ''
    });
  };

  const removerAvaliacao = (id) => {
    setAvaliacoes(prev => prev.filter(av => av.id !== id));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Editar Matéria</h2>
          <button
            onClick={() => setEditModalOpen(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome da Matéria
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
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
              className="w-full px-3 py-2 border rounded-md"
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
              className="w-full px-3 py-2 border rounded-md"
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
                <div className="flex gap-2">
                  <select
                    value={novaAvaliacao.tipo}
                    onChange={(e) => setNovaAvaliacao(prev => ({ ...prev, tipo: e.target.value }))}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="PROVA">Prova</option>
                    <option value="TRABALHO">Trabalho</option>
                  </select>
                  <input
                    type="date"
                    value={novaAvaliacao.data}
                    onChange={(e) => setNovaAvaliacao(prev => ({ ...prev, data: e.target.value }))}
                    className="flex-1 px-3 py-2 border rounded-md"
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={novaAvaliacao.descricao}
                    onChange={(e) => setNovaAvaliacao(prev => ({ ...prev, descricao: e.target.value }))}
                    className="flex-1 px-3 py-2 border rounded-md"
                    placeholder="Descrição (opcional)"
                  />
                  <button
                    type="button"
                    onClick={adicionarAvaliacao}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Adicionar
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {avaliacoes.map(av => (
                  <div
                    key={av.id}
                    className="flex items-center justify-between bg-gray-50 p-2 rounded-md"
                  >
                    <div className="flex items-center space-x-2">
                      {av.tipo === 'PROVA' ? (
                        <FaClipboardCheck className="text-red-500" />
                      ) : (
                        <FaBook className="text-red-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          {new Date(av.data).toLocaleDateString('pt-BR')}
                        </p>
                        {av.descricao && (
                          <p className="text-xs text-gray-500">{av.descricao}</p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removerAvaliacao(av.id)}
                      className="text-gray-400 hover:text-red-500"
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
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditMateriaModal;
