import { Room } from '../models/Room.js';

const activeRooms = new Map();

export const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    const ensureRoomActive = (roomId) => {
      if (!activeRooms.has(roomId)) {
        activeRooms.set(roomId, {
          participants: new Map(),
          messages: [],
          queue: [],
          polls: [],
          hypeCount: 0,
          mood: 'cinema',
          settings: { canChat: true, canReact: true, canRequestChanges: true, isLocked: false },
          state: { videoId: 'M7lc1UVf-VE', playState: 'paused', currentTime: 0 }
        });
      }
      return activeRooms.get(roomId);
    };

    const extractVideoId = (url) => {
      const match = url?.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
      return (match && match[2].length === 11) ? match[2] : url;
    };

    // --- CREATE ROOM ---
    socket.on('create_room', async ({ username }, callback) => {
      try {
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        const userId = socket.handshake.query?.userId || socket.handshake.auth?.userId || socket.id;
        const name = username || 'Host';

        await Room.create({
          roomId,
          name: `${name}'s Cinema Lounge`,
          hostId: userId,
          roles: { [userId]: 'host' },
          lastActive: new Date()
        });

        socket.join(roomId);
        socket.data = { roomId, userId, username: name, role: 'host' };

        const roomData = ensureRoomActive(roomId);
        roomData.participants.set(socket.id, { userId, username: name, role: 'host', seatIndex: 0 });

        callback({
          ok: true,
          roomId,
          userId,
          role: 'host',
          participants: [{ userId, username: name, role: 'host', seatIndex: 0 }]
        });
      } catch (err) {
        console.error('Create room error:', err);
        callback({ ok: false, error: 'Failed to create room' });
      }
    });

    // --- JOIN ROOM ---
    socket.on('join_room', async ({ roomId, userId: providedUserId, username }, callback) => {
      try {
        const targetRoomId = roomId ? roomId.toUpperCase() : '';
        const room = await Room.findOne({ roomId: targetRoomId });
        if (!room) return callback({ ok: false, error: 'Room not found' });

        const userId = providedUserId || socket.handshake.query?.userId || socket.handshake.auth?.userId || socket.id;

        if (room.bannedUsers?.includes(userId)) {
          return callback({ ok: false, error: 'You are banned from this room.' });
        }

        const roomData = ensureRoomActive(room.roomId);

        if (room.settings?.isLocked && !roomData.participants.has(socket.id)) {
          return callback({ ok: false, error: 'Room is locked by host.' });
        }

        const name = username || 'Guest';
        socket.join(room.roomId);

        // Strict Role Check: Only original creator gets host
        const isOriginalCreator = (userId === room.hostId);
        const role = isOriginalCreator ? 'host' : 'participant';

        socket.data = { roomId: room.roomId, userId, username: name, role };

        const assignedSeat = roomData.participants.size;
        roomData.participants.set(socket.id, { userId, username: name, role, seatIndex: assignedSeat });

        const participantsList = Array.from(roomData.participants.values());

        const joinMessage = {
          id: Date.now().toString() + Math.random(),
          username: 'System',
          text: `${name} took a seat in the lounge`,
          system: true,
          createdAt: new Date()
        };
        roomData.messages.push(joinMessage);

        io.to(room.roomId).emit('chat_message', joinMessage);
        io.to(room.roomId).emit('user_joined', { username: name, userId, participants: participantsList });

        callback({
          ok: true,
          roomId: room.roomId,
          userId,
          role,
          state: roomData.state,
          mood: roomData.mood,
          queue: roomData.queue,
          settings: room.settings || roomData.settings,
          participants: participantsList,
          messages: roomData.messages
        });
      } catch (err) {
        console.error('Join room error:', err);
        callback({ ok: false, error: 'Failed to join room' });
      }
    });

    // --- HOST ONLY: PROMOTE PARTICIPANT TO MODERATOR ---
    socket.on('promote_to_moderator', ({ roomId, userId: targetUserId }, callback) => {
      try {
        const activeRoomId = roomId || socket.data?.roomId;
        if (!activeRoomId) return callback?.({ ok: false, error: 'Room not found' });

        if (socket.data?.role !== 'host') {
          return callback?.({ ok: false, error: 'Only the room host can change roles.' });
        }

        const roomData = ensureRoomActive(activeRoomId);
        let targetSocketId = null;

        for (let [sockId, p] of roomData.participants.entries()) {
          if (p.userId === targetUserId || sockId === targetUserId) {
            if (p.role === 'host') break;
            p.role = 'moderator';
            targetSocketId = sockId;
            break;
          }
        }

        if (!targetSocketId) {
          return callback?.({ ok: false, error: 'Target user not found in room.' });
        }

        const updatedParticipants = Array.from(roomData.participants.values());
        io.to(activeRoomId).emit('role_updated', { userId: targetUserId, role: 'moderator', participants: updatedParticipants });

        callback?.({ ok: true });
      } catch (err) {
        console.error('Promote error:', err);
        callback?.({ ok: false, error: 'Failed to update role' });
      }
    });

    // --- HOST ONLY: TRANSFER HOST ---
    socket.on('transfer_host', async ({ roomId, userId: targetUserId }, callback) => {
      try {
        const activeRoomId = roomId || socket.data?.roomId;
        if (!activeRoomId) return callback?.({ ok: false, error: 'Room not found' });

        if (socket.data?.role !== 'host') {
          return callback?.({ ok: false, error: 'Only the room host can transfer host.' });
        }

        const roomData = ensureRoomActive(activeRoomId);
        let oldHostSocketId = socket.id;
        let newHostSocketId = null;

        for (let [sockId, p] of roomData.participants.entries()) {
          if (p.userId === targetUserId || sockId === targetUserId) {
            p.role = 'host';
            newHostSocketId = sockId;
          } else if (sockId === oldHostSocketId) {
            p.role = 'participant'; 
          }
        }

        if (!newHostSocketId) {
          return callback?.({ ok: false, error: 'Target user not found.' });
        }

        await Room.findOneAndUpdate({ roomId: activeRoomId }, { hostId: targetUserId });

        const updatedParticipants = Array.from(roomData.participants.values());
        io.to(activeRoomId).emit('host_transferred', { newHostId: targetUserId, participants: updatedParticipants });

        callback?.({ ok: true });
      } catch (err) {
        console.error('Transfer host error:', err);
        callback?.({ ok: false, error: 'Failed to transfer host' });
      }
    });

    // --- HOST ONLY: REMOVE PARTICIPANT ---
    socket.on('remove_participant', ({ roomId, userId: targetUserId }, callback) => {
      try {
        const activeRoomId = roomId || socket.data?.roomId;
        if (!activeRoomId) return callback?.({ ok: false, error: 'Room not found' });

        if (socket.data?.role !== 'host') {
          return callback?.({ ok: false, error: 'Only the room host can remove participants.' });
        }

        const roomData = ensureRoomActive(activeRoomId);
        let targetSocketId = null;

        for (let [sockId, p] of roomData.participants.entries()) {
          if (p.userId === targetUserId || sockId === targetUserId) {
            targetSocketId = sockId;
            roomData.participants.delete(sockId);
            break;
          }
        }

        if (targetSocketId) {
          io.to(targetSocketId).emit('kicked_out');
        }

        const updatedParticipants = Array.from(roomData.participants.values());
        io.to(activeRoomId).emit('user_left', { participants: updatedParticipants });

        callback?.({ ok: true });
      } catch (err) {
        console.error('Remove participant error:', err);
        callback?.({ ok: false, error: 'Failed to remove participant' });
      }
    });

    // --- CHAT MESSAGE HANDLER ---
    socket.on('chat_message', (data) => {
      try {
        const text = typeof data === 'string' ? data : data?.text;
        if (!text || !text.trim()) return;

        const roomId = data?.roomId || socket.data?.roomId || Array.from(socket.rooms).find(r => r !== socket.id);
        if (!roomId) return;

        const senderName = data?.username || socket.data?.username || 'Guest';
        const senderUserId = socket.data?.userId || socket.id;

        const roomData = ensureRoomActive(roomId);

        if (roomData.settings && roomData.settings.canChat === false && socket.data?.role !== 'host') {
          return;
        }

        const messageObj = {
          id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
          username: senderName,
          userId: senderUserId,
          text: text.trim(),
          system: false,
          createdAt: new Date()
        };

        roomData.messages.push(messageObj);
        if (roomData.messages.length > 100) roomData.messages.shift();

        io.to(roomId).emit('chat_message', messageObj);
        io.to(roomId).emit('user_spoke', { userId: senderUserId, text: text.trim() });
      } catch (err) {
        console.error('Chat error:', err);
      }
    });

    // --- VIDEO QUEUE & PLAYLIST HANDLERS ---
    socket.on('add_to_queue', ({ roomId, videoUrl, videoId, title, thumbnailUrl }) => {
      try {
        const activeRoomId = roomId || socket.data?.roomId;
        if (!activeRoomId || (!videoUrl && !videoId)) return;
        const roomData = ensureRoomActive(activeRoomId);
        const targetVideoId = videoId || extractVideoId(videoUrl);

        const queueItem = {
          id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
          videoId: targetVideoId,
          title: title || `YouTube Video (${targetVideoId})`,
          thumbnailUrl: thumbnailUrl || `https://img.youtube.com/vi/${targetVideoId}/hqdefault.jpg`,
          addedBy: socket.data?.username || 'Guest',
          votes: 0,
          voters: []
        };

        roomData.queue = roomData.queue || [];
        roomData.queue.push(queueItem);

        io.to(activeRoomId).emit('queue_updated', roomData.queue);
      } catch (err) {
        console.error('Add to queue error:', err);
      }
    });

    socket.on('vote_queue', ({ roomId, queueItemId }) => {
      const activeRoomId = roomId || socket.data?.roomId;
      if (!activeRoomId || !queueItemId) return;
      const roomData = ensureRoomActive(activeRoomId);
      const userId = socket.data?.userId || socket.id;

      roomData.queue = roomData.queue || [];
      const item = roomData.queue.find(i => i.id === queueItemId);

      if (item) {
        item.voters = item.voters || [];
        if (!item.voters.includes(userId)) {
          item.voters.push(userId);
          item.votes += 1;
        } else {
          item.voters = item.voters.filter(id => id !== userId);
          item.votes = Math.max(0, item.votes - 1);
        }

        roomData.queue.sort((a, b) => b.votes - a.votes);
        io.to(activeRoomId).emit('queue_updated', roomData.queue);
      }
    });

    socket.on('play_next_queue', ({ roomId }) => {
      const activeRoomId = roomId || socket.data?.roomId;
      if (!activeRoomId) return;
      if (socket.data?.role !== 'host' && socket.data?.role !== 'moderator') return;
      const roomData = ensureRoomActive(activeRoomId);

      if (roomData.queue && roomData.queue.length > 0) {
        const nextVideo = roomData.queue.shift();
        roomData.state.videoId = nextVideo.videoId;
        roomData.state.currentTime = 0;
        roomData.state.playState = 'playing';

        io.to(activeRoomId).emit('sync_state', roomData.state);
        io.to(activeRoomId).emit('queue_updated', roomData.queue);
      }
    });

    socket.on('remove_from_queue', ({ roomId, queueItemId }) => {
      const activeRoomId = roomId || socket.data?.roomId;
      if (!activeRoomId) return;
      if (socket.data?.role !== 'host' && socket.data?.role !== 'moderator') return;
      const roomData = ensureRoomActive(activeRoomId);

      if (roomData.queue) {
        roomData.queue = roomData.queue.filter(i => i.id !== queueItemId);
        io.to(activeRoomId).emit('queue_updated', roomData.queue);
      }
    });

    // --- REACTIONS & MOODS ---
    socket.on('send_reaction', ({ roomId, emoji, username }) => {
      const activeRoomId = roomId || socket.data?.roomId;
      if (!activeRoomId) return;
      const roomData = ensureRoomActive(activeRoomId);
      
      if (roomData.settings && roomData.settings.canReact === false) return;

      roomData.hypeCount = (roomData.hypeCount || 0) + 2;

      io.to(activeRoomId).emit('reaction', {
        id: Date.now() + Math.random(),
        emoji,
        username: username || socket.data?.username || 'Guest',
        userId: socket.data?.userId
      });

      io.to(activeRoomId).emit('hype_update', { hypeCount: roomData.hypeCount });
    });

    socket.on('set_mood', ({ roomId, moodId }) => {
      const activeRoomId = roomId || socket.data?.roomId;
      if (!activeRoomId) return;
      const roomData = ensureRoomActive(activeRoomId);
      roomData.mood = moodId;
      io.to(activeRoomId).emit('mood_changed', { moodId });
    });

    socket.on('update_settings', async ({ roomId, settings }, callback) => {
      const activeRoomId = roomId || socket.data?.roomId;
      if (!activeRoomId) return;
      if (socket.data?.role !== 'host') return callback?.({ ok: false, error: 'Host only' });
      const roomData = ensureRoomActive(activeRoomId);
      roomData.settings = { ...roomData.settings, ...settings };
      await Room.findOneAndUpdate({ roomId: activeRoomId }, { settings: roomData.settings });
      io.to(activeRoomId).emit('settings_updated', roomData.settings);
      callback?.({ ok: true });
    });

    // --- VIDEO PLAYBACK CONTROL & SYNC ---
    socket.on('start_countdown', ({ roomId }) => {
      const activeRoomId = roomId || socket.data?.roomId;
      if (!activeRoomId) return;
      if (socket.data?.role !== 'host' && socket.data?.role !== 'moderator') return;
      io.to(activeRoomId).emit('countdown_started', { duration: 3 });
      setTimeout(() => {
        const roomData = ensureRoomActive(activeRoomId);
        roomData.state.playState = 'playing';
        io.to(activeRoomId).emit('sync_state', roomData.state);
      }, 3500);
    });

    socket.on('play', ({ roomId }) => {
      const activeRoomId = roomId || socket.data?.roomId;
      if (activeRoomId) {
        const roomData = ensureRoomActive(activeRoomId);
        roomData.state.playState = 'playing';
        io.to(activeRoomId).emit('sync_state', roomData.state);
      }
    });

    socket.on('pause', ({ roomId }) => {
      const activeRoomId = roomId || socket.data?.roomId;
      if (activeRoomId) {
        const roomData = ensureRoomActive(activeRoomId);
        roomData.state.playState = 'paused';
        io.to(activeRoomId).emit('sync_state', roomData.state);
      }
    });

    socket.on('seek', ({ roomId, time }) => {
      const activeRoomId = roomId || socket.data?.roomId;
      if (activeRoomId) {
        const roomData = ensureRoomActive(activeRoomId);
        roomData.state.currentTime = time;
        io.to(activeRoomId).emit('sync_state', roomData.state);
      }
    });

    socket.on('change_video', ({ roomId, videoId }) => {
      const activeRoomId = roomId || socket.data?.roomId;
      if (activeRoomId) {
        const roomData = ensureRoomActive(activeRoomId);
        roomData.state.videoId = videoId;
        roomData.state.currentTime = 0;
        roomData.state.playState = 'playing';
        io.to(activeRoomId).emit('sync_state', roomData.state);
      }
    });

    socket.on('typing', ({ roomId, isTyping }) => {
      const activeRoomId = roomId || socket.data?.roomId;
      if (activeRoomId) {
        socket.to(activeRoomId).emit('user_typing', { userId: socket.data?.userId, username: socket.data?.username, isTyping });
      }
    });

    // --- DISCONNECT HANDLER ---
    socket.on('disconnect', () => {
      const { roomId, username, userId } = socket.data || {};
      if (roomId && activeRooms.has(roomId)) {
        const roomData = activeRooms.get(roomId);
        roomData.participants.delete(socket.id);
        const participantsList = Array.from(roomData.participants.values());

        const leaveMessage = {
          id: Date.now().toString() + Math.random(),
          username: 'System',
          text: `${username || 'A guest'} left their seat`,
          system: true,
          createdAt: new Date()
        };
        roomData.messages.push(leaveMessage);

        io.to(roomId).emit('chat_message', leaveMessage);
        io.to(roomId).emit('user_left', { username: username || 'User', userId, participants: participantsList });
      }
    });
  });
};