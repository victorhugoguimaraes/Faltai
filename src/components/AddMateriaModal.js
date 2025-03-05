import React, { useState } from 'react';
import { addMateria } from '../services/materiaService';

function AddMateriaModal({ setModalOpen, materias, setMaterias, isOnline }) {
  const [novoNome, setNovoNome] = useState('');
  const [novoHoras, setNovoHoras] = useState('');
  const [novoPesoFalta, setNovoPesoFalta] = useState('1');
  const [error, setError] = useState('');

  const handleAddMateria = async (e) => {
    e.preventDefault();
    const nome = novoNome.trim();
    const horas = Number(novoHoras);
    const pesoFalta = Number(novoPesoFalta);

    if (!nome || isNaN(horas) || horas <= 0 || isNaN(pesoFalta)) {
      setError('Preencha todos os campos corretamente.');
      return;
    }

    setError('');
    const novasMaterias = await addMateria(nome, horas, pesoFalta, materias, isOnline);
    setMaterias(novasMaterias);
    setModalOpen(false);
    setNovoNome('');
    setNovoHoras('');
    setNovoPesoFalta('1');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-blue-600">Adicionar Matéria</h2>
        <p className="text-sm text-gray-600 mb-4">
          Cada falta é 1 aula de 50 min (ex.: 60h = 15 faltas). O peso converte pra dias:<br />
          2 faltas/dia = 7 dias, 4 faltas/dia = 3 dias.
        </p>
        <form onSubmit={handleAddMateria} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome da Matéria</label>
            <input
              className="mt-1 block w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base placeholder-gray-400"
              placeholder="Nome da matéria"
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Carga Horária</label>
            <select
              className="mt-1 block w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base text-gray-700"
              value={novoHoras}
              onChange={(e) => setNovoHoras(e.target.value)}
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
            <label className="block text-sm font-medium text-gray-700">Peso da Falta</label>
            <select
              className="mt-1 block w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base text-gray-700"
              value={novoPesoFalta}
              onChange={(e) => setNovoPesoFalta(e.target.value)}
            >
              <option value="1">1 falta por vez</option>
              <option value="2">2 faltas por vez</option>
              <option value="4">4 faltas por vez</option>
            </select>
          </div>
          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition duration-200 text-sm"
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 text-sm"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddMateriaModal;