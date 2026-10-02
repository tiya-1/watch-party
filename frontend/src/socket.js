import { io } from 'socket.io-client';

// Backend URL: set VITE_SERVER_URL on Vercel (your Render URL). Falls back to local server.
const URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
const socket = io(URL);
export default socket;
