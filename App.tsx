
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
  const navigate = ReactRouterDOM.useNavigate();
  const location = ReactRouterDOM.useLocation();

  // Redirect from `/dashboard` root to the user's role-specific dashboard page.
  React.useEffect(() => {
    if (user && (location.pathname === '/dashboard' || location.pathname === '/dashboard/')) {
      let targetPath: string;
      switch (user.role) {
        case Role.BROKER:
          targetPath = '/dashboard/broker';
          break;
        case Role.MANAGER:
          targetPath = '/dashboard/manager';
          break;
        case Role.ADMIN:
          targetPath = '/dashboard/admin';
          break;
        default:
          // Fallback for unknown roles, redirect to login
          targetPath = '/';
          break;
      }
      navigate(targetPath, { replace: true });
    }
  }, [user, location.pathname, navigate]);

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

  // A simple component to protect routes. If the user's role is not in the allowed list,
  // it redirects them to their main dashboard page (which will then redirect correctly).
  const ProtectedRoute: React.FC<{ allowedRoles: Role[]; children: React.ReactNode }> = ({ allowedRoles, children }) => {
    if (!allowedRoles.includes(user.role)) {
      return <ReactRouterDOM.Navigate to="/dashboard" replace />;
    }
    return <>{children}</>;
  };
  
  return (
      <ReactRouterDOM.Routes>
          <ReactRouterDOM.Route 
            path="broker" 
            element={
              <ProtectedRoute allowedRoles={[Role.BROKER]}>
                <BrokerDashboard />
              </ProtectedRoute>
            } 
          />
          <ReactRouterDOM.Route 
            path="manager" 
            element={
              <ProtectedRoute allowedRoles={[Role.MANAGER, Role.ADMIN]}>
                <ManagerDashboard />
              </ProtectedRoute>
            } 
          />
           <ReactRouterDOM.Route 
            path="admin" 
            element={
              <ProtectedRoute allowedRoles={[Role.ADMIN]}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />

          <ReactRouterDOM.Route path="client/:clientId" element={<ClientDetail />} />

          {/* This route handles the base /dashboard path, showing a loading message while redirecting. */}
          <ReactRouterDOM.Route path="/" element={<div className="p-8 text-center">Redirecionando...</div>} />

          {/* A fallback for any unknown paths under /dashboard/* to prevent blank pages. */}
          <ReactRouterDOM.Route 
            path="*" 
            element={
              <div className="p-8 text-center">
                <h2 className="text-xl font-bold text-red-400">Página Não Encontrada</h2>
                <p className="mt-2 text-gray-300">
                  A página que você está procurando não existe.
                </p>
              </div>
            } 
          />
      </ReactRouterDOM.Routes>
  );
};

export default App;
