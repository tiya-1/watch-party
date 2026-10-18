import { Room } from '../models/Room.js';

export class RoomManager {
  constructor() {
    this.activeRooms = new Map();
  }

  async getRoom(roomId) {
    if (this.activeRooms.has(roomId)) {
      return this.activeRooms.get(roomId);
    }
    const room = await Room.findOne({ roomId });
    if (room) {
      this.activeRooms.set(roomId, room);
    }
    return room;
  }

  async saveRoom(room) {
    this.activeRooms.set(room.roomId, room);
    await room.save();
  }

  async removeRoom(roomId) {
    this.activeRooms.delete(roomId);
    await Room.deleteOne({ roomId });
  }

  calculateCurrentTime(room) {
    if (room.playState !== 'playing') return room.currentTime;
    const elapsed = (Date.now() - room.updatedAt) / 1000;
    return room.currentTime + elapsed;
  }
}