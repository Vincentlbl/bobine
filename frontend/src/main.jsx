import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Police de l'interface, installée avec npm : pas de dépendance à un site externe.
import '@fontsource-variable/bricolage-grotesque/wdth.css';
import './styles/tokens.css';
import './styles/base.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ToastProvider>
  </StrictMode>
);
