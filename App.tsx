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
import CompleteProfileModal from './components/CompleteProfileModal';

const App: React.FC = () => {
  return (
    <ReactRouterDOM.HashRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ReactRouterDOM.HashRouter>
  );
};

const AppContent: React.FC = () => {
    const { user, isPasswordRecovery, isProfileSetupRequired } = useAuth();
    
    return (
        <div className="min-h-screen text-white font-sans">
            <ReactRouterDOM.Routes>
              { isPasswordRecovery ? (
                  <ReactRouterDOM.Route path="*" element={<UpdatePasswordPage />} />
              ) : (
                <>
                  {/* Public routes for logged-out users */}
                  <ReactRouterDOM.Route 
                    path="/login" 
                    element={!user ? <LoginPage /> : <ReactRouterDOM.Navigate to="/" replace />} 
                  />
                  <ReactRouterDOM.Route 
                    path="/register" 
                    element={!user ? <RegisterPage /> : <ReactRouterDOM.Navigate to="/" replace />} 
                  />

                  {/* Protected routes for logged-in users */}
                  <ReactRouterDOM.Route 
                    path="/*"
                    element={
                      user ? (
                        <DashboardLayout>
                          <DashboardRoutes />
                        </DashboardLayout>
                      ) : (
                        <ReactRouterDOM.Navigate to="/login" replace />
                      )
                    } 
                  />
                </>
              )}
            </ReactRouterDOM.Routes>
            {isProfileSetupRequired && <CompleteProfileModal />}
        </div>
    );
};


const DashboardRoutes: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null; // Should not be reached with the new routing, but safe to keep

  const getDashboardForRole = () => {
    switch (user.role) {
      case Role.BROKER:
        return <BrokerDashboard />;
      case Role.MANAGER:
        return <ManagerDashboard />;
      case Role.ADMIN:
        return <AdminDashboard />;
      default:
        // This case should ideally not be hit if roles are managed properly.
        // Redirecting to login is a safe fallback.
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
