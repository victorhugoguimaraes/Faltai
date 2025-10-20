import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { MateriasProvider } from './contexts/MateriasContext';
import { ErrorProvider } from './contexts/ErrorContext';
import NotificationToast from './components/common/NotificationToast';
import { registerServiceWorker } from './utils/pwaUtils';

registerServiceWorker();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorProvider>
      <AuthProvider>
        <MateriasProvider>
          <App />
          <NotificationToast />
        </MateriasProvider>
      </AuthProvider>
    </ErrorProvider>
  </React.StrictMode>
);
