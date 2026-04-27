import { io } from 'socket.io-client';

// Create a single shared socket instance for the entire app
const socket = io('http://localhost:5000', {
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5
});

export default socket;
