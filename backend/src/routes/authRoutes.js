import express from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Room } from '../models/Room.js';
import { registerSchema, loginSchema } from '../validators/authValidator.js';

const router = express.Router();

const generateTokens = (user) => {
  const accessToken = jwt.sign({ userId: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

router.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const existing = await User.findOne({ email: data.email });
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const user = await User.create(data);
    const { accessToken, refreshToken } = generateTokens(user);

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.status(201).json({ ok: true, accessToken, user: { id: user._id, username: user.username, email: user.email, avatar: user.avatar } });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await User.findOne({ email: data.email }).select('+password');
    if (!user || !(await user.comparePassword(data.password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const { accessToken, refreshToken } = generateTokens(user);
    user.refreshToken = refreshToken;
    await user.save();

    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ ok: true, accessToken, user: { id: user._id, username: user.username, email: user.email, avatar: user.avatar } });
  } catch (err) {
    next(err);
  }
});

// My Rooms Dashboard Endpoint
router.get('/my-rooms', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const rooms = await Room.find({ $or: [{ hostId: decoded.userId }, { [`roles.${decoded.userId}`]: { $exists: true } }] })
      .sort({ lastActive: -1 })
      .limit(20);

    res.json({ ok: true, rooms });
  } catch (err) {
    next(err);
  }
});

export default router;