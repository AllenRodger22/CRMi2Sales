import { useEffect } from 'react';
import { useAuth } from '../auth';

export default function RouteGuard({ children }: { children: JSX.Element }) {
  const { state } = useAuth();

  useEffect(() => {
    if (state === 'guest') window.location.hash = '#/login';
  }, [state]);

  if (state === 'loading') return <div>Carregando sessão…</div>;
  if (state === 'guest') return null;
  return children;
}
