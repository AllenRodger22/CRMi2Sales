import React, { createContext, useState, ReactNode } from 'react';
import { User, Role } from '../types';
import * as authService from '../services/auth';

interface AuthContextType {
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
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  login: async () => {},
  loginWithGoogle: async () => {},
  register: async () => ({ confirmationSent: false }),
  logout: () => {},
  loading: true,
  setLoading: () => {},
  error: null,
  sendPasswordResetEmail: async () => {},
  updatePassword: async () => {},
  isPasswordRecovery: false,
  setIsPasswordRecovery: () => {},
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      await authService.login(email, password);
    } catch (err: any) {
      console.error("Login failed", err);
      setError(err.message || 'Failed to login');
      throw err;
    } finally {
      // setLoading will be managed by the auth state listener
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
    setUser(null);
    setIsPasswordRecovery(false);
  };

  return (
    <AuthContext.Provider value={{ 
        user, setUser, 
        login, register, logout, 
        loading, setLoading, 
        error, loginWithGoogle, 
        sendPasswordResetEmail, updatePassword, 
        isPasswordRecovery, setIsPasswordRecovery 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
