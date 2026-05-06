/**
 * FaceMark - Auth Context
 * Global authentication state management
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount: restore session from localStorage
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      authAPI.me()
        .then(res => setUser(res.data))
        .catch(() => localStorage.clear())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authAPI.login({ email, password });
    localStorage.setItem('access_token',  res.data.access);
    localStorage.setItem('refresh_token', res.data.refresh);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const logout = useCallback(async () => {
    const refresh = localStorage.getItem('refresh_token');
    try { await authAPI.logout({ refresh }); } catch { /* ignore */ }
    localStorage.clear();
    setUser(null);
  }, []);

  const isAdmin   = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';
  const isStudent = user?.role === 'student';

  const handleLogin = async () => {
  try {
    const res = await api.post('/auth/login/', {
      user_id,
      password,
    });

    console.log("LOGIN RESPONSE:", res.data); // ✅ DEBUG

    // 🔥 MOST IMPORTANT (TOKEN SAVE)
    localStorage.setItem("access", res.data.access);
    axios.defaults.headers.common["Authorization"] = `Bearer ${response.data.access}`;
    localStorage.setItem("refresh", res.data.refresh);

    // optional
    localStorage.setItem("user", JSON.stringify(res.data.user));

  } catch (err) {
    console.error("LOGIN ERROR:", err.response?.data || err.message);
  }
};
  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, isTeacher, isStudent }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
