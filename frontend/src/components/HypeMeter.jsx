import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Flame } from 'lucide-react';

export function HypeMeter({ hypeCount }) {
  const percentage = Math.min(100, Math.max(0, (hypeCount % 100)));

  useEffect(() => {
    if (percentage >= 98) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [percentage]);

  return (
    <div className="w-full bg-slate-950/80 border border-slate-800/80 p-2.5 rounded-2xl backdrop-blur-md flex items-center space-x-3">
      <div className="flex items-center space-x-1 text-amber-400 font-black text-xs">
        <Flame className={`w-4 h-4 ${percentage > 50 ? 'animate-bounce text-orange-500' : ''}`} />
        <span>HYPE</span>
      </div>

      <div className="flex-1 h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800 relative">
        <motion.div
          className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-violet-600 rounded-full shadow-[0_0_12px_rgba(244,63,94,0.8)]"
          initial={{ width: '0%' }}
          animate={{ width: `${percentage}%` }}
          transition={{ type: 'spring', stiffness: 80 }}
        />
      </div>

      <span className="text-[10px] font-mono text-slate-400 w-8 text-right">{percentage}%</span>
    </div>
  );
}