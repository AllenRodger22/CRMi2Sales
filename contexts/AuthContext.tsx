import React, { createContext, useState, ReactNode } from 'react';
// FIX: Use `import type` for Supabase types to fix module resolution errors.
import type { Session, AuthError, User as AuthUser } from '@supabase/supabase-js';
import { User, Role } from '../types';
import { supabase } from '../services/supabaseClient';

interface AuthContextType {
  session: Session | null;
  setSession: (session: Session | null) => void;
  user: User | null;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: Role) => Promise<{ user: AuthUser | null; session: Session | null; error: AuthError | null; }>;
  logout: () => Promise<void>;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  isPasswordRecovery: boolean;
  setIsPasswordRecovery: (isRecovery: boolean) => void;
}

export const AuthContext = createContext<AuthContextType>({
  session: null,
  setSession: () => {},
  user: null,
  setUser: () => {},
  login: async () => {},
  register: async () => ({ user: null, session: null, error: null }),
  logout: async () => {},
  loading: true,
  setLoading: () => {},
  error: null,
  setError: () => {},
  sendPasswordResetEmail: async () => {},
  updatePassword: async () => {},
  isPasswordRecovery: false,
  setIsPasswordRecovery: () => {},
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // onAuthStateChange in useAuthBoot will handle the rest
    } catch (err: any) {
      console.error("Login failed", err);
      setError(err.message || 'Failed to login');
      setLoading(false);
      throw err;
    }
  };

  const register = async (name: string, email: string, password: string, role: Role) => {
    setLoading(true);
    setError(null);
    try {
      // Pass user metadata to be used by the RPC function that creates the profile
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            role: role,
          },
        },
      });
      if (error) throw error;
      return { user: data.user, session: data.session, error: null };
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
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            // The redirect URL must match what's configured in your Supabase project settings
            redirectTo: window.location.origin + window.location.pathname + '#/update-password',
        });
        if (error) throw error;
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
       // This function is for logged-in users or those in a recovery flow
       const { error } = await supabase.auth.updateUser({ password });
       if (error) throw error;
       setIsPasswordRecovery(false); // Success, so clear recovery state
     } catch (err: any) {
        console.error("Password update failed", err);
        setError(err.message || 'Failed to update password');
        throw err;
     } finally {
         setLoading(false);
     }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if(error) {
        console.error("Logout failed", error);
        setError(error.message);
    }
    // onAuthStateChange in useAuthBoot will clear session/user state
  };

  return (
    <AuthContext.Provider value={{ 
        session, setSession,
        user, setUser, 
        login, register, logout, 
        loading, setLoading, 
        error, setError, 
        sendPasswordResetEmail, updatePassword, 
        isPasswordRecovery, setIsPasswordRecovery 
    }}>
      {children}
    </AuthContext.Provider>
  );
};