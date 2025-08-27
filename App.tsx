
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
import RouteGuard from './components/RouteGuard';
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import UpdatePasswordPage from './pages/UpdatePassword';

function AppRoutes() {
  const { state, isPasswordRecovery } = useAuth();
  
  if (isPasswordRecovery) {
    return <Routes><Route path="*" element={<UpdatePasswordPage />} /></Routes>;
  }

  return (
    <div className="min-h-screen text-white font-sans">
      <Routes>
        <Route path="/login" element={state !== 'authed' ? <LoginPage /> : <Navigate to="/dashboard" replace />} />
        <Route path="/register" element={state !== 'authed' ? <RegisterPage /> : <Navigate to="/dashboard" replace />} />
        <Route
          path="/dashboard/*"
          element={
            <RouteGuard>
              <Dashboard />
            </RouteGuard>
          }
        />
        <Route path="/" element={<Navigate to={state === 'authed' ? "/dashboard" : "/login"} replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </HashRouter>
  );
}
