import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User, Role } from '../types';
import * as authService from '../services/auth';
import * as profileService from '../services/profile';
import { supabase } from '../services/supabaseClient';
import { User as SupabaseUser } from '@supabase/supabase-js';


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
  isProfileSetupRequired: boolean;
  tempSessionUser: SupabaseUser | null;
  completeUserProfile: (name: string, role: Role) => Promise<void>;
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
  isProfileSetupRequired: false,
  tempSessionUser: null,
  completeUserProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [isProfileSetupRequired, setIsProfileSetupRequired] = useState(false);
  const [tempSessionUser, setTempSessionUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setIsLoading(true);
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
        setUser(null);
        setIsProfileSetupRequired(false);
      } else if (event === 'SIGNED_IN' && session?.user) {
        setIsPasswordRecovery(false);
        // Check if the user profile exists in our public.profiles table.
        const profile = await profileService.getProfile(session.user.id);
        
        if (profile) {
            // Profile exists, user can proceed.
            setUser(profile);
            setIsProfileSetupRequired(false);
            setTempSessionUser(null);
        } else {
            // This is the first login, profile needs to be created.
            setUser(null);
            setTempSessionUser(session.user);
            setIsProfileSetupRequired(true);
        }
        
        if (window.location.hash.includes('access_token')) {
            window.location.hash = '/';
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsPasswordRecovery(false);
        setIsProfileSetupRequired(false);
        setTempSessionUser(null);
      }
      setIsInitializing(false);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const completeUserProfile = async (name: string, role: Role) => {
    if (!tempSessionUser) throw new Error("No temporary session found to create profile.");
    setIsLoading(true);
    setError(null);
    try {
        const newProfile = await profileService.createProfile({
            id: tempSessionUser.id,
            email: tempSessionUser.email!,
            name,
            role,
        });
        setUser(newProfile);
        setIsProfileSetupRequired(false);
        setTempSessionUser(null);
    } catch (err: any) {
        console.error("Profile completion failed", err);
        setError(err.message || 'Failed to complete profile');
        throw err;
    } finally {
        setIsLoading(false);
    }
  };

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
    // onAuthStateChange('SIGNED_OUT') will handle state cleanup.
  };

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-white text-lg">Carregando sessão...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading, error, loginWithGoogle, sendPasswordResetEmail, updatePassword, isPasswordRecovery, isProfileSetupRequired, tempSessionUser, completeUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
