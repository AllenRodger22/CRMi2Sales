
import React, { useEffect } from 'react';
import { useAuth } from '../auth';

export default function RouteGuard({ children }: { children: JSX.Element }) {
  const { state } = useAuth();

  useEffect(() => {
    // Only redirect when we are certain the user is a guest.
    // This prevents redirection while the session is still being loaded.
    if (state === 'guest') {
      window.location.hash = '#/login';
    }
  }, [state]);

  // Do not render anything until the user is authenticated.
  if (state !== 'authed') {
    return null;
  }
  
  return children;
}
