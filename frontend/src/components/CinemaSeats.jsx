import React from 'react';
import { Crown, Shield, User, Mic } from 'lucide-react';
import { motion } from 'framer-motion';

export function CinemaSeats({ participants = [], currentUserId, typingUsers = {}, speakingUsers = {}, reactions = [] }) {
  return (
    <div className="w-full bg-slate-950/60 border border-white/5 rounded-3xl p-5 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs font-bold font-mono tracking-wider text-slate-400 uppercase">
          Cinema Lounge Seats ({participants.length})
        </h4>
        <span className="text-[10px] font-mono text-violet-400 bg-violet-950/50 px-2.5 py-1 rounded-full border border-violet-800/30">
          Live Stage
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {participants.map((p, index) => {
          // FIXED: Unique key generation to prevent React duplicate key warnings
          const uniqueKey = p.userId ? `${p.userId}-${index}` : `seat-${index}`;
          const isMe = p.userId === currentUserId;
          const isSpeaking = speakingUsers[p.userId];
          const userReaction = reactions.find(r => r.userId === p.userId);

          return (
            <motion.div
              key={uniqueKey}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                isMe 
                  ? 'bg-violet-950/40 border-violet-500/40 shadow-lg shadow-violet-950/50' 
                  : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {/* Floating Reaction Bubble */}
              {userReaction && (
                <motion.div
                  initial={{ y: 0, scale: 0 }}
                  animate={{ y: -35, scale: 1.2 }}
                  exit={{ opacity: 0 }}
                  className="absolute -top-3 z-30 text-2xl"
                >
                  {userReaction.emoji}
                </motion.div>
              )}

              {/* Seat Avatar & Badges */}
              <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center border border-white/10 shadow-inner mb-2">
                <span className="text-base font-black text-white">
                  {p.username ? p.username.charAt(0).toUpperCase() : 'G'}
                </span>

                {/* Role Badge */}
                <div className="absolute -bottom-1 -right-1 p-1 rounded-lg bg-slate-950 border border-slate-800 shadow">
                  {p.role === 'host' ? (
                    <Crown className="w-3 h-3 text-amber-400" />
                  ) : p.role === 'moderator' ? (
                    <Shield className="w-3 h-3 text-cyan-400" />
                  ) : (
                    <User className="w-3 h-3 text-slate-400" />
                  )}
                </div>

                {/* Speaking Indicator Glow */}
                {isSpeaking && (
                  <div className="absolute inset-0 rounded-2xl border-2 border-emerald-400 animate-pulse" />
                )}
              </div>

              {/* Username & Status */}
              <span className="text-xs font-bold text-slate-200 truncate max-w-full text-center">
                {p.username} {isMe && <span className="text-[10px] text-violet-400">(You)</span>}
              </span>

              <span className="text-[10px] font-mono text-slate-500 capitalize mt-0.5">
                {p.role}
              </span>

              {/* Speaking or Typing Text bubble */}
              {isSpeaking && (
                <div className="absolute -bottom-8 bg-emerald-950/90 border border-emerald-500/30 text-emerald-300 text-[10px] px-2 py-0.5 rounded-md shadow-xl z-20 truncate max-w-[120px]">
                  {isSpeaking}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}