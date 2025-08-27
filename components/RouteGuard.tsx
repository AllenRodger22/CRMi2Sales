
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

export default function RouteGuard({ children }: { children: JSX.Element }) {
  const { state } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (state === 'guest') {
      navigate('/login', { replace: true });
    }
  }, [state, navigate]);

  if (state !== 'authed') {
    // Return null while the redirect is happening or if the state is not authenticated.
    return null;
  }

  return children;
}
