import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

const PORT = process.env.PORT || 5000;

const app = express();
const server = http.createServer(app);
// Allow the Vercel frontend to connect (set CLIENT_ORIGIN on Render)
const io = new Server(server, { cors: { origin: process.env.CLIENT_ORIGIN || '*' } });

// Simple health check (useful for Render)
app.get('/', (_req, res) => res.send('Watch Party server is running'));

// rooms: code -> { id, users: Map(socketId -> {id, username, role}), videoId, playing, time, at }
const rooms = new Map();
const DEFAULT_VIDEO = 'M7lc1UVf-VE';
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const newCode = () => {
  let c;
  do c = Array.from({ length: 6 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');
  while (rooms.has(c));
  return c;
};

const videoIdFrom = (input) => {
  const s = String(input || '').trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  try {
    const u = new URL(s);
    const id = u.hostname === 'youtu.be' ? u.pathname.slice(1, 12) : u.searchParams.get('v');
    return id && /^[\w-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
};

const stateOf = (r) => ({
  videoId: r.videoId,
  playState: r.playing ? 'playing' : 'paused',
  currentTime: r.time + (r.playing ? (Date.now() - r.at) / 1000 : 0), // extrapolate while playing
});
const listOf = (r) => [...r.users.values()];
const canControl = (u) => u.role === 'host' || u.role === 'moderator';

io.on('connection', (socket) => {
  const ctx = () => {
    const room = rooms.get(socket.data.roomId);
    const me = room?.users.get(socket.id);
    return room && me ? { room, me } : null;
  };
  const deny = (message) => socket.emit('error_message', { message });
  const sync = (room) => io.to(room.id).emit('sync_state', stateOf(room));

  const enter = (room, user, cb) => {
    room.users.set(socket.id, user);
    socket.join(room.id);
    socket.data.roomId = room.id;
    cb?.({ ok: true, roomId: room.id, userId: socket.id, participants: listOf(room), state: stateOf(room) });
  };

  function leave() {
    const c = ctx();
    if (!c) return;
    const { room, me } = c;
    room.users.delete(socket.id);
    socket.leave(room.id);
    socket.data.roomId = null;
    if (room.users.size === 0) return rooms.delete(room.id);
    if (me.role === 'host') {
      const next = [...room.users.values()].find((u) => u.role === 'moderator') || [...room.users.values()][0];
      next.role = 'host';
    }
    io.to(room.id).emit('user_left', { username: me.username, userId: me.id, participants: listOf(room) });
  }

  socket.on('create_room', ({ username } = {}, cb) => {
    const name = String(username || '').trim().slice(0, 24);
    if (!name) return cb?.({ ok: false, error: 'Username is required' });
    leave();
    const room = { id: newCode(), users: new Map(), videoId: DEFAULT_VIDEO, playing: false, time: 0, at: Date.now() };
    rooms.set(room.id, room);
    enter(room, { id: socket.id, username: name, role: 'host' }, cb);
  });

  socket.on('join_room', ({ roomId, username } = {}, cb) => {
    const name = String(username || '').trim().slice(0, 24);
    if (!name) return cb?.({ ok: false, error: 'Username is required' });
    const room = rooms.get(String(roomId || '').trim().toUpperCase());
    if (!room) return cb?.({ ok: false, error: 'Room not found. Check the code and try again.' });
    leave();
    const user = { id: socket.id, username: name, role: 'participant' };
    enter(room, user, cb);
    socket.to(room.id).emit('user_joined', { username: name, userId: socket.id, role: user.role, participants: listOf(room) });
  });

  socket.on('leave_room', leave);
  socket.on('disconnect', leave);
  socket.on('request_sync', () => { const c = ctx(); if (c) socket.emit('sync_state', stateOf(c.room)); });

  // ---- playback: host / moderator only (checked here, never trust the UI) ----
  const control = (type, apply) =>
    socket.on(type, (payload = {}) => {
      const c = ctx();
      if (!c) return;
      if (!canControl(c.me)) return deny('Only the host or a moderator can control playback.');
      const now = Date.now();
      const cur = stateOf(c.room).currentTime;
      const t = Number.isFinite(Number(payload.time)) && Number(payload.time) >= 0 ? Number(payload.time) : cur;
      if (apply(c.room, t, payload, now) === false) return deny('Invalid value');
      sync(c.room);
    });

  control('play', (r, t, _p, now) => { r.playing = true; r.time = t; r.at = now; });
  control('pause', (r, t, _p, now) => { r.playing = false; r.time = t; r.at = now; });
  control('seek', (r, t, _p, now) => { r.time = t; r.at = now; });
  control('change_video', (r, _t, p, now) => {
    const id = videoIdFrom(p.url ?? p.videoId);
    if (!id) return false;
    r.videoId = id; r.playing = true; r.time = 0; r.at = now;
  });

  // ---- host only ----
  socket.on('assign_role', ({ userId, role } = {}) => {
    const c = ctx();
    if (!c) return;
    if (c.me.role !== 'host') return deny('Only the host can assign roles');
    const target = c.room.users.get(userId);
    if (!target || target.role === 'host' || !['moderator', 'participant'].includes(role)) return deny('Cannot assign that role');
    target.role = role;
    io.to(c.room.id).emit('role_assigned', { userId, username: target.username, role, participants: listOf(c.room) });
  });

  socket.on('remove_participant', ({ userId } = {}) => {
    const c = ctx();
    if (!c) return;
    if (c.me.role !== 'host') return deny('Only the host can remove participants');
    const target = c.room.users.get(userId);
    if (!target || userId === c.me.id) return;
    c.room.users.delete(userId);
    io.to(c.room.id).emit('participant_removed', { userId, username: target.username, participants: listOf(c.room) });
    const s = io.sockets.sockets.get(userId);
    if (s) { s.leave(c.room.id); s.data.roomId = null; }
  });

  socket.on('transfer_host', ({ userId } = {}) => {
    const c = ctx();
    if (!c) return;
    if (c.me.role !== 'host') return deny('Only the host can transfer host');
    const target = c.room.users.get(userId);
    if (!target || userId === c.me.id) return;
    c.me.role = 'moderator';
    target.role = 'host';
    io.to(c.room.id).emit('role_assigned', { userId, username: target.username, role: 'host', participants: listOf(c.room) });
  });
});

server.listen(PORT, () => console.log(`Server listening on :${PORT}`));
