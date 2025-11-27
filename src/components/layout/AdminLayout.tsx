import React, { useEffect, useState, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminNavbar from './AdminNavbar';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { socket } from '@/utils/socket';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ServiceRequestModal = () => {
  const [open, setOpen] = useState(false);
  const [request, setRequest] = useState<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize audio
    audioRef.current = new Audio('/sounds/bell.mp3'); // You'll need to add this sound file

    const handleServiceRequest = (data: any) => {
      console.log('Service request received:', data);
      setRequest(data);
      setOpen(true);

      // Play sound
      if (audioRef.current) {
        audioRef.current.play().catch(e => console.error('Error playing sound:', e));
      }

      // Also show toast
      toast.info(`Table ${data.tableNumber}: ${data.requestType}`, {
        duration: 5000,
        action: {
          label: 'Acknowledge',
          onClick: () => setOpen(false)
        }
      });
    };

    socket.on('admin:service_request', handleServiceRequest);

    return () => {
      socket.off('admin:service_request', handleServiceRequest);
    };
  }, []);

  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md border-l-4 border-l-primary animate-in fade-in zoom-in duration-300">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Bell className="h-8 w-8 text-primary animate-bounce" />
            Service Request!
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center py-6 space-y-4">
          <div className="text-center">
            <h3 className="text-4xl font-bold mb-2">Table {request.tableNumber}</h3>
            <p className="text-xl text-muted-foreground">is requesting</p>
            <h2 className="text-3xl font-bold text-primary mt-2">{request.requestType}</h2>
          </div>

          <div className="flex gap-4 w-full mt-6">
            <Button
              size="lg"
              className="w-full text-lg"
              onClick={() => setOpen(false)}
            >
              Acknowledge
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

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
        <ServiceRequestModal />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
