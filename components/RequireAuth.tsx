import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  // If the authentication state is still being determined, don't render anything.
  // The parent AppContent component will show a global loading indicator.
  if (loading) {
    return null;
  }
  
  // After loading, if there's no user, redirect to login.
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // If loading is finished and there is a user, render the children.
  return <>{children}</>;
};
