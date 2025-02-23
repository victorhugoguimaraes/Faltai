import { db, auth } from "./firebase";
import { doc, setDoc, collection, getDocs } from "firebase/firestore";

// Função auxiliar para pegar o usuário logado
async function getCurrentUser() {
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

// Função para adicionar matéria
export async function adicionarMateria(nomeMateria) {
  const user = await getCurrentUser();
  if (!user) {
    console.error("Usuário não autenticado!");
    return;
  }

  const uid = user.uid; // Obtém o ID do usuário logado

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

// Função para carregar as matérias do usuário logado
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
