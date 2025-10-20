import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useMaterias } from './contexts/MateriasContext';
import notificationService from './services/notificationService';
import Home from './components/Home';
import MateriaList from './components/MateriaList';
import LoadingSpinner from './components/common/LoadingSpinner';
import { FaLinkedin, FaGithub, FaTimes, FaChartBar, FaPlus } from 'react-icons/fa';

const AddMateriaModal = lazy(() => import('./components/AddMateriaModal'));
const EditMateriaModal = lazy(() => import('./components/EditMateriaModal'));
const DeleteMateriaModal = lazy(() => import('./components/DeleteMateriaModal'));
const LogoutConfirmationModal = lazy(() => import('./components/LogoutConfirmationModal'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const NotificationManager = lazy(() => import('./components/NotificationManager'));

function App() {
  const { user, loading } = useAuth();
  const { materias } = useMaterias();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [materiaToDelete, setMateriaToDelete] = useState(null);

  // Inicializa o serviço de notificações push quando o usuário está logado
  useEffect(() => {
    if (user) {
      // Solicita permissão e inicializa o serviço
      notificationService.requestPermission().then(() => {
        notificationService.init();
        // Atualiza notificações baseado nas matérias atuais
        notificationService.updateAllScheduledNotifications(materias);
      });
    }
  }, [user, materias]);

  // Atualiza notificações quando as matérias mudam
  useEffect(() => {
    if (user && materias) {
      notificationService.updateAllScheduledNotifications(materias);
    }
  }, [materias, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Home />;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col">
      <div className="w-full mx-auto px-3 sm:px-6 flex flex-col flex-grow">
        <header className="mb-4 sm:mb-8 py-2 sm:py-4">
          <div className="relative flex justify-center items-center">
            <div className="text-center">
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold gradient-text mb-1 sm:mb-2">
                Faltaí
              </h1>
              <p className="text-neutral-600 text-xs sm:text-sm">
                Controle suas faltas
              </p>
            </div>
            
            <div className="absolute right-0 flex items-center space-x-1 sm:space-x-3">
              {/* NotificationManager integrado no header */}
              <NotificationManager materias={materias} />
              
              <button
                className="p-2 sm:p-3 bg-gradient-success text-white rounded-lg sm:rounded-2xl hover:shadow-medium transition-all duration-200 text-xs sm:text-base"
                onClick={() => setDashboardOpen(true)}
                title="Dashboard Analytics"
              >
                <FaChartBar size={16} className="sm:hidden" />
                <FaChartBar size={20} className="hidden sm:block" />
              </button>
              <button
                className="p-2 sm:p-3 bg-gradient-to-r from-danger-500 to-danger-600 text-white rounded-lg sm:rounded-2xl hover:shadow-medium transition-all duration-200 text-xs sm:text-base"
                onClick={() => setLogoutModalOpen(true)}
                title="Sair"
              >
                <FaTimes size={16} className="sm:hidden" />
                <FaTimes size={20} className="hidden sm:block" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-grow px-2 sm:px-0">
          <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
            <div className="text-center">
              <button
                className="btn-primary text-sm sm:text-lg px-4 sm:px-8 py-3 sm:py-4 hover-lift shadow-soft w-full sm:w-auto"
                onClick={() => setModalOpen(true)}
              >
                <FaPlus className="inline mr-2 sm:mr-3" size={14} />
                Adicionar Matéria
              </button>
              
              <div className="mt-4 p-4 glass-effect rounded-2xl shadow-soft max-w-2xl mx-auto">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <h3 className="font-semibold text-neutral-700">Como usar</h3>
                </div>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  Toque no <strong className="text-primary-600">botão azul com "+"</strong> para adicionar faltas rapidamente.
                  Use os ícones para <span className="text-warning-600">editar</span>, 
                  <span className="text-danger-600"> excluir</span> ou 
                  <span className="text-primary-600"> ver o calendário</span> da matéria.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <MateriaList
              setEditModalOpen={setEditModalOpen}
              setDeleteModalOpen={setDeleteModalOpen}
              setEditIndex={setEditIndex}
              setMateriaToDelete={setMateriaToDelete}
            />
          </div>
        </main>

        <Suspense fallback={<LoadingSpinner size="md" />}>
          {modalOpen && <AddMateriaModal setModalOpen={setModalOpen} />}
          {editModalOpen && <EditMateriaModal setEditModalOpen={setEditModalOpen} editIndex={editIndex} />}
          {deleteModalOpen && <DeleteMateriaModal setDeleteModalOpen={setDeleteModalOpen} materiaToDelete={materiaToDelete} />}
          {logoutModalOpen && <LogoutConfirmationModal setLogoutModalOpen={setLogoutModalOpen} />}
          {dashboardOpen && <Dashboard onClose={() => setDashboardOpen(false)} />}
        </Suspense>

        <footer className="mt-8 glass-effect p-6 text-center rounded-2xl shadow-soft">
          <div className="gradient-text font-semibold mb-3">
            Desenvolvido por Victor Guimarães
          </div>
          <div className="flex justify-center gap-6">
            <a 
              href="https://www.linkedin.com/in/victor-hugo-guimarães-nascimento/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="p-3 bg-primary-100 text-primary-600 hover:bg-primary-200 rounded-xl transition-all duration-200"
              title="LinkedIn"
            >
              <FaLinkedin size={24} />
            </a>
            <a 
              href="https://github.com/victorhugoguimaraes" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="p-3 bg-neutral-100 text-neutral-600 hover:bg-neutral-200 rounded-xl transition-all duration-200"
              title="GitHub"
            >
              <FaGithub size={24} />
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;