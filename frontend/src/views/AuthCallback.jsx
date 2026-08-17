import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export const AuthCallback = () => {
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const [statusMessage, setStatusMessage] = useState('Verificando credenciales de Google...');
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const parseUrlError = () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const hashError = hashParams.get('error_description') || hashParams.get('error');

      const queryParams = new URLSearchParams(window.location.search);
      const queryError = queryParams.get('error_description') || queryParams.get('error');

      return hashError || queryError;
    };

    const extractEmailFromHashOrSession = async () => {
      // 1. Intentar obtener el correo vía el SDK de Supabase
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
          return session.user.email;
        }
      } catch (e) {
        console.warn('getSession no retornó sesión activa, probando fallback de hash:', e);
      }

      // 2. Fallback de alta confiabilidad: Decodificar JWT directamente del hash de la URL
      if (window.location.hash) {
        try {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          if (accessToken) {
            const base64Url = accessToken.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
              atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
            );
            const parsed = JSON.parse(jsonPayload);
            if (parsed?.email) {
              return parsed.email;
            }
          }
        } catch (err) {
          console.error('Error al parsear access_token desde URL hash:', err);
        }
      }

      return null;
    };

    const validateWithBackend = async (email) => {
      if (isMounted) {
        setStatusMessage(`Validando cuenta ERP para ${email}...`);
      }

      try {
        const response = await api.auth.googleLogin(email);

        if (response?.access_token && response?.user) {
          loginWithToken(response.access_token, response.user);
          if (isMounted) {
            navigate('/', { replace: true });
          }
        } else {
          throw new Error('El servidor ERP no retornó credenciales válidas.');
        }
      } catch (backendError) {
        console.error('Error del servidor ERP:', backendError);
        await supabase.auth.signOut();

        const deniedMessage =
          backendError.response?.data?.detail ||
          'Acceso denegado: Tu cuenta no está registrada en el sistema ERP. Contacta al administrador.';

        if (isMounted) {
          setErrorMsg(deniedMessage);
        }
      }
    };

    const handleCallback = async () => {
      const urlError = parseUrlError();
      if (urlError) {
        console.error('Error de OAuth retornado en la URL:', urlError);
        if (isMounted) {
          setErrorMsg(`Error de autenticación Google/Supabase: ${decodeURIComponent(urlError)}`);
        }
        return;
      }

      const email = await extractEmailFromHashOrSession();

      if (email) {
        await validateWithBackend(email);
        return;
      }

      // Si por alguna razón la sesión se procesa asíncronamente
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && currentSession?.user?.email) {
          subscription.unsubscribe();
          await validateWithBackend(currentSession.user.email);
        }
      });

      // Timeout en caso de que no haya token o sesión
      setTimeout(() => {
        if (isMounted && !errorMsg) {
          setErrorMsg(
            'No se obtuvo una sesión válida de Google. Verifica que el proveedor Google esté habilitado en el Dashboard de Supabase.'
          );
        }
      }, 3500);
    };

    handleCallback();

    return () => {
      isMounted = false;
    };
  }, [navigate, loginWithToken]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-dark-950 px-4 transition-colors duration-300">
      <div className="w-full max-w-lg glass rounded-2xl p-8 shadow-xl text-center border border-slate-200/80 dark:border-dark-700/60">
        {errorMsg ? (
          <div className="flex flex-col items-center gap-4 text-red-600 dark:text-red-400">
            <AlertCircle className="w-12 h-12" />
            <h2 className="text-xl font-bold">Estado de Autenticación</h2>
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-600 dark:text-red-300 text-left w-full">
              {errorMsg}
            </div>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="mt-2 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a Iniciar Sesión</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-base font-medium text-slate-700 dark:text-dark-200">{statusMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
