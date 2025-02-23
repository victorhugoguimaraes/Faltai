export default function SubjectList({ subjects }) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map((subject, index) => (
          <div key={index} className="bg-blue-100 p-4 rounded-xl shadow-md">
            <h3 className="text-lg font-bold">{subject.subject}</h3>
            <p className="text-gray-700">Carga Horária: {subject.hours}h</p>
            <p className="text-gray-700">Aulas Diárias: {subject.dailyClasses}</p>
          </div>
        ))}
      </div>
    );
  }
  