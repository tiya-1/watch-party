import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useGesture } from '@use-gesture/react';

const EMOJIS = ['❤️', '😂', '😮', '👏', '🔥', '🎉', '😢', '🤯'];

export function ReactionDock({ onSendReaction }) {
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const bind = useGesture({
    onDrag: ({ offset: [x, y] }) => {
      setDragOffset({ x, y });
    },
    onDragEnd: ({ velocity: [, vy] }) => {
      if (vy < -0.5) {
        onSendReaction('🔥');
      }
      setDragOffset({ x: 0, y: 0 });
    }
  });

  return (
    <div className="flex items-center justify-center space-x-2 p-2 bg-black/60 border border-white/10 rounded-2xl backdrop-blur-xl shadow-2xl">
      {EMOJIS.map((emoji) => (
        <motion.button
          key={emoji}
          whileHover={{ scale: 1.4, y: -6 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onSendReaction(emoji)}
          className="p-2 text-xl sm:text-2xl hover:bg-white/10 rounded-xl transition-all cursor-pointer"
        >
          {emoji}
        </motion.button>
      ))}

      {/* Throw gesture launcher */}
      <div
        {...bind()}
        className="ml-2 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-rose-600 rounded-xl text-[10px] font-bold text-white uppercase tracking-wider cursor-grab active:cursor-grabbing shadow-md touch-none"
        style={{ transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)` }}
      >
        Flick 🔥
      </div>
    </div>
  );
}