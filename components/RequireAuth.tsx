import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) {
      navigate('/login', { replace: true });
    }
  }, [loading, session, navigate]);

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <p className="text-white text-lg">Verificando sessão...</p>
        </div>
    );
  }
  
  return session ? <>{children}</> : null;
};
