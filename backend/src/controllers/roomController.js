import { Message } from '../models/Message.js';

export const getChatHistory = async (req, res) => {
  try {
    const { roomId } = req.params;
    const messages = await Message.find({ roomId }).sort({ createdAt: -1 }).limit(50);
    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
};