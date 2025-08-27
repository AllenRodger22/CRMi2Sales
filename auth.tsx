// FIX: Replaced the entire file with a unified and feature-complete auth provider.
// This new provider merges the logic from 'contexts/AuthContext.tsx', 'hooks/useAuth.ts', 
// and 'auth/useAuthBoot.ts' to provide a single source of truth for authentication 
// that satisfies all component requirements.

import React, { createContext, useState, ReactNode, useContext, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { User, Role } from './types';
import * as authService from './services/auth';
import { useNavigate } from 'react-router-dom';
import { supabase } from './services/supabaseClient';
import { getAndEnsureUserProfile } from './services/session';

type AuthState = 'loading' | 'authed' | 'guest';

interface AuthContextType {
  session: Session | null;
  setSession: (session: Session | null) => void;
  user: User | null;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (name: string, email: string, password: string, role: Role) => Promise<{ confirmationSent: boolean }>;
  logout: () => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  error: string | null;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  isPasswordRecovery: boolean;
  setIsPasswordRecovery: (isRecovery: boolean) => void;
  state: AuthState; 
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.debug('[auth]', event, !!session);

      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }
      
      if (isPasswordRecovery && event !== 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(false);
      }

      if (event === 'INITIAL_SESSION') {
        setSession(session ?? null);
        if (session?.user) {
          try {
            const profile = await getAndEnsureUserProfile();
            setUser(profile);
          } catch(e) {
            console.warn('Failed to get profile on initial session', e);
            setUser(null);
          }
        } else {
          setUser(null);
        }
        
        if (window.location.hash.includes('access_token=')) {
          history.replaceState(null, '', window.location.origin + window.location.pathname + window.location.search);
        }

        setLoading(false);
      } else if (event === 'SIGNED_IN' && session?.user) {
        setSession(session);
        setLoading(true);
        try {
            const profile = await getAndEnsureUserProfile();
            setUser(profile);
            history.replaceState(null, '', window.location.origin + window.location.pathname + window.location.search);
            navigate('/dashboard', { replace: true });
        } catch(e) {
            console.error('Sign in failed during profile fetch', e);
            setUser(null);
            navigate('/dashboard', { replace: true });
        } finally {
            setLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setLoading(false);
        navigate('/login', { replace: true });
      } else if (session) {
        setSession(session);
      }
    });

    return () => subscription.unsubscribe();
  }, [isPasswordRecovery, navigate]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      await authService.login(email, password);
    } catch (err: any) {
      console.error("Login failed", err);
      setError(err.message || 'Failed to login');
      setLoading(false);
      throw err;
    }
  };
  
  const loginWithGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
        await authService.loginWithGoogle();
    } catch (err: any) {
        console.error("Google login failed", err);
        setError(err.message || 'Failed to login with Google');
        setLoading(false);
        throw err;
    }
  };

  const register = async (name: string, email: string, password: string, role: Role) => {
    setLoading(true);
    setError(null);
    try {
      return await authService.register({ name, email, password, role });
    } catch (err: any) {
       console.error("Registration failed", err);
       setError(err.message || 'Failed to register');
       throw err;
    } finally {
        setLoading(false);
    }
  };
  
  const sendPasswordResetEmail = async (email: string) => {
    setLoading(true);
    setError(null);
    try {
        await authService.sendPasswordResetEmail(email);
    } catch (err: any) {
        console.error("Password reset failed", err);
        setError(err.message || 'Failed to send reset email');
        throw err;
    } finally {
        setLoading(false);
    }
  };
  
  const updatePassword = async (password: string) => {
     setLoading(true);
     setError(null);
     try {
       await authService.updatePassword(password);
       setIsPasswordRecovery(false);
     } catch (err: any) {
        console.error("Password update failed", err);
        setError(err.message || 'Failed to update password');
        throw err;
     } finally {
         setLoading(false);
     }
  };

  const logout = async () => {
    await authService.logout();
    setSession(null);
    setUser(null);
    setIsPasswordRecovery(false);
  };

  const state: AuthState = loading ? 'loading' : session ? 'authed' : 'guest';

  const value: AuthContextType = { 
        session, setSession,
        user, setUser, 
        login, register, logout, 
        loading, setLoading, 
        error, loginWithGoogle, 
        sendPasswordResetEmail, updatePassword, 
        isPasswordRecovery, setIsPasswordRecovery, 
        state
    };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
