import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, AlertCircle } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, ingresa tu correo y contraseña.');
      return;
    }

    setIsLoading(true);
    setError('');

    const result = await login(email, password);
    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.error || 'Credenciales inválidas. Verifica tu correo y contraseña.');
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-50 dark:bg-dark-950 px-4 transition-colors duration-300">

      {/* Botón flotante para cambiar de tema */}
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      {/* Gradientes decorativos de fondo en modo oscuro */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-[40%] -left-[20%] h-[80%] w-[60%] rounded-full bg-indigo-500/10 blur-[120px] dark:bg-indigo-500/5"></div>
        <div className="absolute -bottom-[40%] -right-[20%] h-[80%] w-[60%] rounded-full bg-violet-500/10 blur-[120px] dark:bg-violet-500/5"></div>
      </div>

      {/* Tarjeta de Login Glassmorphic */}
      <div className="w-full max-w-md animate-fade-in">
        <div className="glass rounded-2xl p-8 shadow-xl dark:shadow-indigo-500/5 transition-all duration-300 border border-slate-200/80 dark:border-dark-700/60">

          <div className="flex flex-col items-center mb-8">
            {/* Logo del ERP con Gradiente */}
            <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-600/35 mb-3 text-white font-bold text-xl">
              E
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-dark-300">
              Sistema de Inventario y Ventas
            </h1>
            <p className="text-sm text-slate-500 dark:text-dark-400 mt-1">
              Ingresa al portal
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-dark-300 mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 w-5 h-5 -translate-y-1/2 text-slate-400 dark:text-dark-500" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nombre@empresa.com"
                  className="w-full rounded-xl bg-slate-100 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 py-3 pl-11 pr-4 text-sm text-slate-950 dark:text-white placeholder-slate-400 dark:placeholder-dark-600 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-dark-300 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 w-5 h-5 -translate-y-1/2 text-slate-400 dark:text-dark-500" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl bg-slate-100 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 py-3 pl-11 pr-4 text-sm text-slate-950 dark:text-white placeholder-slate-400 dark:placeholder-dark-600 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 hover:shadow-indigo-500/35 focus:outline-none active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Iniciando sesión segura...</span>
                </>
              ) : (
                <span>Iniciar Sesión</span>
              )}
            </button>
          </form>

          {/* Credenciales de muestra de forma estética */}
          <div className="mt-8 pt-6 border-t border-slate-200/50 dark:border-dark-800/50 text-center">
            <p className="text-xs text-slate-400 dark:text-dark-500">
              Demo Admin: <span className="font-semibold text-slate-600 dark:text-dark-300">admin@erp.local</span> / <span className="font-semibold text-slate-600 dark:text-dark-300">admin123</span>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;
