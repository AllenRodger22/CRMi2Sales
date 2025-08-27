
import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../auth';
import { GoogleIcon } from '../components/Icons';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [view, setView] = useState<'login' | 'forgot_password'>('login');
  const [loading, setLoading] = useState(false);
  
  const { loginWithGoogle, sendPasswordResetEmail, loading: authLoading } = useAuth();
  
  useEffect(() => {
    // Redirect if user is already logged in
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        window.location.hash = '#/dashboard';
      }
    });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMessage(null);
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    setLoading(false);
    if (error) {
        if (error.message === 'Invalid login credentials') {
          setLocalError('Email ou senha inválidos. Por favor, verifique e tente novamente.');
        } else if (error.message === 'Email not confirmed') {
            setLocalError('Por favor, confirme seu email antes de fazer o login.');
        } else {
            setLocalError(error.message || 'Ocorreu um erro inesperado.');
        }
    }
    // onAuthStateChange in AuthProvider will handle successful redirect.
  };
  
  const handleGoogleLogin = async () => {
    setLocalError(null);
    setSuccessMessage(null);
    try {
        await loginWithGoogle();
    } catch (err: any) {
        setLocalError(err.message || 'Falha ao logar com o Google.');
    }
  };
  
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMessage(null);
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

  const isFormDisabled = loading || authLoading;

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
          <button type="button" onClick={() => { setView('forgot_password'); setLocalError(null); setSuccessMessage(null); }} className="font-medium text-orange-400 hover:text-orange-300">
            Esqueceu a senha?
          </button>
        </div>
        <button type="submit" disabled={isFormDisabled} className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:bg-orange-800 disabled:cursor-not-allowed transition">
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/20"></div></div>
        <div className="relative flex justify-center text-sm"><span className="px-2 bg-gray-900/80 text-gray-400">OU</span></div>
      </div>
      <button onClick={handleGoogleLogin} disabled={isFormDisabled} className="group relative w-full flex items-center justify-center gap-2 py-3 px-4 border border-white/20 text-sm font-medium rounded-md text-white bg-white/5 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 transition">
        <GoogleIcon className="w-5 h-5" /> Entrar com Google
      </button>
      <p className="mt-6 text-center text-sm text-gray-400">
        Não tem uma conta?{' '}
        <ReactRouterDOM.Link to="/register" className="font-medium text-orange-400 hover:text-orange-300">
          Registre-se
        </ReactRouterDOM.Link>
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
        <button type="submit" disabled={authLoading || !!successMessage} className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:bg-orange-800 disabled:cursor-not-allowed transition">
          {authLoading ? 'Enviando...' : 'Enviar Link de Redefinição'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-gray-400">
        Lembrou a senha?{' '}
        <button onClick={() => { setView('login'); setLocalError(null); setSuccessMessage(null); }} className="font-medium text-orange-400 hover:text-orange-300">
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