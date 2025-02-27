import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import Home from './components/Home';
import MateriaList from './components/MateriaList';
import AddMateriaModal from './components/AddMateriaModal';
import EditMateriaModal from './components/EditMateriaModal';
import DeleteMateriaModal from './components/DeleteMateriaModal';
import LogoutConfirmationModal from './components/LogoutConfirmationModal';

function App() {
  const [logado, setLogado] = useState(false);
  const [materias, setMaterias] = useState(() => JSON.parse(localStorage.getItem('materias')) || []);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [materiaToDelete, setMateriaToDelete] = useState(null);
  const [editNome, setEditNome] = useState('');
  const [editHoras, setEditHoras] = useState('');
  const [editPesoFalta, setEditPesoFalta] = useState('1');
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user && isOnline) {
        // Modo online: carrega dados do Firebase apenas se ainda estiver online
        setLogado(true);
        try {
          const userDocRef = doc(db, 'usuarios', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setMaterias(userData.materias || []);
          } else {
            setMaterias([]);
          }
        } catch (error) {
          console.error('Erro ao carregar dados do Firebase:', error.message);
          setMaterias([]);
        }
      } else if (!isOnline && logado) {
        // Modo anônimo: carrega do localStorage
        setMaterias(JSON.parse(localStorage.getItem('materias')) || []);
      } else {
        // Logout ou estado inicial: não logado
        setLogado(false);
        setIsOnline(false);
        setMaterias(JSON.parse(localStorage.getItem('materias')) || []);
      }
    });
    return () => unsubscribe();
  }, [isOnline, logado]); // Dependências incluem isOnline e logado

  useEffect(() => {
    if (!isOnline && logado) {
      // Salva no localStorage apenas no modo anônimo enquanto logado
      localStorage.setItem('materias', JSON.stringify(materias));
    }
  }, [materias, isOnline, logado]);

  const handleLogoutComplete = () => {
    setLogado(false);
    setIsOnline(false);
    setLogoutModalOpen(false);
    if (!isOnline) {
      localStorage.setItem('materias', JSON.stringify(materias)); // Salva antes de sair no modo anônimo
    } else {
      setMaterias([]); // Limpa as matérias no modo online
    }
  };

  return (
    <div className="min-h-screen bg-blue-100 flex flex-col">
      {logado ? (
        <>
          <div className="max-w-md mx-auto relative z-0 flex-grow w-full">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-center py-3 sm:py-4 text-blue-700 bg-gradient-to-r from-blue-500 to-blue-300 text-transparent bg-clip-text">
              Faltaí
            </h1>
            <div className="flex justify-end mb-1 sm:mb-2 px-2 sm:px-4">
              <button
                className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition duration-200 text-xs sm:text-sm"
                onClick={() => setLogoutModalOpen(true)}
              >
                X
              </button>
            </div>
            <div className="text-center px-2 sm:px-4">
              <button
                className="w-3/4 sm:w-2/3 p-2 sm:p-3 mb-2 sm:mb-3 bg-blue-500 text-white rounded-3xl hover:bg-blue-600 transition duration-200 text-xs sm:text-sm mx-auto block shadow-md"
                onClick={() => setModalOpen(true)}
              >
                Adicionar Matéria
              </button>
              <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 bg-white py-1 sm:py-2 rounded-3xl shadow-sm">
                Use + e - ou o calendário pra ajustar faltas. Clique em 'Editar', 'Excluir' ou 'Calendário' pra gerenciar.
              </p>
            </div>

            <MateriaList
              materias={materias}
              setMaterias={setMaterias}
              setEditModalOpen={setEditModalOpen}
              setDeleteModalOpen={setDeleteModalOpen}
              setEditIndex={setEditIndex}
              setMateriaToDelete={setMateriaToDelete}
              isOnline={isOnline}
            />

            {modalOpen && <AddMateriaModal setModalOpen={setModalOpen} materias={materias} setMaterias={setMaterias} isOnline={isOnline} />}
            {editModalOpen && (
              <EditMateriaModal
                setEditModalOpen={setEditModalOpen}
                editIndex={editIndex}
                editNome={editNome}
                setEditNome={setEditNome}
                editHoras={editHoras}
                setEditHoras={setEditHoras}
                editPesoFalta={editPesoFalta}
                setEditPesoFalta={setEditPesoFalta}
                materias={materias}
                setMaterias={setMaterias}
                isOnline={isOnline}
              />
            )}
            {deleteModalOpen && (
              <DeleteMateriaModal
                setDeleteModalOpen={setDeleteModalOpen}
                materiaToDelete={materiaToDelete}
                materias={materias}
                setMaterias={setMaterias}
                isOnline={isOnline}
              />
            )}
            {logoutModalOpen && (
              <LogoutConfirmationModal
                setLogoutModalOpen={setLogoutModalOpen}
                setLogado={setLogado}
                setIsOnline={setIsOnline}
                onLogout={handleLogoutComplete}
              />
            )}

            <div className="text-center px-2 sm:px-4">
              <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 bg-white py-1 sm:py-2 rounded-3xl shadow-sm">
                Para adicionar à tela inicial:<br />
                Android: Chrome > "Menu" (⋮) > "Adicionar à tela inicial".<br />
                iPhone: Safari > "Compartilhar" (⬆) > "Adicionar à Tela Inicial".
              </p>
            </div>
          </div>

          <footer className="bg-blue-200 p-3 sm:p-4 text-center text-gray-600 text-xs sm:text-sm mt-auto rounded-t-3xl">
            <p>Desenvolvido por Victor Guimarães</p>
            <div className="flex justify-center gap-3 sm:gap-4 mt-1 sm:mt-2">
              <a href="https://github.com/victorhugoguimaraes" target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">
                GitHub
              </a>
            </div>
          </footer>
        </>
      ) : (
        <Home setLogado={setLogado} setIsOnline={setIsOnline} />
      )}
    </div>
  );
}

export default App;