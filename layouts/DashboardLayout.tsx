import React, { ReactNode } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  // Sidebar state and toggle logic have been removed.
  // The Sidebar component itself now renders null.
  return (
    <div className="flex h-screen dashboard-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main id="main-content" className="flex-1 overflow-x-hidden overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;