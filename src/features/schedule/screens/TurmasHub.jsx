import React, { useEffect, useState } from 'react';
import { FaCalendarAlt, FaCopy, FaExternalLinkAlt, FaPlus, FaShareAlt, FaUniversity } from 'react-icons/fa';
import BottomSheet from '../../../components/layout/BottomSheet';
import { loadTurmas, saveTurmas, createTurma, shareTurmasAsText } from '../lib/turmasStorage';

const defaultTurma = {
  nome: '',
  codigo: '',
  docente: '',
  local: '',
  diaSemana: 'SEG',
  inicio: '08:00',
  fim: '09:50',
  dataInicio: '',
  dataFim: '',
  observacoes: ''
};

function TurmasHub({ onSyncCalendar }) {
  const [turmas, setTurmas] = useState([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [draft, setDraft] = useState(defaultTurma);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    setTurmas(loadTurmas());
  }, []);

  const persist = (nextTurmas) => {
    setTurmas(nextTurmas);
    saveTurmas(nextTurmas);
  };

  const addTurma = () => {
    if (!draft.nome.trim()) {
      setFeedback('Preencha pelo menos o nome da turma.');
      return;
    }

    persist([...turmas, createTurma(draft)]);
    setDraft(defaultTurma);
    setIsSheetOpen(false);
    setFeedback('Turma adicionada na sua grade.');
  };

  const removeTurma = (id) => {
    persist(turmas.filter((turma) => turma.id !== id));
  };

  const openSigaa = () => {
    window.open('https://sigaa.unb.br/sigaa/public/turmas/listar.jsf', '_blank', 'noopener,noreferrer');
  };

  const shareGrid = async () => {
    const shared = await shareTurmasAsText(turmas);
    setFeedback(shared ? 'Grade compartilhada.' : 'Grade copiada para a área de transferência.');
  };

  return (
    <>
      <section className="space-y-5">
        <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="card p-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
              Grade rápida
            </p>
            <h2 className="font-display text-2xl font-bold text-slate-950">
              Monte seus horários e compartilhe a rotina sem abrir mil abas.
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              O atalho da UnB abre a consulta pública do SIGAA. Aqui no Faltai você organiza as turmas, salva a grade
              e usa o mesmo conjunto para sincronizar com o calendário do celular.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <button className="btn-primary inline-flex items-center gap-2" onClick={() => setIsSheetOpen(true)}>
                <FaPlus />
                Nova turma
              </button>
              <button className="btn-secondary inline-flex items-center gap-2" onClick={openSigaa}>
                <FaUniversity />
                Consultar SIGAA UnB
              </button>
            </div>
          </div>

          <div className="card p-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Ações
            </p>
            <div className="space-y-3">
              <button className="feature-card w-full text-left" onClick={shareGrid}>
                <FaShareAlt className="mb-3 text-lg text-slate-800" />
                <h3 className="feature-card__title">Compartilhar grade</h3>
                <p className="feature-card__text">Envia a grade resumida por compartilhamento nativo ou copia o texto.</p>
              </button>
              <button className="feature-card w-full text-left" onClick={onSyncCalendar}>
                <FaCalendarAlt className="mb-3 text-lg text-slate-800" />
                <h3 className="feature-card__title">Sincronizar com calendário do celular</h3>
                <p className="feature-card__text">Gera um arquivo de calendário compatível com iPhone e Google Calendar.</p>
              </button>
            </div>
          </div>
        </div>

        {feedback && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {feedback}
          </div>
        )}

        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Turmas salvas</p>
              <h3 className="mt-1 font-display text-2xl font-bold text-slate-950">{turmas.length} na sua grade</h3>
            </div>
            <button
              className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
              onClick={() => setIsSheetOpen(true)}
            >
              Adicionar
            </button>
          </div>

          <div className="space-y-3">
            {turmas.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                Nenhuma turma cadastrada ainda. Use o SIGAA da UnB para consultar as ofertas e monte sua grade aqui.
              </div>
            ) : (
              turmas.map((turma) => (
                <div key={turma.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-slate-900">
                        {turma.nome} {turma.codigo ? <span className="text-slate-500">({turma.codigo})</span> : null}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {turma.diaSemana} • {turma.inicio} - {turma.fim}
                        {turma.local ? ` • ${turma.local}` : ''}
                      </p>
                      {(turma.docente || turma.dataInicio || turma.dataFim) && (
                        <p className="mt-1 text-sm text-slate-500">
                          {turma.docente ? turma.docente : 'Docente não informado'}
                          {turma.dataInicio && turma.dataFim ? ` • ${turma.dataInicio} até ${turma.dataFim}` : ''}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => removeTurma(turma.id)}
                      className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 shadow-soft"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <BottomSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title="Nova turma"
        className="sm:max-w-md"
        contentClassName="space-y-4 p-4 sm:p-6"
      >
        <div className="grid gap-4">
          <input
            value={draft.nome}
            onChange={(event) => setDraft({ ...draft, nome: event.target.value })}
            className="input-modern"
            placeholder="Nome da disciplina"
          />
          <input
            value={draft.codigo}
            onChange={(event) => setDraft({ ...draft, codigo: event.target.value })}
            className="input-modern"
            placeholder="Código da turma"
          />
          <input
            value={draft.docente}
            onChange={(event) => setDraft({ ...draft, docente: event.target.value })}
            className="input-modern"
            placeholder="Docente"
          />
          <input
            value={draft.local}
            onChange={(event) => setDraft({ ...draft, local: event.target.value })}
            className="input-modern"
            placeholder="Local / sala"
          />

          <div className="grid grid-cols-3 gap-3">
            <select
              value={draft.diaSemana}
              onChange={(event) => setDraft({ ...draft, diaSemana: event.target.value })}
              className="input-modern"
            >
              <option value="SEG">Seg</option>
              <option value="TER">Ter</option>
              <option value="QUA">Qua</option>
              <option value="QUI">Qui</option>
              <option value="SEX">Sex</option>
              <option value="SAB">Sab</option>
            </select>
            <input
              type="time"
              value={draft.inicio}
              onChange={(event) => setDraft({ ...draft, inicio: event.target.value })}
              className="input-modern"
            />
            <input
              type="time"
              value={draft.fim}
              onChange={(event) => setDraft({ ...draft, fim: event.target.value })}
              className="input-modern"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              value={draft.dataInicio}
              onChange={(event) => setDraft({ ...draft, dataInicio: event.target.value })}
              className="input-modern"
            />
            <input
              type="date"
              value={draft.dataFim}
              onChange={(event) => setDraft({ ...draft, dataFim: event.target.value })}
              className="input-modern"
            />
          </div>

          <textarea
            value={draft.observacoes}
            onChange={(event) => setDraft({ ...draft, observacoes: event.target.value })}
            className="input-modern min-h-[100px]"
            placeholder="Observações"
          />

          <button className="btn-primary w-full justify-center" onClick={addTurma}>
            Salvar turma
          </button>

          <button
            className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-slate-600 underline underline-offset-4"
            onClick={openSigaa}
          >
            <FaExternalLinkAlt />
            Abrir consulta pública do SIGAA da UnB
          </button>
        </div>
      </BottomSheet>
    </>
  );
}

export default TurmasHub;
