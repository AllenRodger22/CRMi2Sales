import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import { useAuthBoot } from './auth/useAuthBoot';
import { RequireAuth } from './components/RequireAuth';

import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import DashboardLayout from './layouts/DashboardLayout';
import BrokerDashboard from './pages/BrokerDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ClientDetail from './pages/ClientDetail';
import { Role } from './types';
import UpdatePasswordPage from './pages/UpdatePassword';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ReactRouterDOM.HashRouter>
        <AppContent />
      </ReactRouterDOM.HashRouter>
    </AuthProvider>
  );
};

const AppContent: React.FC = () => {
  useAuthBoot();
  const { user, loading, isPasswordRecovery } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-white text-lg">Verificando sessão...</p>
      </div>
    );
  }

  if (isPasswordRecovery) {
    return (
      <ReactRouterDOM.Routes>
        <ReactRouterDOM.Route path="*" element={<UpdatePasswordPage />} />
      </ReactRouterDOM.Routes>
    );
  }

  return (
    <div className="min-h-screen text-white font-sans">
      <ReactRouterDOM.Routes>
        <ReactRouterDOM.Route path="/login" element={!user ? <LoginPage /> : <ReactRouterDOM.Navigate to="/dashboard" replace />} />
        <ReactRouterDOM.Route path="/register" element={!user ? <RegisterPage /> : <ReactRouterDOM.Navigate to="/dashboard" replace />} />
        <ReactRouterDOM.Route 
          path="/dashboard/*"
          element={
            <RequireAuth>
              <DashboardLayout>
                <DashboardRoutes />
              </DashboardLayout>
            </RequireAuth>
          } 
        />
        <ReactRouterDOM.Route path="/" element={<ReactRouterDOM.Navigate to={user ? "/dashboard" : "/login"} replace />} />
        <ReactRouterDOM.Route path="*" element={<ReactRouterDOM.Navigate to="/" replace />} />
      </ReactRouterDOM.Routes>
    </div>
  );
};

const DashboardRoutes: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  const getDashboardForRole = () => {
    switch (user.role) {
      case Role.BROKER:
        return <BrokerDashboard />;
      case Role.MANAGER:
        return <ManagerDashboard />;
      case Role.ADMIN:
        return <AdminDashboard />;
      default:
        // This case should ideally not be reached if auth flow is correct
        return <ReactRouterDOM.Navigate to="/login" replace />;
    }
  };

  return (
    <ReactRouterDOM.Routes>
      <ReactRouterDOM.Route index element={getDashboardForRole()} />
      <ReactRouterDOM.Route path="client/:clientId" element={<ClientDetail />} />
    </ReactRouterDOM.Routes>
  );
};

export default App;
