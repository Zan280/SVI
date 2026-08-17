import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Si el usuario ya está cargado en estado (ej. por loginWithToken o login), no volvemos a resetearlo
      if (!user) {
        axios.get('/api/v1/auth/me')
          .then(response => {
            setUser(response.data);
          })
          .catch((err) => {
            console.error('Error al validar sesión previa con /me:', err);
            logout();
          })
          .finally(() => {
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    } else {
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await axios.post('/api/v1/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const { access_token, user: userData } = response.data;
      localStorage.setItem('token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setUser(userData);
      setToken(access_token);
      return { success: true };
    } catch (error) {
      console.error('Error de login:', error);
      const detail = error.response?.data?.detail || 'Error de conexión con el servidor.';
      return { success: false, error: detail };
    } finally {
      setLoading(false);
    }
  };

  const loginWithToken = (access_token, userData) => {
    localStorage.setItem('token', access_token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    setUser(userData);
    setToken(access_token);
    setLoading(false);
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error al cerrar sesión en Supabase:', err);
    }
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setToken('');
    setUser(null);
    setLoading(false);
  };

  const hasRole = (allowedRoles) => {
    if (!user) return false;
    return allowedRoles.includes(user.role_nombre);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, loginWithToken, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);


