import React, { useState } from 'react';
import { addMateria } from '../services/materiaService';

function AddMateriaModal({ setModalOpen, materias, setMaterias, isOnline }) {
  const [novoNome, setNovoNome] = useState('');
  const [novoHoras, setNovoHoras] = useState('');
  const [novoPesoFalta, setNovoPesoFalta] = useState('1');

  const handleAddMateria = async (e) => {
    e.preventDefault();
    const nome = novoNome.trim();
    const horas = Number(novoHoras);
    const pesoFalta = Number(novoPesoFalta);

    if (!nome || isNaN(horas) || horas <= 0 || isNaN(pesoFalta)) {
      alert('Preencha todos os campos corretamente.');
      return;
    }

    const novasMaterias = await addMateria(nome, horas, pesoFalta, materias, isOnline);
    setMaterias(novasMaterias);
    setModalOpen(false);
    setNovoNome('');
    setNovoHoras('');
    setNovoPesoFalta('1');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-lg w-full max-w-xs sm:max-w-sm">
        <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-blue-700">Adicionar Matéria</h2>
        <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
          Cada falta é 1 aula de 50 min (ex.: 60h = 15 faltas). O peso converte pra dias:<br />
          2 faltas/dia = 7 dias, 4 faltas/dia = 3 dias.
        </p>
        <form onSubmit={handleAddMateria}>
          <input
            className="w-full p-2 sm:p-3 mb-3 sm:mb-4 border border-blue-200 rounded-3xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50 placeholder-gray-500 text-xs sm:text-sm"
            placeholder="Nome da matéria"
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
          />
          <select
            className="w-full p-2 sm:p-3 mb-3 sm:mb-4 border border-blue-200 rounded-3xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50 text-gray-700 text-xs sm:text-sm"
            value={novoHoras}
            onChange={(e) => setNovoHoras(e.target.value)}
          >
            <option value="">Carga horária</option>
            <option value="30">30 horas</option>
            <option value="45">45 horas</option>
            <option value="60">60 horas</option>
            <option value="75">75 horas</option>
            <option value="90">90 horas</option>
            <option value="120">120 horas</option>
          </select>
          <select
            className="w-full p-2 sm:p-3 mb-3 sm:mb-6 border border-blue-200 rounded-3xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50 text-gray-700 text-xs sm:text-sm"
            value={novoPesoFalta}
            onChange={(e) => setNovoPesoFalta(e.target.value)}
          >
            <option value="1">1 falta por vez</option>
            <option value="2">2 faltas por vez</option>
            <option value="4">4 faltas por vez</option>
          </select>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="p-1 sm:p-2 bg-gray-400 text-white rounded-3xl hover:bg-gray-500 transition duration-200 text-xs sm:text-sm"
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="p-1 sm:p-2 bg-blue-600 text-white rounded-3xl hover:bg-blue-700 transition duration-200 text-xs sm:text-sm"
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