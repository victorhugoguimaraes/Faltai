import React, { useEffect, useState } from 'react';
import { FaPlus, FaTimes } from 'react-icons/fa';
import { useMaterias } from '../contexts/MateriasContext';
import { useError } from '../contexts/ErrorContext';
import { calculateMaxFaltas } from '../utils/validation';

function EditMateriaModal({ setEditModalOpen, editIndex }) {
  const { materias, editarMateria } = useMaterias();
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

  useEffect(() => {
    if (editIndex !== null && materias && materias[editIndex]) {
      const materia = materias[editIndex];
      setNome(String(materia.nome || ''));
      setHoras(String(materia.horas || ''));
      setPesoFalta(String(materia.pesoFalta || '1'));
      setAvaliacoes(Array.isArray(materia.avaliacoes) ? materia.avaliacoes : []);
    }
  }, [editIndex, materias]);

  if (editIndex === null || !materias || !materias[editIndex]) {
    return null;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!nome || !horas) {
      addError('Preencha todos os campos obrigatorios');
      return;
    }

    try {
      const maxFaltas = calculateMaxFaltas(horas, pesoFalta);
      const materiaAtualizada = {
        ...materias[editIndex],
        nome: String(nome),
        horas: Number(horas),
        pesoFalta: Number(pesoFalta),
        maxFaltas: Number(maxFaltas),
        avaliacoes: avaliacoes || []
      };

      await editarMateria(editIndex, materiaAtualizada);
      addSuccess('Materia editada com sucesso!');
      setEditModalOpen(false);
    } catch (error) {
      addError('Erro ao salvar materia');
      console.error('Erro:', error);
    }
  };

  const adicionarAvaliacao = () => {
    if (!novaAvaliacao.tipo || !novaAvaliacao.data) {
      addError('Tipo e data sao obrigatorios para a avaliacao');
      return;
    }

    setAvaliacoes((current) => [...current, { ...novaAvaliacao, id: Date.now() }]);
    setNovaAvaliacao({
      tipo: '',
      data: '',
      descricao: ''
    });
  };

  const removerAvaliacao = (id) => {
    setAvaliacoes((current) => current.filter((avaliacao) => avaliacao.id !== id));
  };

  return (
    <div className="fixed inset-0 z-[10030] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-[2rem] border border-white/70 bg-white/95 p-5 shadow-strong backdrop-blur-xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Materia</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-slate-950">Editar materia</h2>
          </div>
          <button
            onClick={() => setEditModalOpen(false)}
            className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-500 hover:text-slate-800"
            aria-label="Fechar"
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Nome da materia</label>
            <input
              type="text"
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Carga horaria</label>
              <select
                value={horas}
                onChange={(event) => setHoras(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800"
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
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Peso da falta</label>
              <select
                value={pesoFalta}
                onChange={(event) => setPesoFalta(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800"
              >
                <option value="1">1 falta por vez</option>
                <option value="2">2 faltas por vez</option>
                <option value="4">4 faltas por vez</option>
              </select>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4">
            <button
              type="button"
              onClick={() => setMostrarAvaliacoes(!mostrarAvaliacoes)}
              className="flex items-center gap-2 text-sm font-semibold text-slate-700"
            >
              <FaPlus className="text-xs" />
              {mostrarAvaliacoes ? 'Ocultar avaliacoes' : 'Adicionar avaliacoes'}
            </button>

            {mostrarAvaliacoes && (
              <div className="mt-4 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    value={novaAvaliacao.tipo}
                    onChange={(event) =>
                      setNovaAvaliacao((current) => ({ ...current, tipo: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800"
                    placeholder="Tipo da avaliacao"
                  />
                  <input
                    type="date"
                    value={novaAvaliacao.data}
                    onChange={(event) =>
                      setNovaAvaliacao((current) => ({ ...current, data: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <input
                    type="text"
                    value={novaAvaliacao.descricao}
                    onChange={(event) =>
                      setNovaAvaliacao((current) => ({ ...current, descricao: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800"
                    placeholder="Descricao"
                  />
                  <button
                    type="button"
                    onClick={adicionarAvaliacao}
                    className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
                  >
                    Adicionar
                  </button>
                </div>

                <div className="space-y-2">
                  {avaliacoes.map((avaliacao) => (
                    <div
                      key={avaliacao.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{avaliacao.tipo}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {new Date(avaliacao.data).toLocaleDateString('pt-BR')}
                          {avaliacao.descricao ? ` • ${avaliacao.descricao}` : ''}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removerAvaliacao(avaliacao.id)}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-rose-600"
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
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
