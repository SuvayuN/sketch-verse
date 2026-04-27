import { io } from 'socket.io-client';

// Create a single shared socket instance for the entire app
const socket = io(`${process.env.REACT_APP_SOCKET_URL}`, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5
});

export default socket;
