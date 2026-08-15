import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { checkAuth(); }, []);

  async function checkAuth() {
    try {
      const u = await authService.getCurrentUser();
      setUser(u);
    } catch { setUser(null); }
    finally { setLoading(false); }
  }

  async function login(email, password, role) {
    const u = await authService.signIn(email, password, role);
    setUser(u);
    return u;
  }

  async function register(email, password, name, role) {
    return await authService.signUp(email, password, name, role);
  }

  async function confirmRegistration(email, code) {
    return await authService.confirmSignUp(email, code);
  }

  function logout() {
    authService.signOut();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, confirmRegistration, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
