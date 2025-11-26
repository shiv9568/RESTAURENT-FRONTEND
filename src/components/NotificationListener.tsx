import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const SOCKET_URL = import.meta.env.VITE_API_URL
    ? (import.meta.env.VITE_API_URL.endsWith('/api')
        ? import.meta.env.VITE_API_URL.slice(0, -4)
        : import.meta.env.VITE_API_URL)
    : 'https://restaurent-server-cgxr.onrender.com';

export function NotificationListener() {
    const navigate = useNavigate();

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (!userStr) return;

        const user = JSON.parse(userStr);
        const socket = io(SOCKET_URL);

        socket.on('connect', () => {
            // console.log('Connected to socket server for notifications');
        });

        socket.on('orders:update', (data: any) => {
            if (data.action === 'update' && data.order) {
                // Check if the order belongs to the current user
                // Note: data.order.userId might be populated or just an ID string
                const orderUserId = typeof data.order.userId === 'object'
                    ? data.order.userId._id
                    : data.order.userId;

                if (orderUserId === user.id || orderUserId === user._id) {
                    toast.info(`Order #${data.order.orderNumber} is now ${data.order.status}`, {
                        duration: 5000,
                        action: {
                            label: 'View',
                            onClick: () => navigate(`/order-tracking/${data.order._id}`)
                        }
                    });
                }
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [navigate]);

    return null; // This component doesn't render anything
}
