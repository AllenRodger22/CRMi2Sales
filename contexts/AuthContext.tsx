
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
  isInitializing: boolean;
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
  isInitializing: true,
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // After Supabase has processed the token from the URL (indicated by the SIGNED_IN event
      // and the presence of the token in the hash), we clean the URL and navigate.
      if (event === 'SIGNED_IN' && window.location.hash.includes('access_token')) {
        // Use replaceState to clean the URL of the token without adding to history.
        // Then, set the hash to navigate to the dashboard, which the HashRouter will handle.
        window.history.replaceState(null, '', window.location.pathname);
        window.location.hash = '/dashboard';
      }
      
      try {
        if (event === 'PASSWORD_RECOVERY') {
          setIsPasswordRecovery(true);
          setUser(null);
        } else if (session?.user) {
          setIsPasswordRecovery(false);
          const profile = await sessionService.getAndEnsureUserProfile();
          setUser(profile);
        } else {
          setIsPasswordRecovery(false);
          setUser(null);
        }
      } catch (e) {
          console.error("Error during auth state change:", e);
          setUser(null); // Ensure user is logged out on error
      } finally {
          setIsInitializing(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.login(email, password);
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
       setIsPasswordRecovery(false);
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

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading, error, loginWithGoogle, sendPasswordResetEmail, updatePassword, isPasswordRecovery, isInitializing }}>
      {children}
    </AuthContext.Provider>
  );
};