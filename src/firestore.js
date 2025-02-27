import { db, auth } from "./services/firebase";
import { doc, setDoc, collection, getDocs } from "firebase/firestore";

async function getCurrentUser() {
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

export async function adicionarMateria(nomeMateria) {
  const user = await getCurrentUser();
  if (!user) {
    console.error("Usuário não autenticado!");
    return;
  }

  const uid = user.uid; 

  try {
    await setDoc(doc(db, `users/${uid}/materias`, nomeMateria), {
      nome: nomeMateria,
      createdAt: new Date(),
    });
    console.log("Matéria adicionada com sucesso!");
  } catch (error) {
    console.error("Erro ao adicionar matéria:", error);
  }
}

export async function carregarMaterias() {
  const user = await getCurrentUser();
  if (!user) {
    console.error("Usuário não autenticado!");
    return [];
  }

  const uid = user.uid;
  const materiasRef = collection(db, `users/${uid}/materias`);

  try {
    const querySnapshot = await getDocs(materiasRef);
    return querySnapshot.docs.map((doc) => doc.data());
  } catch (error) {
    console.error("Erro ao carregar matérias:", error);
    return [];
  }
}
