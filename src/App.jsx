import { useState, useEffect } from "react";
import { db } from "./firebase"; // Certifique-se de que o Firebase está configurado
import { collection, addDoc, getDocs } from "firebase/firestore";
import AddSubjectButton from "./components/AddSubjectButton";

export default function App() {
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    const fetchSubjects = async () => {
      const querySnapshot = await getDocs(collection(db, "subjects"));
      setSubjects(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };
    fetchSubjects();
  }, []);

  const handleAddSubject = async (newSubject) => {
    const docRef = await addDoc(collection(db, "subjects"), newSubject);
    setSubjects([...subjects, { id: docRef.id, ...newSubject }]);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Minhas Matérias</h1>
      <AddSubjectButton onAdd={handleAddSubject} />
      <ul className="mt-4">
        {subjects.map((s) => (
          <li key={s.id} className="border p-2 rounded mt-2">
            {s.subject} - {s.time}
          </li>
        ))}
      </ul>
    </div>
  );
}
