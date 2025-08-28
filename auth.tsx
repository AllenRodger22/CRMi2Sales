import React, { createContext, useState, ReactNode, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Role } from './types';
import * as authService from './services/auth';
import { ApiError } from './services/apiClient';

type AuthState = 'loading' | 'authed' | 'guest';

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: Role) => Promise<{ confirmationSent: boolean }>;
  logout: () => void;
  error: string | null;
  state: AuthState;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
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
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('authToken'));
  const [state, setState] = useState<AuthState>('loading');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleAuthSuccess = (newToken: string, newUser: User) => {
    setError(null);
    localStorage.setItem('authToken', newToken);
    setToken(newToken);
    setUser(newUser);
    setState('authed');
    navigate('/dashboard', { replace: true });
  };
  
  const handleLogout = useCallback(() => {
    setError(null);
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
    setState('guest');
    navigate('/login', { replace: true });
  }, [navigate]);

  useEffect(() => {
    const validateToken = async () => {
      if (token) {
        try {
          const currentUser = await authService.getMe();
          setUser(currentUser);
          setState('authed');
        } catch (err) {
          if (err instanceof ApiError && err.status === 401) {
             console.log('Sessão inválida, fazendo logout.');
             handleLogout();
          } else {
            console.error('Falha ao validar sessão:', err);
            setError('Não foi possível verificar sua sessão.');
            handleLogout(); // Logout on any other error during validation
          }
        }
      } else {
        setState('guest');
      }
    };
    validateToken();
  }, [token, handleLogout]);

  const login = async (email: string, password: string) => {
    setState('loading');
    setError(null);
    try {
      const { token: newToken, user: newUser } = await authService.login(email, password);
      handleAuthSuccess(newToken, newUser);
    } catch (err: any) {
      console.error("Login failed", err);
      const errorMessage = err instanceof ApiError ? err.message : 'Falha ao fazer login';
      setError(errorMessage);
      setState('guest');
      throw err;
    }
  };

  const register = async (name: string, email: string, password: string, role: Role) => {
    setState('loading');
    setError(null);
    try {
      return await authService.register({ name, email, password, role });
    } catch (err: any) {
       console.error("Registration failed", err);
       setError(err.message || 'Falha ao registrar.');
       setState('guest');
       throw err;
    } finally {
        if (state === 'loading') setState('guest'); // Ensure state is not stuck on loading
    }
  };

  const sendPasswordResetEmail = async (email: string) => {
    setState('loading');
    setError(null);
    try {
      await authService.sendPasswordResetEmail(email);
    } catch (err: any) {
      console.error("Password reset failed", err);
      setError(err.message || 'Falha ao enviar email de redefinição.');
      throw err;
    } finally {
      setState('guest');
    }
  };
  
  const updatePassword = async (password: string) => {
     setState('loading');
     setError(null);
     try {
       await authService.updatePassword(password);
       // The backend should handle invalidating other sessions if necessary.
     } catch (err: any) {
        console.error("Password update failed", err);
        setError(err.message || 'Falha ao atualizar a senha.');
        throw err;
     } finally {
         setState('authed');
     }
  };

  const logout = () => {
    // Optionally call a backend endpoint to invalidate the token
    // authService.logout(); 
    handleLogout();
  };

  const value: AuthContextType = {
    token,
    user,
    login,
    register,
    logout,
    error,
    state,
    sendPasswordResetEmail,
    updatePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};