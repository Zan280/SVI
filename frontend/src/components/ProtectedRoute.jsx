import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, hasRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-dark-950 text-slate-800 dark:text-dark-100">
        <div className="w-12 h-12 border-4 border-indigo-600 dark:border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 font-medium animate-pulse">Cargando sesión segura...</p>
      </div>
    );
  }

  if (!user) {
    // Redirigir al login y guardar la ubicación actual
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    // Si el usuario no tiene el rol adecuado, redirigir al dashboard/home con advertencia
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
