import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User, Role } from '../types';
import * as authService from '../services/auth';
import * as sessionService from '../services/session';
import { supabase } from '../services/supabaseClient';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (name: string, email: string, password: string, role: Role) => Promise<{ confirmationSent: boolean }>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  isPasswordRecovery: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {},
  loginWithGoogle: async () => {},
  register: async () => ({ confirmationSent: false }),
  logout: () => {},
  isLoading: false,
  error: null,
  sendPasswordResetEmail: async () => {},
  updatePassword: async () => {},
  isPasswordRecovery: false,
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  useEffect(() => {
    // This listener handles all authentication state changes.
    // FIX: The supabase client is not exported from `authService`. It must be imported directly from `supabaseClient`.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Handle password recovery flow
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
        setUser(null);
      } else if (session?.user) {
        // When a user logs in, signs up, or the session is restored.
        setIsPasswordRecovery(false);
        // Fetch or create the user's profile from our public.profiles table.
        const profile = await sessionService.getAndEnsureUserProfile();
        setUser(profile);
      } else {
        // When a user logs out or the session expires.
        setIsPasswordRecovery(false);
        setUser(null);
      }
      setIsInitializing(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.login(email, password);
      // onAuthStateChange will handle setting the user state.
    } catch (err: any) {
      console.error("Login failed", err);
      setError(err.message || 'Failed to login');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  const loginWithGoogle = async () => {
    setIsLoading(true);
    setError(null);
    try {
        await authService.loginWithGoogle();
    } catch (err: any) {
        console.error("Google login failed", err);
        setError(err.message || 'Failed to login with Google');
        throw err;
    } finally {
        setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, role: Role) => {
    setIsLoading(true);
    setError(null);
    try {
      // The register service now only handles the signUp call.
      // Profile creation is handled by the RPC on the first login.
      return await authService.register({ name, email, password, role });
    } catch (err: any) {
       console.error("Registration failed", err);
       setError(err.message || 'Failed to register');
       throw err;
    } finally {
        setIsLoading(false);
    }
  };
  
  const sendPasswordResetEmail = async (email: string) => {
    setIsLoading(true);
    setError(null);
    try {
        await authService.sendPasswordResetEmail(email);
    } catch (err: any) {
        console.error("Password reset failed", err);
        setError(err.message || 'Failed to send reset email');
        throw err;
    } finally {
        setIsLoading(false);
    }
  };
  
  const updatePassword = async (password: string) => {
     setIsLoading(true);
     setError(null);
     try {
       await authService.updatePassword(password);
       setIsPasswordRecovery(false); // Success, exit recovery mode
     } catch (err: any) {
        console.error("Password update failed", err);
        setError(err.message || 'Failed to update password');
        throw err;
     } finally {
         setIsLoading(false);
     }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setIsPasswordRecovery(false);
  };

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-white text-lg">Carregando sessão...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading, error, loginWithGoogle, sendPasswordResetEmail, updatePassword, isPasswordRecovery }}>
      {children}
    </AuthContext.Provider>
  );
};