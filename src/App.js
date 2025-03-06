import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import Home from './components/Home';
import MateriaList from './components/MateriaList';
import AddMateriaModal from './components/AddMateriaModal';
import EditMateriaModal from './components/EditMateriaModal';
import DeleteMateriaModal from './components/DeleteMateriaModal';
import LogoutConfirmationModal from './components/LogoutConfirmationModal';
import NotificationManager from './components/NotificationManager';
import GamificationSystem from './components/GamificationSystem';
import { FaLinkedin, FaGithub, FaTimes, FaTrophy } from 'react-icons/fa';

function App() {
  const [logado, setLogado] = useState(() => localStorage.getItem('logado') === 'true');
  const [materias, setMaterias] = useState(() => JSON.parse(localStorage.getItem('materias')) || []);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [materiaToDelete, setMateriaToDelete] = useState(null);
  const [isOnline, setIsOnline] = useState(() => localStorage.getItem('isOnline') === 'true');
  const notificationManagerRef = React.useRef(null);
  const [gamificationOpen, setGamificationOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user && isOnline) {
        setLogado(true);
        setIsOnline(true);
        localStorage.setItem('logado', 'true');
        localStorage.setItem('isOnline', 'true');
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
        setMaterias(JSON.parse(localStorage.getItem('materias')) || []);
      } else {
        setLogado(false);
        setIsOnline(false);
        localStorage.setItem('logado', 'false');
        localStorage.setItem('isOnline', 'false');
      }
    });
    return () => unsubscribe();
  }, [isOnline, logado]);

  useEffect(() => {
    if (!isOnline && logado) {
      localStorage.setItem('materias', JSON.stringify(materias));
    }
  }, [materias, isOnline, logado]);

  const handleLogoutComplete = () => {
    setLogado(false);
    setIsOnline(false);
    setLogoutModalOpen(false);
    localStorage.setItem('logado', 'false');
    localStorage.setItem('isOnline', 'false');
    if (!isOnline) {
      localStorage.setItem('materias', JSON.stringify(materias));
    } else {
      setMaterias([]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-4 sm:py-6">
      {logado ? (
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 flex flex-col flex-grow">
          <header className="mb-4 sm:mb-6">
            <div className="relative flex justify-center items-center">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600">
                Faltaí
              </h1>
              <div className="absolute right-0 flex items-center space-x-2">
                <button
                  className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition duration-200 text-sm sm:text-base shadow-sm"
                  onClick={() => setGamificationOpen(true)}
                >
                  <FaTrophy />
                </button>
                <button
                  className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition duration-200 text-sm sm:text-base shadow-sm"
                  onClick={() => setLogoutModalOpen(true)}
                >
                  <FaTimes />
                </button>
              </div>
            </div>
          </header>

          <main className="flex-grow">
            <div className="space-y-4 sm:space-y-6">
              <button
                className="w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 text-sm sm:text-base font-medium shadow-sm"
                onClick={() => setModalOpen(true)}
              >
                Adicionar Matéria
              </button>
              <p className="text-xs sm:text-sm text-gray-600 text-center bg-white p-3 rounded-lg shadow-sm">
                Use + e - ou o calendário para ajustar faltas. Clique em 'Editar', 'Excluir' ou 'Calendário' para gerenciar.
              </p>
            </div>

            <div className="mt-6">
              <MateriaList
                materias={materias}
                setMaterias={setMaterias}
                setEditModalOpen={setEditModalOpen}
                setDeleteModalOpen={setDeleteModalOpen}
                setEditIndex={setEditIndex}
                setMateriaToDelete={setMateriaToDelete}
                isOnline={isOnline}
              />
            </div>
          </main>

          {modalOpen && <AddMateriaModal setModalOpen={setModalOpen} materias={materias} setMaterias={setMaterias} isOnline={isOnline} />}
          {editModalOpen && (
            <EditMateriaModal
              setEditModalOpen={setEditModalOpen}
              editIndex={editIndex}
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
          
          {logado && (
            <>
              <NotificationManager
                materias={materias}
                ref={notificationManagerRef}
              />
              {gamificationOpen && (
                <GamificationSystem
                  materias={materias}
                  onClose={() => setGamificationOpen(false)}
                  onNotification={(notification) => {
                    if (notificationManagerRef.current) {
                      notificationManagerRef.current.addNotification(notification);
                    }
                  }}
                />
              )}
            </>
          )}

          <footer className="mt-6 bg-gray-50 p-4 text-center text-gray-600 text-xs sm:text-sm rounded-t-lg shadow-sm">
            <p>Desenvolvido por Victor Guimarães</p>
            <div className="flex justify-center gap-2 sm:gap-4">
              <a href="https://www.linkedin.com/in/victor-hugo-guimarães-nascimento/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                <FaLinkedin className="text-xl sm:text-2xl" />
              </a>
              <a href="https://github.com/victorhugoguimaraes" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                <FaGithub className="text-xl sm:text-2xl" />
              </a>
            </div>
            <div className="mt-2">
              <p className="text-xs sm:text-sm text-gray-500">
                <strong>Adicionar à tela inicial:</strong><br />
                <span className="block">Android: No Chrome, clique em "⋮" {'>'} "Adicionar à tela inicial".</span>
                <span className="block">iPhone: No Safari, clique em "⬆" {'>'} "Adicionar à Tela Inicial".</span>
              </p>
            </div>
          </footer>
        </div>
      ) : (
        <Home setLogado={setLogado} setIsOnline={setIsOnline} />
      )}
    </div>
  );
}

export default App;