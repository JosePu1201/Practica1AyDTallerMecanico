// src/auth/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

// Helper: setea/elimina el header Authorization en axios
function setAuthHeader(token) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
}

// Helper: normaliza el usuario para garantizar user.rol
function normalizeUser(raw) {
  if (!raw) return null;
  const u = { ...raw };
  // Asegurar que exista "rol"
  if (u.rol === undefined && u.role !== undefined) u.rol = u.role;
  return u;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);   // { id, nombre_usuario, rol, ... }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Hidratar sesión desde localStorage
    try {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      if (token) setAuthHeader(token);
      if (storedUser) {
        const parsed = normalizeUser(JSON.parse(storedUser));
        setUser(parsed);
      }
    } catch {
      // si falla el parseo, limpiamos
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  }, []);

  // Login: guarda token + user en localStorage y en estado
  const login = async (nombre_usuario, contrasena) => {
    const { data } = await api.post('/personas/login', { nombre_usuario, contrasena });
    // Suponiendo que tu API responde { token, user } (ajusta si difiere)
    const token = data.token;
    const u = normalizeUser(data.user ?? data); // por si tu API devuelve el user directo

    // Persistir
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(u));

    // Hidratar axios + estado
    setAuthHeader(token);
    setUser(u);

    return { token, user: u };
  };

  // Útil cuando verifiques código u obtengas user desde otro endpoint
  const setUserAndPersist = (rawUser) => {
    const u = normalizeUser(rawUser);
    localStorage.setItem('user', JSON.stringify(u));
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('adminSidebarCollapsed'); // limpiar preferencia del sidebar
    setAuthHeader(null);
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, setUser: setUserAndPersist, login, logout, loading }}>
      {children}
    </AuthCtx.Provider>
  );
}
