import { useState } from "react";

export default function AddSubjectButton({ onAdd }) {
  const [isOpen, setIsOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [time, setTime] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (subject && time) {
      onAdd({ subject, time });
      setIsOpen(false); 
      setSubject("");
      setTime("");
    }
  };

  return (
    <div>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded-md shadow-md hover:bg-blue-700"
      >
        + Adicionar Matéria
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">Nova Matéria</h2>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Nome da matéria"
                className="border p-2 rounded w-full mb-2"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Horário"
                className="border p-2 rounded w-full mb-2"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="bg-gray-400 text-white px-3 py-1 rounded mr-2"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-3 py-1 rounded"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
