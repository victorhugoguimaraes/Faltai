import React, { useEffect, useState } from 'react';
import { FaPlus } from 'react-icons/fa';
import { useMaterias } from '../contexts/MateriasContext';
import { useError } from '../contexts/ErrorContext';
import { calculateMaxFaltas } from '../utils/validation';
import BottomSheet from './layout/BottomSheet';

const hourOptions = ['30', '45', '60', '75', '90', '120'];

const formatEvaluationDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Data invalida' : date.toLocaleDateString('pt-BR');
};

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

  const currentHoursOption = horas ? String(horas) : '';
  const hasCustomHourOption = currentHoursOption && !hourOptions.includes(currentHoursOption);

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
    <BottomSheet
      isOpen
      onClose={() => setEditModalOpen(false)}
      title="Editar materia"
      className="sm:max-w-lg"
      contentClassName="space-y-4 p-4 sm:p-6"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Nome da materia</label>
          <input
            type="text"
            value={nome}
            onChange={(event) => setNome(event.target.value)}
            className="app-input"
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Carga horaria</label>
            <select
              value={horas}
              onChange={(event) => setHoras(event.target.value)}
              className="app-input"
              required
            >
              <option value="">Selecione</option>
              {hasCustomHourOption ? <option value={currentHoursOption}>{currentHoursOption} horas</option> : null}
              {hourOptions.map((option) => (
                <option key={option} value={option}>
                  {option} horas
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Peso da falta</label>
            <select
              value={pesoFalta}
              onChange={(event) => setPesoFalta(event.target.value)}
              className="app-input"
            >
              <option value="1">1 falta por vez</option>
              <option value="2">2 faltas por vez</option>
              <option value="4">4 faltas por vez</option>
            </select>
          </div>
        </div>

        <div className="app-panel-muted">
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
                  className="app-input"
                  placeholder="Tipo da avaliacao"
                />
                <input
                  type="date"
                  value={novaAvaliacao.data}
                  onChange={(event) =>
                    setNovaAvaliacao((current) => ({ ...current, data: event.target.value }))
                  }
                  className="app-input"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <input
                  type="text"
                  value={novaAvaliacao.descricao}
                  onChange={(event) =>
                    setNovaAvaliacao((current) => ({ ...current, descricao: event.target.value }))
                  }
                  className="app-input"
                  placeholder="Descricao"
                />
                <button type="button" onClick={adicionarAvaliacao} className="app-button-primary">
                  Adicionar
                </button>
              </div>

              <div className="space-y-2">
                {avaliacoes.map((avaliacao) => (
                  <div key={avaliacao.id} className="app-panel flex items-center justify-between gap-3 !p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{avaliacao.tipo}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatEvaluationDate(avaliacao.data)}
                        {avaliacao.descricao ? ` - ${avaliacao.descricao}` : ''}
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
          <button type="button" onClick={() => setEditModalOpen(false)} className="app-button-secondary">
            Cancelar
          </button>
          <button type="submit" className="app-button-primary">
            Salvar
          </button>
        </div>
      </form>
    </BottomSheet>
  );
}

export default EditMateriaModal;
