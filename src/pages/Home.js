import { useState, useEffect } from "react";
import { db } from "../firebaseConfig"; // Certifique-se de ter configurado
import { collection, addDoc, getDocs } from "firebase/firestore";
import AddSubjectModal from "../components/AddSubjectModal";
import SubjectList from "../components/SubjectList";
import Button from "../components/ui/Button";

export default function Home() {
  const [subjects, setSubjects] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    async function fetchSubjects() {
      const querySnapshot = await getDocs(collection(db, "subjects"));
      setSubjects(querySnapshot.docs.map(doc => doc.data()));
    }
    fetchSubjects();
  }, []);

  const handleSaveSubject = async (newSubject) => {
    await addDoc(collection(db, "subjects"), newSubject);
    setSubjects([...subjects, newSubject]);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Minhas Matérias</h1>
      <Button onClick={() => setModalOpen(true)}>Adicionar Matéria</Button>
      <AddSubjectModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSaveSubject} />
      <SubjectList subjects={subjects} />
    </div>
  );
}
