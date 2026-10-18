import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import { setupSocketHandlers } from './sockets/socketServer.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.io CORS setup with universal allow for production
const io = new Server(server, {
  cors: {
    origin: '*',
    credentials: true
  }
});

// Express CORS setup
app.use(cors({ 
  origin: '*', 
  credentials: true 
}));

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Setup Socket.IO handlers
setupSocketHandlers(io);

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/syncroom')
  .then(() => {
    console.log('Connected to MongoDB Atlas');
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error('MongoDB connection error:', err));