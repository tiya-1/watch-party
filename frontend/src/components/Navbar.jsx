import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Video, Plus, LogIn, LogOut, User } from 'lucide-react';

export function Navbar({ onOpenCreate, onOpenJoin, onOpenAuth, onLogoClick, currentUser, onLogout }) {
  const [scrolled, setScrolled] = useState(false);
  const [username, setUsername] = useState(() => currentUser?.username || localStorage.getItem('username'));

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);

    // Sync from props or localStorage
    const currentName = currentUser?.username || localStorage.getItem('username');
    setUsername(currentName);

    const handleAuthChange = () => {
      setUsername(localStorage.getItem('username'));
    };
    window.addEventListener('auth-changed', handleAuthChange);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('auth-changed', handleAuthChange);
    };
  }, [currentUser]);

  return (
    <nav className={`sticky top-0 z-50 w-full transition-all duration-300 ${
      scrolled 
        ? 'bg-[#030305]/80 backdrop-blur-2xl border-b border-fuchsia-500/20 shadow-[0_10px_30px_rgba(0,0,0,0.8)]' 
        : 'bg-transparent border-b border-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div 
          onClick={onLogoClick} 
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <motion.div 
            whileHover={{ rotate: 12, scale: 1.1 }}
            className="p-2.5 bg-gradient-to-tr from-fuchsia-600 via-purple-600 to-amber-500 rounded-2xl shadow-lg shadow-fuchsia-600/30"
          >
            <Video className="w-5 h-5 text-white" />
          </motion.div>
          <span className="text-xl font-black tracking-wider text-white uppercase group-hover:text-fuchsia-400 transition-colors">
            Sync<span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 via-purple-300 to-amber-400">Room</span>
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onOpenJoin}
            className="text-xs font-mono font-bold uppercase tracking-widest text-slate-300 hover:text-fuchsia-300 transition-colors px-4 py-2 cursor-pointer"
          >
            Join Room
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(192, 38, 211, 0.6)" }}
            whileTap={{ scale: 0.95 }}
            onClick={onOpenCreate}
            className="text-xs font-mono font-bold uppercase tracking-widest px-5 py-2.5 bg-gradient-to-r from-fuchsia-600 via-purple-600 to-amber-500 text-white rounded-xl shadow-lg shadow-fuchsia-950/60 border border-fuchsia-400/30 transition-all flex items-center space-x-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Room</span>
          </motion.button>

          {username ? (
            <div className="flex items-center space-x-3 bg-black/50 border border-fuchsia-500/30 px-3.5 py-2 rounded-xl">
              <div className="flex items-center space-x-2 text-xs font-bold text-white">
                <User className="w-4 h-4 text-fuchsia-400" />
                <span>{username}</span>
              </div>
              <button 
                onClick={onLogout}
                className="text-slate-400 hover:text-rose-400 transition-colors p-1 cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onOpenAuth}
              className="text-xs font-mono font-bold uppercase tracking-widest px-4 py-2 bg-slate-900 hover:bg-slate-800 text-fuchsia-400 border border-fuchsia-500/40 rounded-xl transition-all flex items-center space-x-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </motion.button>
          )}
        </div>
      </div>
    </nav>
  );
}