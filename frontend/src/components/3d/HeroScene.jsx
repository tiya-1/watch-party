import React from 'react';
import { motion } from 'framer-motion';
import { Play, Sparkles, ShieldCheck } from 'lucide-react';

export default function HeroScene() {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="relative w-full h-[380px] rounded-3xl bg-gradient-to-tr from-fuchsia-950/60 via-slate-900/80 to-amber-950/40 border border-fuchsia-500/30 p-8 flex flex-col justify-between shadow-2xl backdrop-blur-2xl overflow-hidden group"
    >
      {/* Decorative Glow Elements */}
      <div className="absolute -top-16 -right-16 w-52 h-52 bg-fuchsia-600/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-52 h-52 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header inside Preview */}
      <div className="flex items-center justify-between relative z-10">
        <span className="px-3.5 py-1.5 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-300 text-[11px] font-mono flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>LIVE ROOM #SYNC99</span>
        </span>
        <ShieldCheck className="w-5 h-5 text-fuchsia-400 opacity-80" />
      </div>

      {/* Center Glass Play Icon */}
      <div className="flex items-center justify-center relative z-10 my-auto">
        <motion.div 
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.95 }}
          className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-fuchsia-600 via-purple-600 to-amber-500 flex items-center justify-center shadow-lg shadow-fuchsia-600/40 cursor-pointer"
        >
          <Play className="w-8 h-8 text-white fill-white ml-1" />
        </motion.div>
      </div>

      {/* Bottom Live Info Card */}
      <div className="relative z-10 flex items-center justify-between bg-black/60 border border-white/10 px-5 py-3.5 rounded-2xl backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-fuchsia-600 flex items-center justify-center text-xs font-bold text-white shadow-md">
            T
          </div>
          <div>
            <span className="block text-xs font-bold text-slate-200">YouTube Live Sync</span>
            <span className="text-[10px] text-slate-400">Host: Tiya Jain</span>
          </div>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-xl border border-emerald-800/40">
          Sub-Second ⚡
        </span>
      </div>
    </motion.div>
  );
}