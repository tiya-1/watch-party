import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Video, Clock, ArrowRight, Trash2, Plus } from 'lucide-react';

export function Dashboard({ user, onSelectRoom, onCreateRoom }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/auth/my-rooms', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.ok) setRooms(data.rooms);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-8 text-left">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Welcome back, {user.username}</h1>
          <p className="text-xs text-slate-400 mt-1">Manage your created rooms or rejoin active sessions.</p>
        </div>
        <button
          onClick={onCreateRoom}
          className="px-5 py-3 bg-gradient-to-r from-fuchsia-600 to-amber-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center space-x-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Room</span>
        </button>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-mono uppercase tracking-widest text-fuchsia-400">Recent Watch Rooms</h3>
        {loading ? (
          <div className="text-slate-500 text-xs">Loading rooms...</div>
        ) : rooms.length === 0 ? (
          <div className="p-8 bg-white/[0.02] border border-white/5 rounded-2xl text-center text-slate-500 text-xs">
            No rooms found. Create your first watch room above!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map(room => (
              <motion.div
                key={room.roomId}
                whileHover={{ y: -4 }}
                className="p-6 bg-slate-950/80 border border-white/10 rounded-2xl space-y-4 backdrop-blur-xl shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono uppercase tracking-widest bg-fuchsia-950/80 text-fuchsia-300 px-3 py-1 rounded-full border border-fuchsia-800/40">
                      #{room.roomId}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(room.lastActive).toLocaleDateString()}</span>
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-white mb-1">{room.name}</h4>
                  <p className="text-xs text-slate-400">Max Participants: {room.maxParticipants}</p>
                </div>

                <div className="flex items-center space-x-3 pt-4 border-t border-white/5">
                  <button
                    onClick={() => onSelectRoom(room.roomId)}
                    className="flex-1 py-2.5 bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-bold text-xs uppercase rounded-xl flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <span>Rejoin</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}