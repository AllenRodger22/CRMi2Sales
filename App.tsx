
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
  const { session, user, isPasswordRecovery } = useAuth();

  // The global loader is removed from here as RequireAuth handles it for protected routes.
  // We need a check for the password recovery flow before any other rendering.
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
        <ReactRouterDOM.Route path="/login" element={!session ? <LoginPage /> : <ReactRouterDOM.Navigate to="/dashboard" replace />} />
        <ReactRouterDOM.Route path="/register" element={!session ? <RegisterPage /> : <ReactRouterDOM.Navigate to="/dashboard" replace />} />
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
        <ReactRouterDOM.Route path="/" element={<ReactRouterDOM.Navigate to={session ? "/dashboard" : "/login"} replace />} />
        <ReactRouterDOM.Route path="*" element={<ReactRouterDOM.Navigate to="/" replace />} />
      </ReactRouterDOM.Routes>
    </div>
  );
};

const DashboardRoutes: React.FC = () => {
  const { user } = useAuth();

  // If RequireAuth has passed, we have a session.
  // If user is null here, it means the profile fetch is either in progress or has failed.
  if (!user) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-yellow-400">Carregando Perfil...</h2>
        <p className="mt-2 text-gray-300">
          Aguarde um momento. Se esta mensagem persistir, pode ter ocorrido um erro.
          Nesse caso, por favor, <a href="#" onClick={(e) => { e.preventDefault(); window.location.reload(); }} className="text-orange-400 hover:underline">recarregue a página</a>.
        </p>
      </div>
    );
  }

  const getDashboardForRole = () => {
    switch (user.role) {
      case Role.BROKER:
        return <BrokerDashboard />;
      case Role.MANAGER:
        return <ManagerDashboard />;
      case Role.ADMIN:
        return <AdminDashboard />;
      default:
        // FIX: Added a fallback UI for unknown roles.
        return (
            <div className="p-8 text-center">
              <h2 className="text-xl font-bold text-red-400">Papel de Usuário Desconhecido</h2>
              <p className="mt-2 text-gray-300">
                Não foi possível determinar sua página inicial. Por favor, entre em contato com o suporte.
              </p>
            </div>
        );
    }
  };

  return (
      <ReactRouterDOM.Routes>
          <ReactRouterDOM.Route path="/" element={getDashboardForRole()} />
          <ReactRouterDOM.Route path="client/:clientId" element={<ClientDetail />} />
      </ReactRouterDOM.Routes>
  );
};

// FIX: Added default export to resolve module loading error.
export default App;
