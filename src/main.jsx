import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './app/App';
import AppProviders from './app/providers';
import { registerServiceWorker } from './utils/pwaUtils';

registerServiceWorker();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>
);
