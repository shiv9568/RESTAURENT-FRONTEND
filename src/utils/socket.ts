import { io } from 'socket.io-client';

const URL = import.meta.env.VITE_API_URL || 'https://restaurent-server-cgxr.onrender.com/api';

// Remove /api from the end if present, as socket.io connects to root
const socketUrl = URL.endsWith('/api') ? URL.slice(0, -4) : URL;

export const socket = io(socketUrl, {
    autoConnect: true,
    withCredentials: true,
    transports: ['websocket', 'polling'],
});

export const initSocket = () => {
    if (!socket.connected) {
        socket.connect();
    }

    socket.on('connect', () => {
        console.log('Socket connected:', socket.id);
    });

    socket.on('disconnect', () => {
        console.log('Socket disconnected');
    });

    return socket;
};
