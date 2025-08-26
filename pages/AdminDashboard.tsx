
import React from 'react';
import ManagerDashboard from './ManagerDashboard';

const AdminDashboard: React.FC = () => {
    // Admin has the same view as the manager, but ClientTable will show extra buttons based on role.
    return <ManagerDashboard />;
};

export default AdminDashboard;
