import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authApi from '../api/auth';
import { setSessionExpiredHandler } from '../api/client';
import { clearSession, loadSession, saveSession } from '../api/session';

const AuthContext = createContext(null);

// Rend l'utilisateur connecté disponible dans toute l'application.
export function AuthProvider({ children }) {
  // Au chargement de la page, on reprend la session gardée dans le navigateur.
  const [user, setUser] = useState(() => loadSession()?.user || null);

  const openSession = useCallback((session) => {
    saveSession(session);
    setUser(session.user);
  }, []);

  const login = useCallback(
    async (email, password) => openSession(await authApi.login(email, password)),
    [openSession]
  );

  const register = useCallback(
    async (email, password) => openSession(await authApi.register(email, password)),
    [openSession]
  );

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  // Si l'API refuse le jeton (expiré), on déconnecte : les pages protégées
  // renvoient alors d'elles-mêmes vers la connexion.
  useEffect(() => {
    setSessionExpiredHandler(logout);
  }, [logout]);

  const value = useMemo(() => ({ user, login, register, logout }), [user, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
