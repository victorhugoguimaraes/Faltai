export default function MateriaCard({ materia, index, marcarFalta }) {
    return (
      <div className="card">
        <div>
          <h3 className="text-lg font-semibold text-blue-700">
            {materia.nome} ({materia.horas}h)
          </h3>
          <p className="text-gray-700">
            Faltas: {materia.faltas}/{Math.floor(materia.horas * 0.25)}
          </p>
        </div>
        <button className="btn-danger" onClick={() => marcarFalta(index)}>
          Marcar Falta
        </button>
      </div>
    );
  }
  