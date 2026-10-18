import { io } from 'socket.io-client';

let userId = localStorage.getItem('syncroom_user_id');
if (!userId) {
  userId = 'usr_' + Math.random().toString(36).substring(2, 10);
  localStorage.setItem('syncroom_user_id', userId);
}

const URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

export const socket = io(URL, {
  autoConnect: true,
  transports: ['polling', 'websocket'], // Polling pehle rakhne se connection drop nahi hota
  query: { userId }
});