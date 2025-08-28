import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [view, setView] = useState<'login' | 'forgot_password'>('login');
  
  const { login, sendPasswordResetEmail, loading, error: authError, session, setError } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (session) {
      navigate('/dashboard', { replace: true });
    }
  }, [session, navigate]);
  
  useEffect(() => {
      if (authError) {
          setLocalError(authError);
      }
  }, [authError]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMessage(null);
    setError(null);
    
    try {
      await login(email, password);
      // AuthProvider/useAuthBoot will handle navigation on success
    } catch (err: any) {
      // The error is set in the context, and the useEffect will pick it up.
      console.error(err);
    }
  };
  
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMessage(null);
    setError(null);
     if (!email) {
        setLocalError('Por favor, digite seu e-mail.');
        return;
    }
    try {
        await sendPasswordResetEmail(email);
        setSuccessMessage('Se uma conta existir para este e-mail, um link para redefinir a senha foi enviado.');
    } catch (err: any) {
        setLocalError(err.message || 'Falha ao enviar o e-mail de redefinição.');
    }
  };

  const isFormDisabled = loading || !!successMessage;

  const renderLoginView = () => (
    <>
      <div>
        <h2 className="text-center text-2xl sm:text-3xl font-light text-white font-poppins">
          Bem-vindo ao <span className="text-orange-500">i2Sales</span>
        </h2>
        <p className="mt-2 text-center text-sm text-gray-300">
          Faça login para continuar
        </p>
      </div>
      <form className="mt-8 space-y-4" onSubmit={handleLogin}>
        <input
          id="email-address" name="email" type="email" autoComplete="email" required
          className="appearance-none relative block w-full px-3 py-3 bg-white/5 border border-white/20 placeholder-gray-400 text-white rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text/sm"
          placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
        />
        <input
          id="password" name="password" type="password" autoComplete="current-password" required
          className="appearance-none relative block w-full px-3 py-3 bg-white/5 border border-white/20 placeholder-gray-400 text-white rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text/sm"
          placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)}
        />
        <div className="flex items-center justify-end text-sm">
          <button type="button" onClick={() => { setView('forgot_password'); setLocalError(null); setSuccessMessage(null); setError(null); }} className="font-medium text-orange-400 hover:text-orange-300">
            Esqueceu a senha?
          </button>
        </div>
        <button type="submit" disabled={isFormDisabled} className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:bg-orange-800 disabled:cursor-not-allowed transition">
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-gray-400">
        Não tem uma conta?{' '}
        <Link to="/register" className="font-medium text-orange-400 hover:text-orange-300">
          Registre-se
        </Link>
      </p>
    </>
  );

  const renderForgotPasswordView = () => (
    <>
      <div>
        <h2 className="text-center text-2xl sm:text-3xl font-light text-white font-poppins">
          Redefinir Senha
        </h2>
        <p className="mt-2 text-center text-sm text-gray-300">
          Digite seu email para receber o link de redefinição.
        </p>
      </div>
      <form className="mt-8 space-y-6" onSubmit={handlePasswordReset}>
        <input
          id="email-address" name="email" type="email" autoComplete="email" required
          className="appearance-none relative block w-full px-3 py-3 bg-white/5 border border-white/20 placeholder-gray-400 text-white rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text/sm"
          placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit" disabled={isFormDisabled} className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:bg-orange-800 disabled:cursor-not-allowed transition">
          {loading ? 'Enviando...' : 'Enviar Link de Redefinição'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-gray-400">
        Lembrou a senha?{' '}
        <button onClick={() => { setView('login'); setLocalError(null); setSuccessMessage(null); setError(null); }} className="font-medium text-orange-400 hover:text-orange-300">
          Voltar para o Login
        </button>
      </p>
    </>
  );

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl bg-gray-900/30 backdrop-blur-2xl border border-white/10 shadow-2xl">
        {view === 'login' ? renderLoginView() : renderForgotPasswordView()}
        {localError && <p className="mt-4 text-sm text-red-400 text-center">{localError}</p>}
        {successMessage && <p className="mt-4 text-sm text-green-400 text-center">{successMessage}</p>}
      </div>
    </div>
  );
};

export default LoginPage;