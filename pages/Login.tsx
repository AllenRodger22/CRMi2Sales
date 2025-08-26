
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuth();
  const [localError, setLocalError] = useState<string | null>(null);
  
  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLocalError(null);
    if (!email || !password) {
        setLocalError('Email and password are required.');
        return;
    }
    try {
      await login(email, password);
      // Navigation will happen automatically from the Router component
    } catch (err: any) {
      setLocalError(err.message || 'Invalid credentials.');
    }
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-6 sm:p-8 space-y-8 rounded-2xl bg-gray-900/70 backdrop-blur-md border border-white/20 shadow-lg">
        <div>
          <h2 className="text-center text-2xl sm:text-3xl font-light text-white font-poppins">
            Bem-vindo ao <span className="text-orange-500">i2Sales</span>
          </h2>
          <p className="mt-2 text-center text-sm text-gray-300">
            Faça login para continuar
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 bg-white/5 border border-white/20 placeholder-gray-400 text-white rounded-t-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 bg-white/5 border border-white/20 placeholder-gray-400 text-white rounded-b-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          
           <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:bg-orange-800 disabled:cursor-not-allowed transition"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
            {localError && <p className="text-sm text-red-400 text-center">{localError}</p>}
        </form>
         <p className="mt-4 text-center text-sm text-gray-400">
            Não tem uma conta?{' '}
            <Link to="/register" className="font-medium text-orange-400 hover:text-orange-300">
                Registre-se
            </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;