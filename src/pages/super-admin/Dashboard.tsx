import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Activity,
  AlertCircle,
  Bell,
  Building,
  Coffee,
  Users,
  Info,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { socket } from '@/utils/socket';

interface Stats {
  restaurants: { total: number; growth: number };
  foodItems: { total: number; growth: number };
  users: { total: number; growth: number };
}

interface ActivityItem {
  type: 'restaurant' | 'food' | 'user';
  message: string;
  time: string;
}

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  createdAt: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, activitiesRes, notificationsRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/super-admin/stats`),
          fetch(`${import.meta.env.VITE_API_URL}/super-admin/activities`),
          fetch(`${import.meta.env.VITE_API_URL}/super-admin/notifications`)
        ]);

        if (statsRes.ok) setStats(await statsRes.json());
        if (activitiesRes.ok) setActivities(await activitiesRes.json());
        if (notificationsRes.ok) setNotifications(await notificationsRes.json());
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Socket listener for new notifications
    const handleNewNotification = (notification: NotificationItem) => {
      setNotifications(prev => [notification, ...prev].slice(0, 5));

      // Play sound
      const audio = new Audio('/notification.mp3'); // Assuming file is in public folder
      audio.play().catch(e => console.error('Error playing sound:', e));
    };

    socket.on('system_notification', handleNewNotification);

    return () => {
      socket.off('system_notification', handleNewNotification);
    };
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />;
      case 'error': return <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />;
      case 'success': return <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />;
      default: return <Bell className="h-5 w-5 text-blue-600 mt-0.5" />;
    }
  };

  const getNotificationStyles = (type: string) => {
    switch (type) {
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error': return 'bg-red-50 border-red-200 text-red-800';
      case 'success': return 'bg-green-50 border-green-200 text-green-800';
      default: return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  if (loading) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Super Admin Dashboard
        </h1>
        <p className="text-sm text-gray-500">Welcome, Super Administrator</p>
      </div>

      {/* --- Stats Cards --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Restaurants
            </CardTitle>
            <Building className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.restaurants.total || 0}</div>
            <p className="text-xs text-gray-500 mt-1">+{stats?.restaurants.growth || 0} this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Food Items</CardTitle>
            <Coffee className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.foodItems.total || 0}</div>
            <p className="text-xs text-gray-500 mt-1">+{stats?.foodItems.growth || 0} this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.users.total || 0}</div>
            <p className="text-xs text-gray-500 mt-1">+{stats?.users.growth || 0} this month</p>
          </CardContent>
        </Card>
      </div>

      {/* --- System Status + Activities --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>
              Current system performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                'API Server',
                'Database',
                'Payment Gateway',
                'Authentication Service',
              ].map((service) => (
                <div
                  key={service}
                  className="flex justify-between items-center"
                >
                  <span className="text-sm font-medium">{service}</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Operational
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>Latest system activities</CardDescription>
            </div>
            <Activity className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.length > 0 ? (
                activities.map((activity, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className={`rounded-full p-1 ${activity.type === 'restaurant' ? 'bg-blue-100' :
                      activity.type === 'food' ? 'bg-amber-100' : 'bg-green-100'
                      }`}>
                      {activity.type === 'restaurant' && <Building className="h-3 w-3 text-blue-600" />}
                      {activity.type === 'food' && <Coffee className="h-3 w-3 text-amber-600" />}
                      {activity.type === 'user' && <Users className="h-3 w-3 text-green-600" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{activity.message}</p>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(activity.time), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500">No recent activities</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- System Notifications --- */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>System Notifications</CardTitle>
            <CardDescription>Important system alerts</CardDescription>
          </div>
          <Bell className="h-4 w-4 text-gray-500" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-4 border rounded-lg ${getNotificationStyles(notification.type)}`}
                >
                  <div className="flex items-start gap-4">
                    {getNotificationIcon(notification.type)}
                    <div>
                      <p className="font-medium">
                        {notification.title}
                      </p>
                      <p className="text-sm mt-1 opacity-90">
                        {notification.message}
                      </p>
                      <p className="text-xs mt-2 opacity-75">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-4">
                No active notifications
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

