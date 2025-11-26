import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from '@react-oauth/google';
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import AdminLayout from "./components/layout/AdminLayout";
import SuperAdminLayout from "./components/layout/SuperAdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import MenuManagement from "./pages/admin/MenuManagement";
import FoodManagement from "./pages/admin/FoodManagement";
import OrdersManagement from "./pages/admin/OrdersManagement";
import OffersManagement from "./pages/admin/OffersManagement";
import DeliveryZonesManagement from "./pages/admin/DeliveryZonesManagement";
import Settings from "./pages/admin/Settings";
import TableManagement from "./pages/admin/TableManagement";
import SalesReports from "./pages/admin/SalesReports";
import AdminLogin from "./pages/admin/AdminLogin";
import SuperAdminDashboard from "./pages/super-admin/SuperAdminDashboard";
import NotFound from "./pages/NotFound";
import UserHome from "./pages/UserHome";
import MyOrders from "./pages/MyOrders";
import Payment from "./pages/Payment";
import Invoice from "./pages/Invoice";
import Cart from "./pages/Cart";
import OrderTracking from "./pages/OrderTracking";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import RestaurantDetails from "./pages/RestaurantDetails";
import GroupOrderPage from "./pages/GroupOrder";
import ForgotPassword from "./pages/ForgotPassword";
import SecretSetup from "./pages/admin/SecretSetup";
import { useEffect } from "react";
import { initSocket, socket } from "@/utils/socket";
import { NotificationListener } from "@/components/NotificationListener";
import ChatWidget from "@/components/ChatWidget";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const initPushNotifications = async () => {
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("Push notifications not supported");
    return;
  }
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    console.warn("Notification permission denied");
    return;
  }
  try {
    await navigator.serviceWorker.register("/service-worker.js");
    // console.log("Service worker registered for push notifications");
  } catch (err) {
    console.error("Service worker registration failed", err);
  }
};

const queryClient = new QueryClient();

export default function App() {
  useEffect(() => {
    initPushNotifications();

    // Initialize socket connection
    initSocket();

    // Check for table parameter and notify admin
    const searchParams = new URLSearchParams(window.location.search);
    const tableNumber = searchParams.get('table');
    if (tableNumber) {
      // Wait for socket to be ready
      const checkSocket = setInterval(() => {
        if (socket.connected) {
          socket.emit('table_connected', tableNumber);
          clearInterval(checkSocket);
        }
      }, 500);

      // Cleanup interval after 10 seconds to prevent infinite checking
      setTimeout(() => clearInterval(checkSocket), 10000);
    }

    // Listen for global updates
    const handleOrderUpdate = (data: any) => {
      // console.log('Socket event received:', data);
      // Dispatch custom event for components to listen to
      window.dispatchEvent(new CustomEvent('adminDataChanged', {
        detail: { type: 'orders', ...data }
      }));
      // Also dispatch a specific event for Cart/User side if needed
      if (data.action === 'update' || data.action === 'create') {
        window.dispatchEvent(new Event('orderUpdated'));
      }
    };

    socket.on('orders:update', handleOrderUpdate);

    return () => {
      socket.off('orders:update', handleOrderUpdate);
    };
  }, []);

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <NotificationListener />
            <Routes>
              {/* Super Admin */}
              <Route
                path="/super-admin/*"
                element={
                  <SuperAdminLayout>
                    <SuperAdminDashboard />
                  </SuperAdminLayout>
                }
              />
              {/* Admin */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/*" element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="menu" element={<MenuManagement />} />
                <Route path="food" element={<FoodManagement />} />
                <Route path="orders" element={<OrdersManagement />} />
                <Route path="sales-reports" element={<SalesReports />} />
                <Route path="offers" element={<OffersManagement />} />
                <Route path="delivery-zones" element={<DeliveryZonesManagement />} />
                <Route path="tables" element={<TableManagement />} />
                <Route path="settings" element={<Settings />} />
              </Route>
              {/* User */}
              <Route
                path="/*"
                element={
                  <div className="flex flex-col min-h-screen">
                    <Navbar />
                    <main className="flex-1">
                      <Routes>
                        <Route path="/" element={<UserHome />} />
                        <Route path="/cart" element={<Cart />} />
                        <Route path="/payment" element={<Payment />} />
                        <Route path="/order-tracking/:orderId" element={<OrderTracking />} />
                        <Route path="/invoice/:orderId" element={<Invoice />} />
                        <Route path="/my-orders" element={<MyOrders />} />
                        <Route path="/auth" element={<Auth />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/secret-admin-setup" element={<SecretSetup />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/restaurant/:id" element={<RestaurantDetails />} />
                        <Route path="/group-order/:groupId?" element={<GroupOrderPage />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </main>
                    {/* <Footer /> */}
                    
                  </div>
                }
              />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}
