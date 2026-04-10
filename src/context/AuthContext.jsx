import { createContext, useContext, useState } from 'react';
import { setToken as saveToken, clearToken, getToken } from '../config/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => getToken());
  const [user, setUser] = useState(null);

  const login = (newToken, userData) => {
    saveToken(newToken);
    setTokenState(newToken);
    if (userData) setUser(userData);
  };

  const logout = () => {
    clearToken();
    setTokenState(null);
    setUser(null);
  };

  const isAuthenticated = !!token;
  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
