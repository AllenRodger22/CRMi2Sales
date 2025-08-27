
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './services/supabaseClient';
import { getAndEnsureUserProfile } from './services/session';
import { User, Role } from './types';
import * as authService from './services/auth';
import { Session } from '@supabase/supabase-js';

type AuthState = 'loading' | 'authed' | 'guest';

interface AuthContextType {
  state: AuthState;
  user: User | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (name: string, email: string, password: string, role: Role) => Promise<{ confirmationSent: boolean }>;
  logout: () => void;
  loading: boolean;
  error: string | null;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  isPasswordRecovery: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [apiLoading, setApiLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        try {
          const profile = await getAndEnsureUserProfile();
          setUser(profile);
          setState('authed');
        } catch (e) {
          console.error("Failed to fetch profile on initial load", e);
          setUser(null);
          setState('guest');
        }
      } else {
        setUser(null);
        setState('guest');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.debug('[auth]', event, !!session);

      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
        setState('guest');
        setUser(null);
        setSession(null);
        return;
      }
      
      if (isPasswordRecovery) setIsPasswordRecovery(false);

      if (event === 'SIGNED_IN' && session?.user) {
        setSession(session);
        setState('loading');
        try {
          const profile = await getAndEnsureUserProfile();
          setUser(profile);
          setState('authed');
          history.replaceState(null, '', window.location.origin + window.location.pathname + window.location.search);
        } catch (e) {
          console.error('Sign in failed during profile fetch', e);
          setUser(null);
          setState('guest');
          setError('Falha ao carregar perfil do usuário.');
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setState('guest');
        setIsPasswordRecovery(false);
        navigate('/login', { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, isPasswordRecovery]);

  const login = async (email: string, password: string) => {
    setApiLoading(true);
    setError(null);
    try {
      await authService.login(email, password);
    } catch (err: any) {
      setError(err.message || 'Failed to login');
      throw err;
    } finally {
      setApiLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setApiLoading(true);
    setError(null);
    try {
        await authService.loginWithGoogle();
    } catch (err: any) {
        setError(err.message || 'Failed to login with Google');
        throw err;
    } finally {
      setApiLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, role: Role) => {
    setApiLoading(true);
    setError(null);
    try {
      return await authService.register({ name, email, password, role });
    } catch (err: any) {
       setError(err.message || 'Failed to register');
       throw err;
    } finally {
        setApiLoading(false);
    }
  };
  
  const sendPasswordResetEmail = async (email: string) => {
    setApiLoading(true);
    setError(null);
    try {
        await authService.sendPasswordResetEmail(email);
    } catch (err: any) {
        setError(err.message || 'Failed to send reset email');
        throw err;
    } finally {
        setApiLoading(false);
    }
  };
  
  const updatePassword = async (password: string) => {
     setApiLoading(true);
     setError(null);
     try {
       await authService.updatePassword(password);
       setIsPasswordRecovery(false);
     } catch (err: any) {
        setError(err.message || 'Failed to update password');
        throw err;
     } finally {
         setApiLoading(false);
     }
  };

  const logout = async () => {
    await authService.logout();
  };

  const value = {
    state,
    user,
    session,
    login,
    loginWithGoogle,
    register,
    logout,
    loading: apiLoading || state === 'loading',
    error,
    sendPasswordResetEmail,
    updatePassword,
    isPasswordRecovery,
  };

  return (
    <AuthContext.Provider value={value}>
      {state === 'loading' ? <div className="flex items-center justify-center min-h-screen text-white">Carregando sessão…</div> : children}
    </AuthContext.Provider>
  );
}
