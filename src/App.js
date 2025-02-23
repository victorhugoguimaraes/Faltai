import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const googleProvider = new GoogleAuthProvider();

function App() {
  const [logado, setLogado] = useState(false);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [materias, setMaterias] = useState([]);
  const [erro, setErro] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novoHoras, setNovoHoras] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [materiaToDelete, setMateriaToDelete] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setLogado(true);
        const docRef = doc(db, 'usuarios', user.uid);
        const docSnap = await getDoc(docRef);
        setMaterias(docSnap.exists() ? docSnap.data().materias || [] : []);
      } else {
        setLogado(false);
        setMaterias([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const fazerLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, senha);
      setErro('');
    } catch (error) {
      setErro('Erro ao realizar login. Verifique email e senha.');
    }
    setEmail('');
    setSenha('');
  };

  const registrar = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      await setDoc(doc(db, 'usuarios', userCredential.user.uid), { materias: [] });
      setErro('');
    } catch (error) {
      setErro('Erro ao registrar. O email pode já estar em uso.');
    }
    setEmail('');
    setSenha('');
  };

  const loginComGoogle = async () => {
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const docRef = doc(db, 'usuarios', userCredential.user.uid);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        await setDoc(docRef, { materias: [] });
      }
      setErro('');
    } catch (error) {
      setErro('Erro ao realizar login com Google.');
    }
  };

  const adicionarMateria = async (e) => {
    e.preventDefault();
    const nome = novoNome.trim();
    const horas = Number(novoHoras);

    if (!nome || isNaN(horas) || horas <= 0) {
      alert('Preencha todos os campos corretamente.');
      return;
    }

    const maxFaltas = Math.floor(horas * 0.25);
    const novasMaterias = [...materias, { nome, horas, faltas: 0, maxFaltas }];
    setMaterias(novasMaterias);
    await setDoc(doc(db, 'usuarios', auth.currentUser.uid), { materias: novasMaterias });

    setModalOpen(false);
    setNovoNome('');
    setNovoHoras('');
  };

  const adicionarFalta = async (index) => {
    const novasMaterias = [...materias];
    if (novasMaterias[index].faltas + 1 > novasMaterias[index].maxFaltas) {
      alert('O limite de faltas foi atingido.');
      return;
    }
    novasMaterias[index].faltas += 1;
    setMaterias(novasMaterias);
    await setDoc(doc(db, 'usuarios', auth.currentUser.uid), { materias: novasMaterias });
  };

  const removerFalta = async (index) => {
    const novasMaterias = [...materias];
    if (novasMaterias[index].faltas > 0) {
      novasMaterias[index].faltas -= 1;
      setMaterias(novasMaterias);
      await setDoc(doc(db, 'usuarios', auth.currentUser.uid), { materias: novasMaterias });
    }
  };

  const abrirModalExclusao = (index) => {
    setMateriaToDelete(index);
    setDeleteModalOpen(true);
  };

  const confirmarExclusao = async () => {
    if (materiaToDelete !== null) {
      const novasMaterias = materias.filter((_, i) => i !== materiaToDelete);
      setMaterias(novasMaterias);
      await setDoc(doc(db, 'usuarios', auth.currentUser.uid), { materias: novasMaterias });
    }
    setDeleteModalOpen(false);
    setMateriaToDelete(null);
  };

  const sair = () => {
    signOut(auth);
  };

  if (!logado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="p-8 bg-white rounded-xl shadow-lg w-full max-w-md">
          <h1 className="text-4xl font-extrabold text-center mb-6 text-blue-600 bg-gradient-to-r from-blue-500 to-blue-700 text-transparent bg-clip-text">
            Faltaí
          </h1>
          {erro && <p className="text-red-500 mb-4 text-center">{erro}</p>}
          <input
            className="w-full p-3 mb-4 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50 placeholder-gray-500"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="w-full p-3 mb-6 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50 placeholder-gray-500"
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
          <button
            className="w-full p-3 mb-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
            onClick={fazerLogin}
          >
            Entrar
          </button>
          <button
            className="w-full p-3 mb-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200"
            onClick={registrar}
          >
            Registrar
          </button>
          <button
            className="w-full p-3 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition duration-200"
            onClick={loginComGoogle}
          >
            Entrar com Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col">
      <div className="max-w-lg mx-auto relative z-0 flex-grow">
        <div className="flex justify-between items-center mb-6 pt-6">
          <h1 className="text-3xl font-extrabold text-blue-600 bg-gradient-to-r from-blue-500 to-blue-700 text-transparent bg-clip-text">
            Faltaí
          </h1>
          <button
            className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200"
            onClick={sair}
          >
            Sair
          </button>
        </div>
        <button
          className="w-full p-3 mb-6 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200"
          onClick={() => setModalOpen(true)}
        >
          Adicionar Matéria
        </button>

        {/* Modal para adicionar matéria */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-sm">
              <h2 className="text-xl font-bold mb-4 text-blue-700">Adicionar Matéria</h2>
              <p className="text-sm text-gray-600 mb-4">
                É obrigatória a presença em 75% da carga horária.<br />
                Cada falta equivale 50 minutos.<br />
                Exemplo caso você falte o dia inteiro:<br />
                4 aulas (19:00 até 22:40) geram 4 faltas.<br />
                2 aulas (8:00 até 09:50) geram 2 faltas.
              </p>
              <form onSubmit={adicionarMateria}>
                <input
                  className="w-full p-3 mb-4 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50 placeholder-gray-500"
                  placeholder="Nome da matéria"
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                />
                <select
                  className="w-full p-3 mb-6 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50 text-gray-700"
                  value={novoHoras}
                  onChange={(e) => setNovoHoras(e.target.value)}
                >
                  <option value="">Selecione a carga horária</option>
                  <option value="30">30 horas</option>
                  <option value="60">60 horas</option>
                  <option value="90">90 horas</option>
                </select>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="p-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition duration-200"
                    onClick={() => setModalOpen(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de confirmação de exclusão */}
        {deleteModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-sm">
              <h2 className="text-xl font-bold mb-4 text-blue-700">Confirmação</h2>
              <p className="text-sm text-gray-600 mb-4">
                Deseja excluir a matéria "{materias[materiaToDelete]?.nome}"? Esta ação não pode ser desfeita.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  className="p-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition duration-200"
                  onClick={() => setDeleteModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-200"
                  onClick={confirmarExclusao}
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}

        <p className="text-sm text-gray-600 mb-4">
          Presença mínima: 75% da carga horária.<br />
        </p>
        <p className="text-sm text-gray-600 mb-6">
          Clique em "Adicionar Matéria" pra incluir uma nova.<br />
        </p>

        {materias.length === 0 ? (
          <p className="text-center text-gray-600">Nenhuma matéria cadastrada.</p>
        ) : (
          materias.map((materia, index) => (
            <div
              key={index}
              className="p-4 mb-4 bg-white rounded-lg shadow-md border-l-4 border-blue-500 transition-transform transform hover:scale-105 z-10 flex justify-between items-center"
            >
              <div>
                <h3 className="text-lg font-semibold text-blue-700">
                  {materia.nome} ({materia.horas}h)
                </h3>
                <p className="text-gray-700">
                  Faltas: {materia.faltas}/{materia.maxFaltas}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  className={`p-2 rounded-lg text-white ${materia.faltas >= materia.maxFaltas ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} transition duration-200`}
                  onClick={() => adicionarFalta(index)}
                  disabled={materia.faltas >= materia.maxFaltas}
                >
                  +
                </button>
                <button
                  className={`p-2 rounded-lg text-white ${materia.faltas <= 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} transition duration-200`}
                  onClick={() => removerFalta(index)}
                  disabled={materia.faltas <= 0}
                >
                  -
                </button>
                <button
                  className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-200"
                  onClick={() => abrirModalExclusao(index)}
                >
                  Excluir
                </button>
              </div>
            </div>
          ))
        )}

        <p className="text-sm text-gray-600 mb-6">
          Para adicionar à tela inicial:<br />
          Android: Abra no Chrome, clique em "Menu" (⋮) > "Adicionar à tela inicial".<br />
          iPhone: Abra no Safari, toque em "Compartilhar" (⬆) > "Adicionar à Tela Inicial".
        </p>
      </div>

      {/* Rodapé */}
      <footer className="bg-blue-100 p-4 text-center text-gray-600 text-sm mt-auto">
        <p>Desenvolvido por Victor Guimarães</p>
        <div className="flex justify-center gap-4 mt-2">
          <a href="https://github.com/victorhugoguimaraes" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            GitHub
          </a>
          <a href="https://www.linkedin.com/in/victor-hugo-guimar%C3%A3es-nascimento-377ba3319?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            LinkedIn
          </a>
        </div>
      </footer>
    </div>
  );
}

export default App;