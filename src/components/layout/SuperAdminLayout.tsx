import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import SuperAdminSidebar from './SuperAdminSidebar';
import SuperAdminNavbar from './SuperAdminNavbar';

interface SuperAdminLayoutProps {
  children?: React.ReactNode;
}

export default function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);


  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Check if super admin is logged in
  const superAdminToken = localStorage.getItem('superAdminToken');
  if (!superAdminToken) {
    return <Navigate to="/super-admin/login" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <SuperAdminSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <SuperAdminNavbar onMenuToggle={toggleSidebar} />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}
