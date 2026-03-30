export const getDashboardStats = (materias) => {
  if (materias.length === 0) {
    return {
      totalMaterias: 0,
      totalFaltas: 0,
      mediaFaltas: 0,
      materiasEmRisco: 0,
      porcentagemMedia: 0,
      materiaComMaisFaltas: null,
      proximasAvaliacoes: []
    };
  }

  const totalFaltas = materias.reduce((sum, materia) => sum + (Number(materia.faltas) || 0), 0);
  const mediaFaltas = totalFaltas / materias.length;

  const materiasEmRisco = materias.filter((materia) => {
    const faltas = Number(materia.faltas) || 0;
    const maxFaltas = Number(materia.maxFaltas) || 1;
    return (faltas / maxFaltas) > 0.75;
  });

  const porcentagemMedia = materias.reduce((sum, materia) => {
    const faltas = Number(materia.faltas) || 0;
    const maxFaltas = Number(materia.maxFaltas) || 1;
    return sum + (faltas / maxFaltas);
  }, 0) / materias.length * 100;

  const materiaComMaisFaltas = materias.reduce((max, materia) => {
    const faltas = Number(materia.faltas) || 0;
    const faltasMax = Number(max?.faltas) || 0;
    return faltas > faltasMax ? materia : max;
  }, null);

  const hoje = new Date();
  const proximosSete = new Date();
  proximosSete.setDate(hoje.getDate() + 7);

  const proximasAvaliacoes = materias
    .flatMap((materia) =>
      (materia.avaliacoes || []).map((avaliacao) => ({
        ...avaliacao,
        materiaName: materia.nome
      }))
    )
    .filter((avaliacao) => {
      const dataAvaliacao = new Date(avaliacao.data);
      return dataAvaliacao >= hoje && dataAvaliacao <= proximosSete;
    })
    .sort((a, b) => new Date(a.data) - new Date(b.data))
    .slice(0, 5);

  return {
    totalMaterias: materias.length,
    totalFaltas: Number(totalFaltas) || 0,
    mediaFaltas: Number(mediaFaltas.toFixed(2)) || 0,
    materiasEmRisco: materiasEmRisco.length,
    porcentagemMedia: Number(porcentagemMedia.toFixed(2)) || 0,
    materiaComMaisFaltas,
    proximasAvaliacoes
  };
};

export const getDashboardBarData = (materias) => ({
  labels: materias.map((materia) => {
    const nome = String(materia.nome || 'Sem nome');
    return nome.length > 15 ? `${nome.substring(0, 15)}...` : nome;
  }),
  datasets: [
    {
      label: 'Faltas Atuais',
      data: materias.map((materia) => Number(materia.faltas) || 0),
      backgroundColor: materias.map((materia) => {
        const faltas = Number(materia.faltas) || 0;
        const maxFaltas = Number(materia.maxFaltas) || 1;
        const percentual = (faltas / maxFaltas) * 100;

        if (percentual >= 100) return '#ef4444';
        if (percentual >= 75) return '#f59e0b';
        return '#10b981';
      }),
      borderWidth: 1
    },
    {
      label: 'Limite Máximo',
      data: materias.map((materia) => Number(materia.maxFaltas) || 0),
      backgroundColor: '#e5e7eb',
      borderWidth: 1
    }
  ]
});

export const getDashboardDoughnutData = (materias) => {
  const seguras = materias.filter((materia) => {
    const faltas = Number(materia.faltas) || 0;
    const maxFaltas = Number(materia.maxFaltas) || 1;
    return (faltas / maxFaltas) < 0.5;
  }).length;

  const atencao = materias.filter((materia) => {
    const faltas = Number(materia.faltas) || 0;
    const maxFaltas = Number(materia.maxFaltas) || 1;
    const percentual = faltas / maxFaltas;
    return percentual >= 0.5 && percentual < 0.75;
  }).length;

  const risco = materias.filter((materia) => {
    const faltas = Number(materia.faltas) || 0;
    const maxFaltas = Number(materia.maxFaltas) || 1;
    return (faltas / maxFaltas) >= 0.75;
  }).length;

  return {
    labels: ['Seguras', 'Atenção', 'Em Risco'],
    datasets: [
      {
        data: [seguras, atencao, risco],
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
        borderWidth: 2,
        borderColor: '#fff'
      }
    ]
  };
};

export const getDashboardChartOptions = (materias) => ({
  responsive: true,
  plugins: {
    legend: {
      position: 'top'
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      max: Math.max(...materias.map((materia) => Number(materia.maxFaltas) || 0), 2) + 2
    }
  }
});
