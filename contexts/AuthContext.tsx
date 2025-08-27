
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User, Role } from '../types';
import * as authService from '../services/auth';
import * as sessionService from '../services/session';
import { supabase } from '../services/supabaseClient';

// For debugging purposes, can be turned off in production
const DEBUG_AUTH = true;

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
      if (DEBUG_AUTH) {
          console.log(`[Auth State Change] Event: ${event}`, { session, hash: window.location.hash });
      }

      try {
        if (event === 'PASSWORD_RECOVERY') {
          setIsPasswordRecovery(true);
          setUser(null);
        } else if (session?.user) {
          // This handles SIGNED_IN, TOKEN_REFRESHED, USER_UPDATED events.
          setIsPasswordRecovery(false);
          
          // CRITICAL STEP 1: Get user profile and update React state FIRST.
          // This ensures protected routes will see the user as logged in.
          const profile = await sessionService.getAndEnsureUserProfile();
          setUser(profile);

          // CRITICAL STEP 2: Handle the specific post-OAuth redirect case.
          // This logic runs only once, right after returning from Google.
          if (event === 'SIGNED_IN' && window.location.hash.includes('access_token')) {
              if (DEBUG_AUTH) console.log('[Auth] OAuth callback detected. Navigating to dashboard.');
              
              // Atomically replace the auth hash with the dashboard route hash.
              // This prevents an intermediate state where the hash is empty, which
              // would cause the HashRouter to redirect to the login page.
              window.location.hash = '/dashboard';
          }
        } else {
          // This handles SIGNED_OUT event or no session found.
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
