import { io, Socket } from 'socket.io-client';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

let socket: Socket | null = null;

export function getSocket(): Socket {
    if (!socket) {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        socket = io(BACKEND_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
            autoConnect: true,
        });

        socket.on('connect', () => {
            console.log('[SOCKET] Connected:', socket?.id);
        });

        socket.on('connect_error', (err) => {
            console.warn('[SOCKET] Connection error:', err.message);
        });
    }
    return socket;
}

export function disconnectSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}
