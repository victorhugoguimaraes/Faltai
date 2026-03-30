export const addMateriaToList = (materias, novaMateria) => [...materias, novaMateria];

export const editMateriaInList = (materias, index, materiaEditada) => {
  const materiasAtualizadas = [...materias];
  materiasAtualizadas[index] = materiaEditada;
  return materiasAtualizadas;
};

export const deleteMateriaFromList = (materias, index) => materias.filter((_, i) => i !== index);

export const updateMateriaAbsences = (materias, index, novasFaltas, datasFaltas) => {
  const materiasAtualizadas = [...materias];
  materiasAtualizadas[index] = {
    ...materiasAtualizadas[index],
    faltas: novasFaltas,
    datasFaltas: datasFaltas || materiasAtualizadas[index].datasFaltas
  };
  return materiasAtualizadas;
};

export const calculateMateriaStats = (materias) => {
  if (materias.length === 0) {
    return {
      totalMaterias: 0,
      totalFaltas: 0,
      mediaFaltas: 0,
      materiasEmRisco: 0,
      porcentagemMedia: 0
    };
  }

  const totalFaltas = materias.reduce((sum, materia) => sum + (Number(materia?.faltas) || 0), 0);
  const mediaFaltas = totalFaltas / materias.length;

  const materiasEmRisco = materias.filter((materia) => {
    const faltas = Number(materia?.faltas) || 0;
    const maxFaltas = Number(materia?.maxFaltas) || 1;
    return maxFaltas > 0 && (faltas / maxFaltas) > 0.75;
  }).length;

  const porcentagemMedia = materias.reduce((sum, materia) => {
    const faltas = Number(materia?.faltas) || 0;
    const maxFaltas = Number(materia?.maxFaltas) || 1;
    return sum + (maxFaltas > 0 ? (faltas / maxFaltas) : 0);
  }, 0) / materias.length * 100;

  return {
    totalMaterias: materias.length,
    totalFaltas: Math.max(0, totalFaltas),
    mediaFaltas: Number(mediaFaltas.toFixed(2)) || 0,
    materiasEmRisco: Math.max(0, materiasEmRisco),
    porcentagemMedia: Number(porcentagemMedia.toFixed(2)) || 0
  };
};
