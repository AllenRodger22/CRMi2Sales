import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register'; // Import the new Register page
import DashboardLayout from './layouts/DashboardLayout';
import BrokerDashboard from './pages/BrokerDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ClientDetail from './pages/ClientDetail';
import { Role } from './types';

const BackgroundManager = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  useEffect(() => {
    const bgElement = document.getElementById('auth-background');
    if (bgElement) {
      if (isAuthPage) {
        bgElement.classList.add('visible');
      } else {
        bgElement.classList.remove('visible');
      }
    }
  }, [isAuthPage]);

  return null; // This component does not render anything
};


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
  const { user } = useAuth();

  return (
    <HashRouter>
      <BackgroundManager />
      <Routes>
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/" />} />
        <Route 
          path="/*"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <DashboardRoutes />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
      </Routes>
    </HashRouter>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" />;
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
        return <Navigate to="/login" />;
    }
  };

  return (
    <Routes>
      <Route index element={getDashboardForRole()} />
      <Route path="client/:clientId" element={<ClientDetail />} />
    </Routes>
  );
};


export default App;