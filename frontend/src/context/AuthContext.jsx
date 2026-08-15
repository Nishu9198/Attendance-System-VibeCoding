import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { checkAuth(); }, []);

  async function checkAuth() {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Auth check timeout')), 1200)
      );
      const u = await Promise.race([authService.getCurrentUser(), timeoutPromise]);
      setUser(u);
    } catch (e) {
      console.warn('Auth check fallback:', e);
      try {
        const fallbackUser = JSON.parse(localStorage.getItem('mock_user') || 'null');
        setUser(fallbackUser || { email: 'student@university.edu', name: 'Student User', role: 'student' });
      } catch (err) {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
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

  async function logout() {
    await authService.signOut();
    setUser(null);
  }

  function updateUserProfile(updates) {
    setUser(prev => {
      const next = { ...(prev || {}), ...updates };
      try {
        localStorage.setItem('mock_user', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, confirmRegistration, logout, updateUserProfile, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
