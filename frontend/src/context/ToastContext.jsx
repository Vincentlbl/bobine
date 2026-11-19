import { createContext, useCallback, useContext, useRef, useState } from 'react';
import './Toast.css';

const ToastContext = createContext(null);
const TOAST_DURATION_MS = 3500;

// Petits messages de confirmation ou d'erreur, en bas de l'écran.
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const showToast = useCallback((message, type = 'success') => {
    const id = nextId.current++;
    setToasts((current) => [...current, { id, message, type }]);
    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, TOAST_DURATION_MS);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {/* aria-live : les lecteurs d'écran annoncent les nouveaux messages */}
      <div className="toasts" aria-live="polite">
        {toasts.map((toast) => (
          <p key={toast.id} className={`toast toast--${toast.type}`}>
            {toast.message}
          </p>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  return useContext(ToastContext);
}
