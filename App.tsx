import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
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
      <div className="min-h-screen text-white font-sans">
        <Router />
      </div>
    </AuthProvider>
  );
};

const Router: React.FC = () => {
  const { user, isPasswordRecovery } = useAuth();

  if (isPasswordRecovery) {
    return (
      <ReactRouterDOM.HashRouter>
        <ReactRouterDOM.Routes>
          <ReactRouterDOM.Route path="*" element={<UpdatePasswordPage />} />
        </ReactRouterDOM.Routes>
      </ReactRouterDOM.HashRouter>
    );
  }

  return (
    <ReactRouterDOM.HashRouter>
      <ReactRouterDOM.Routes>
        <ReactRouterDOM.Route path="/login" element={!user ? <LoginPage /> : <ReactRouterDOM.Navigate to="/" />} />
        <ReactRouterDOM.Route path="/register" element={!user ? <RegisterPage /> : <ReactRouterDOM.Navigate to="/" />} />
        <ReactRouterDOM.Route 
          path="/*"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <DashboardRoutes />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
      </ReactRouterDOM.Routes>
    </ReactRouterDOM.HashRouter>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <ReactRouterDOM.Navigate to="/login" />;
  }
  return <>{children}</>;
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
        return <ReactRouterDOM.Navigate to="/login" />;
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