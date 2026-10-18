import express from 'express';
import { getChatHistory } from '../controllers/roomController.js';

const router = express.Router();

router.get('/rooms/:roomId/messages', getChatHistory);

export default router;