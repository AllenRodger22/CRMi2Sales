
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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

  useEffect(() => {
    let mounted = true;

    // This listener is the single source of truth for the auth state.
    // It handles initial session, sign in, sign out, and token refresh.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!mounted) return;

        // Special flow for password recovery
        if (event === 'PASSWORD_RECOVERY') {
            setIsPasswordRecovery(true);
            setState('guest');
            setUser(null);
            setSession(null);
            return; // Show the update password page
        }
        // Exit recovery mode on any other event, except after password has been updated
        if (isPasswordRecovery && event !== 'USER_UPDATED') {
            setIsPasswordRecovery(false);
        }

        if (session?.user) {
            try {
                // Fetch the user's profile from our `profiles` table.
                // This is crucial for getting app-specific data like `role`.
                const profile = await getAndEnsureUserProfile();
                setUser(profile);
                setSession(session);
                setState('authed');

                // On successful sign-in, redirect to the dashboard.
                if (event === 'SIGNED_IN') {
                    // Use a timeout to allow the session to be fully set in Supabase client
                    setTimeout(() => (window.location.hash = '#/dashboard'), 0);
                }
            } catch(e) {
                console.error("Auth Error: Failed to fetch user profile.", e);
                // If profile fetch fails, treat the user as a guest to prevent access.
                setUser(null);
                setSession(null);
                setState('guest');
            }
        } else {
            // No session or user, so they are a guest.
            setUser(null);
            setSession(null);
            setState('guest');
             if (event === 'SIGNED_OUT') {
                window.location.hash = '#/login';
            }
        }
    });

    // Initial check to transition from 'loading' state.
    // The 'INITIAL_SESSION' event from the listener above will handle the final state.
    supabase.auth.getSession().then(({ data }) => {
        if (mounted && state === 'loading' && !data.session) {
            setState('guest');
        }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [isPasswordRecovery, state]);

  // Wrapper functions to expose auth services to components
  const performApiCall = async (serviceCall: Function, ...args: any[]) => {
    setApiLoading(true);
    setError(null);
    try {
      return await serviceCall(...args);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setApiLoading(false);
    }
  };

  const loginWithGoogle = () => performApiCall(authService.loginWithGoogle);
  const register = (name: string, email: string, password: string, role: Role) => performApiCall(authService.register, { name, email, password, role });
  const sendPasswordResetEmail = (email: string) => performApiCall(authService.sendPasswordResetEmail, email);
  const updatePassword = async (password: string) => {
    await performApiCall(authService.updatePassword, password);
    setIsPasswordRecovery(false);
  };
  const logout = () => authService.logout();
  
  const value = {
    state,
    user,
    session,
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
