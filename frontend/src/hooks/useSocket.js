import { io } from 'socket.io-client';

let socketInstance = null;

export default function useSocket() {
    if (!socketInstance) {
        socketInstance = io(window.location.origin, {
            path: '/api/socket.io',
        });
    }
    return socketInstance;
}
