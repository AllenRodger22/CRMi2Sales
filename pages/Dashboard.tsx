
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Role } from '../types';

import DashboardLayout from '../layouts/DashboardLayout';
import BrokerDashboard from './BrokerDashboard';
import ManagerDashboard from './ManagerDashboard';
import AdminDashboard from './AdminDashboard';
import ClientDetail from './ClientDetail';

const DashboardRedirector: React.FC = () => {
  const { user } = useAuth();
  
  if (!user) {
       return (
          <div className="p-8 text-center text-white">Carregando Perfil...</div>
      );
  }
  
  const targetPath = user.role === Role.BROKER ? '/dashboard/broker'
                   : user.role === Role.MANAGER ? '/dashboard/manager'
                   : user.role === Role.ADMIN ? '/dashboard/admin'
                   : '/login';

  return <Navigate to={targetPath} replace />;
};

const ProtectedRoute: React.FC<{ allowedRoles: Role[]; children: React.ReactNode }> = ({ allowedRoles, children }) => {
    const { user } = useAuth();

    if (!user) {
        return <div className="p-8 text-center text-yellow-400">Verificando permissões...</div>;
    }
  
    if (!allowedRoles.includes(user.role)) {
      return <Navigate to="/dashboard" replace />;
    }
    
    return <>{children}</>;
};

const Dashboard: React.FC = () => {
  return (
    <DashboardLayout>
      <Routes>
        <Route index element={<DashboardRedirector />} />
        <Route 
            path="broker" 
            element={<ProtectedRoute allowedRoles={[Role.BROKER]}><BrokerDashboard /></ProtectedRoute>} 
        />
        <Route 
            path="manager" 
            element={<ProtectedRoute allowedRoles={[Role.MANAGER, Role.ADMIN]}><ManagerDashboard /></ProtectedRoute>} 
        />
        <Route 
            path="admin" 
            element={<ProtectedRoute allowedRoles={[Role.ADMIN]}><AdminDashboard /></ProtectedRoute>} 
        />
        <Route path="client/:clientId" element={<ClientDetail />} />
        <Route 
            path="*" 
            element={<div className="p-8 text-center text-red-400">Página Não Encontrada</div>} 
        />
      </Routes>
    </DashboardLayout>
  );
};

export default Dashboard;