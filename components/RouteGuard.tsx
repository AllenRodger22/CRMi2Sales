import React from 'react';
import { useAuth } from '../auth';
import { useNavigate } from 'react-router-dom';

const RouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (state === 'guest') {
      navigate('/login', { replace: true });
    }
  }, [state, navigate]);

  if (state === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-white text-lg">Carregando sessão...</p>
      </div>
    );
  }

  return state === 'authed' ? <>{children}</> : null;
};

export default RouteGuard;