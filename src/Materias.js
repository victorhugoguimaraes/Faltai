import { useState, useEffect } from "react";
import { adicionarMateria, carregarMaterias } from "./firestore";

function Materias() {
  const [materias, setMaterias] = useState([]);
  const [novaMateria, setNovaMateria] = useState("");

  useEffect(() => {
    async function buscarMaterias() {
      const dados = await carregarMaterias();
      setMaterias(dados);
    }
    buscarMaterias();
  }, []);

  const handleAdicionar = async () => {
    if (!novaMateria.trim()) return; // Evita nome vazio
    await adicionarMateria(novaMateria);
    setNovaMateria("");
    const dados = await carregarMaterias();
    setMaterias(dados);
  };

  return (
    <div>
      <h2>Minhas Matérias</h2>
      <input
        type="text"
        value={novaMateria}
        onChange={(e) => setNovaMateria(e.target.value)}
        placeholder="Nome da matéria"
      />
      <button onClick={handleAdicionar}>Adicionar</button>

      <ul>
        {materias.map((materia, index) => (
          <li key={index}>{materia.nome}</li>
        ))}
      </ul>
    </div>
  );
}

export default Materias;
