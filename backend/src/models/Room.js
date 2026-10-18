import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true, index: true },
  name: { type: String, default: 'Watch Party Room' },
  hostId: { type: mongoose.Schema.Types.Mixed, required: true },
  isPublic: { type: Boolean, default: true },
  password: { type: String, default: '' },
  maxParticipants: { type: Number, default: 20 },
  settings: {
    canChat: { type: Boolean, default: true },
    canReact: { type: Boolean, default: true },
    canRequestChanges: { type: Boolean, default: true },
    isLocked: { type: Boolean, default: false }
  },
  currentState: {
    videoId: { type: String, default: 'dQw4w9WgXcQ' },
    isPlaying: { type: Boolean, default: false },
    currentTime: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now }
  },
  queue: [{
    id: String,
    videoId: String,
    title: String,
    thumbnailUrl: String,
    addedBy: String,
    votes: { type: Number, default: 0 },
    voters: [String]
  }],
  mood: { type: String, default: 'cinema' },
  bannedUsers: [String],
  mutedUsers: [String],
  roles: { type: Map, of: String, default: {} },
  lastActive: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

export const Room = mongoose.model('Room', roomSchema);