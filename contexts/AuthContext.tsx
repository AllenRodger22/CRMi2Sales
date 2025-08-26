
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User, Role } from '../types';
import * as api from '../services/mockApi'; // This is now our real API service

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: Role) => Promise<any>;
  logout: () => void;
  isLoading: boolean; // For login/action loading states
  error: string | null;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  isLoading: false,
  error: null,
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false); // For login action
  const [isInitializing, setIsInitializing] = useState(true); // For initial load
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('authToken');
      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error("Failed to parse auth data from localStorage", e);
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    } finally {
      setIsInitializing(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.login(email, password);
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      // **FIX:** Store the auth token to authenticate API calls.
      localStorage.setItem('authToken', data.token); 
    } catch (err: any) {
      console.error("Login failed", err);
      setError(err.message || 'Failed to login');
      throw err; // Re-throw to be caught in the login component
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, role: Role) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.register(name, email, password, role);
      return data; // Return data on success
    } catch (err: any) {
       console.error("Registration failed", err);
       setError(err.message || 'Failed to register');
       throw err; // Re-throw to be caught in the component
    } finally {
        setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    // **FIX:** Also remove the auth token on logout.
    localStorage.removeItem('authToken');
  };

  // Display a loading screen during the initial check to prevent flashing the login page
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
        <p>Initializing session...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  );
};