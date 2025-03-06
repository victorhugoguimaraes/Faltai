import React, { useEffect, useState } from 'react';
import { FaTrophy, FaTimes } from 'react-icons/fa';

const NIVEIS = {
  1: {
    nome: 'Ferro',
    cor: 'bg-gray-500',
    requisito: 0,
    descricao: '0-20% de presença'
  },
  2: {
    nome: 'Bronze',
    cor: 'bg-yellow-700',
    requisito: 0.2,
    descricao: '20-40% de presença'
  },
  3: {
    nome: 'Prata',
    cor: 'bg-gray-400',
    requisito: 0.4,
    descricao: '40-60% de presença'
  },
  4: {
    nome: 'Ouro',
    cor: 'bg-yellow-500',
    requisito: 0.6,
    descricao: '60-80% de presença'
  },
  5: {
    nome: 'Diamante',
    cor: 'bg-blue-600',
    requisito: 0.8,
    descricao: '80-100% de presença'
  }
};

function GamificationSystem({ materias, onClose, onNotification }) {
  const [nivel, setNivel] = useState(1);
  const [progresso, setProgresso] = useState(0);
  const [porcentagemPresenca, setPorcentagemPresenca] = useState(0);

  const calcularNivel = () => {
    if (materias.length === 0) return { nivel: 1, progresso: 0, porcentagem: 0 };

    const totalFaltas = materias.reduce((sum, m) => sum + m.faltas, 0);
    const totalMaxFaltas = materias.reduce((sum, m) => sum + m.maxFaltas, 0);
    
    if (totalMaxFaltas === 0) return { nivel: 1, progresso: 0, porcentagem: 0 };

    const porcentagemPresenca = 100 - ((totalFaltas / totalMaxFaltas) * 100);
    const progressoNormalizado = porcentagemPresenca / 100;

    if (progressoNormalizado >= 0.8) return { nivel: 5, progresso: 100, porcentagem: porcentagemPresenca };
    if (progressoNormalizado >= 0.6) return { nivel: 4, progresso: (progressoNormalizado - 0.6) * 500, porcentagem: porcentagemPresenca };
    if (progressoNormalizado >= 0.4) return { nivel: 3, progresso: (progressoNormalizado - 0.4) * 500, porcentagem: porcentagemPresenca };
    if (progressoNormalizado >= 0.2) return { nivel: 2, progresso: (progressoNormalizado - 0.2) * 500, porcentagem: porcentagemPresenca };
    return { nivel: 1, progresso: progressoNormalizado * 500, porcentagem: porcentagemPresenca };
  };

  useEffect(() => {
    const { nivel: novoNivel, progresso: novoProgresso, porcentagem } = calcularNivel();
    setNivel(novoNivel);
    setProgresso(novoProgresso);
    setPorcentagemPresenca(porcentagem);

    // Verifica matérias com máximo de faltas atingido
    materias.forEach(materia => {
      if (materia.faltas >= materia.maxFaltas) {
        onNotification({
          titulo: '⚠️ Limite de Faltas',
          mensagem: `Você atingiu o limite de faltas em ${materia.nome}`,
          tipo: 'alerta'
        });
      }
    });
  }, [materias]);

  const nivelAtual = NIVEIS[nivel];
  const proximoNivel = NIVEIS[nivel + 1];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <FaTrophy className="text-blue-600 text-2xl" />
            <h2 className="text-xl font-semibold text-gray-800">
              Nível de Presença
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes />
          </button>
        </div>

        <div className="space-y-6">
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${nivelAtual.cor} text-white mb-2`}>
              <span className="text-2xl font-bold">{nivel}</span>
            </div>
            <h3 className="text-lg font-semibold">{nivelAtual.nome}</h3>
            <p className="text-sm text-gray-600 mt-1">
              Presença atual: {porcentagemPresenca.toFixed(1)}%
            </p>
            {proximoNivel && (
              <p className="text-sm text-gray-600 mt-1">
                Próximo nível: {proximoNivel.nome}
              </p>
            )}
          </div>

          {nivel < 5 && (
            <div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${nivelAtual.cor} transition-all duration-500`}
                  style={{ width: `${progresso}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{nivelAtual.descricao}</span>
                {proximoNivel && <span>{proximoNivel.descricao}</span>}
              </div>
            </div>
          )}

          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium text-gray-700">Níveis de Presença:</p>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(NIVEIS).map(([key, nivel]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${nivel.cor}`} />
                  <span className="text-sm text-gray-600">
                    {nivel.nome}: {nivel.descricao}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GamificationSystem; 