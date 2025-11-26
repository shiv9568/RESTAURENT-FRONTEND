import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminNavbar from './AdminNavbar';
import { toast } from 'sonner';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  useEffect(() => {
    // Check for admin token and user
    const adminToken = localStorage.getItem('adminToken') || localStorage.getItem('token');
    const adminUser = localStorage.getItem('adminUser');

    if (!adminToken) {
      navigate('/admin/login');
      return;
    }

    // Verify admin user exists and has admin role
    if (adminUser) {
      try {
        const user = JSON.parse(adminUser);
        if (user.role === 'admin' || user.role === 'super-admin') {
          setIsAuthenticated(true);
          return;
        }
      } catch (error) {
        // Invalid user data
      }
    }

    // If we reach here, authentication failed
    localStorage.removeItem('adminToken');
    localStorage.removeItem('token');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  }, [navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Listen for table connections
    const handleTableConnected = (data: { tableNumber: string, timestamp: string }) => {
      toast.info(`Table ${data.tableNumber} Connected`, {
        description: `A customer has scanned the QR code for Table ${data.tableNumber}`,
        duration: 5000,
        action: {
          label: 'View',
          onClick: () => navigate('/admin/tables')
        }
      });

      // Play a notification sound if desired
      try {
        const audio = new Audio('/notification.mp3'); // Ensure this file exists or use a default browser sound if possible (browsers block auto-play usually)
        audio.play().catch(e => console.log('Audio play failed', e));
      } catch (e) {
        // Ignore audio errors
      }
    };

    import('@/utils/socket').then(({ socket }) => {
      socket.on('admin:table_connected', handleTableConnected);
    });

    return () => {
      import('@/utils/socket').then(({ socket }) => {
        socket.off('admin:table_connected', handleTableConnected);
      });
    };
  }, [isAuthenticated, navigate]);

  // Show nothing while checking authentication
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

      <div className="flex flex-1 flex-col overflow-hidden lg:ml-64">
        <AdminNavbar onMenuToggle={toggleSidebar} />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
