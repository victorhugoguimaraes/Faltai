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

  useEffect(() => {
    const calcularNivel = () => {
      if (!Array.isArray(materias) || materias.length === 0) {
        return { nivel: 1, progresso: 0, porcentagem: 0 };
      }

      const totalFaltas = materias.reduce((sum, m) => sum + (Number(m.faltas) || 0), 0);
      const totalMaxFaltas = materias.reduce((sum, m) => sum + (Number(m.maxFaltas) || 0), 0);
      
      if (totalMaxFaltas === 0) return { nivel: 1, progresso: 0, porcentagem: 0 };

      const porcentagemPresenca = Math.max(0, 100 - ((totalFaltas / totalMaxFaltas) * 100));
      const progressoNormalizado = Math.min(1, Math.max(0, porcentagemPresenca / 100));

      if (progressoNormalizado >= 0.8) return { 
        nivel: 5, 
        progresso: 100, 
        porcentagem: Number(porcentagemPresenca.toFixed(1)) 
      };
      if (progressoNormalizado >= 0.6) return { 
        nivel: 4, 
        progresso: Number(((progressoNormalizado - 0.6) * 500).toFixed(1)), 
        porcentagem: Number(porcentagemPresenca.toFixed(1)) 
      };
      if (progressoNormalizado >= 0.4) return { 
        nivel: 3, 
        progresso: Number(((progressoNormalizado - 0.4) * 500).toFixed(1)), 
        porcentagem: Number(porcentagemPresenca.toFixed(1)) 
      };
      if (progressoNormalizado >= 0.2) return { 
        nivel: 2, 
        progresso: Number(((progressoNormalizado - 0.2) * 500).toFixed(1)), 
        porcentagem: Number(porcentagemPresenca.toFixed(1)) 
      };
      return { 
        nivel: 1, 
        progresso: Number((progressoNormalizado * 500).toFixed(1)), 
        porcentagem: Number(porcentagemPresenca.toFixed(1)) 
      };
    };

    const { nivel: novoNivel, progresso: novoProgresso, porcentagem } = calcularNivel();
    setNivel(Number(novoNivel) || 1);
    setProgresso(Number(novoProgresso) || 0);
    setPorcentagemPresenca(Number(porcentagem) || 0);

    // Verifica matérias com máximo de faltas atingido (com controle de duplicatas)
    if (Array.isArray(materias) && typeof onNotification === 'function') {
      const notificacoesEnviadas = JSON.parse(localStorage.getItem('notificacoes_enviadas') || '[]');
      const novasNotificacoes = [];
      
      materias.forEach((materia, index) => {
        const faltas = Number(materia.faltas) || 0;
        const maxFaltas = Number(materia.maxFaltas) || 0;
        const nomeMateria = String(materia.nome || 'uma matéria');
        const notificacaoId = `limite-faltas-${nomeMateria}-${index}`;
        
        if (faltas >= maxFaltas && maxFaltas > 0 && !notificacoesEnviadas.includes(notificacaoId)) {
          onNotification({
            titulo: '⚠️ Limite de Faltas',
            mensagem: `Você atingiu o limite de faltas em ${nomeMateria}`,
            tipo: 'alerta'
          });
          novasNotificacoes.push(notificacaoId);
        }
      });
      
      // Salva as notificações enviadas no localStorage para evitar duplicatas
      if (novasNotificacoes.length > 0) {
        const todasNotificacoes = [...notificacoesEnviadas, ...novasNotificacoes];
        localStorage.setItem('notificacoes_enviadas', JSON.stringify(todasNotificacoes));
      }
    }
  }, [materias, onNotification]);

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
              Presença atual: {Number(porcentagemPresenca).toFixed(1) || '0.0'}%
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
                  style={{ width: `${Number(progresso) || 0}%` }}
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