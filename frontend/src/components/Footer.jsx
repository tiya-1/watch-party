import React from 'react';

export function Footer() {
  return (
    <footer className="w-full border-t border-white/10 py-8 bg-[#030305]/90 backdrop-blur-xl relative z-10">
      <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500">
        <div>SyncRoom • Premium MERN Stack Watch Party Platform</div>
        <div className="flex items-center space-x-4">
          <span className="hover:text-fuchsia-400 transition-colors cursor-pointer">React</span>
          <span>•</span>
          <span className="hover:text-fuchsia-400 transition-colors cursor-pointer">Node.js</span>
          <span>•</span>
          <span className="hover:text-fuchsia-400 transition-colors cursor-pointer">Socket.IO</span>
          <span>•</span>
          <span className="hover:text-fuchsia-400 transition-colors cursor-pointer">MongoDB</span>
        </div>
      </div>
    </footer>
  );
}