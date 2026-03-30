import React from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { MateriasProvider } from '../contexts/MateriasContext';
import { ErrorProvider } from '../contexts/ErrorContext';
import NotificationToast from '../components/common/NotificationToast';

function AppProviders({ children }) {
  return (
    <ErrorProvider>
      <AuthProvider>
        <MateriasProvider>
          {children}
          <NotificationToast />
        </MateriasProvider>
      </AuthProvider>
    </ErrorProvider>
  );
}

export default AppProviders;
