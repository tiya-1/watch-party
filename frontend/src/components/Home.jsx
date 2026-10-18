import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Zap, ShieldCheck, MessageSquare, ArrowRight, Check, Lock, Plus, Video, User, X, LogOut, LogIn } from 'lucide-react';
import { socket } from '../lib/socket';

export function Home({ onJoin, user, onLoginSuccess, onLogout }) {
  const [mode, setMode] = useState('landing'); // 'landing' | 'create' | 'join'
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  
  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authUsername, setAuthUsername] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Room State
  const [username, setUsername] = useState(user ? user.username : (localStorage.getItem('username') || ''));
  const [roomId, setRoomId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('Host');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [scrolled, setScrolled] = useState(false);

  const activeUser = user || (localStorage.getItem('username') ? { username: localStorage.getItem('username') } : null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setMode('join');
      setRoomId(roomParam.toUpperCase());
    }
  }, []);

  const handleMouseMove = (e) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          authMode === 'login' 
            ? { email, password } 
            : { username: authUsername, email, password }
        )
      });
      const data = await res.json();
      setAuthLoading(false);

      if (res.ok && (data.user || data.accessToken)) {
        const loggedUser = data.user || { username: authUsername || email.split('@')[0] };
        localStorage.setItem('token', data.accessToken);
        localStorage.setItem('username', loggedUser.username);
        
        if (onLoginSuccess) onLoginSuccess(loggedUser);
        setUsername(loggedUser.username);
        setShowAuthModal(false);
        window.location.reload(); // Refresh to sync header state
      } else {
        setAuthError(data.error || data.message || 'Authentication failed');
      }
    } catch (err) {
      setAuthLoading(false);
      setAuthError('Server unreachable. Ensure backend is running.');
    }
  };

  const handleLogoutClick = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    if (onLogout) onLogout();
    window.location.reload();
  };

  const handleCreate = (e) => {
    e.preventDefault();
    const currentUsername = username.trim() || activeUser?.username || `Guest_${Math.floor(1000 + Math.random() * 9000)}`;
    setError('');
    setLoading(true);

    socket.emit('create_room', { username: currentUsername }, (res) => {
      setLoading(false);
      if (res && res.ok) {
        onJoin({ roomId: res.roomId, userId: res.userId, username: currentUsername, role: 'host', participants: res.participants });
      } else {
        setError(res?.error || 'Failed to create room');
      }
    });
  };

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    const currentUsername = username.trim() || activeUser?.username || `Guest_${Math.floor(1000 + Math.random() * 9000)}`;
    if (!roomId.trim()) return setError('Please enter a valid room code');
    setError('');
    setLoading(true);

    socket.emit('join_room', { roomId, username: currentUsername }, (res) => {
      setLoading(false);
      if (res && res.ok) {
        onJoin({ roomId: res.roomId, userId: res.userId, username: currentUsername, role: res.role || 'participant', participants: res.participants, initialState: res.state, messages: res.messages });
      } else {
        setError(res?.error || 'Room not found');
      }
    });
  };

  const permissions = {
    Host: [
      { name: 'Play / Pause Video', allowed: true },
      { name: 'Seek Video Timeline', allowed: true },
      { name: 'Change YouTube Video URL', allowed: true },
      { name: 'Promote / Demote Moderators', allowed: true },
      { name: 'Approve Control Requests', allowed: true },
    ],
    Moderator: [
      { name: 'Play / Pause Video', allowed: true },
      { name: 'Seek Video Timeline', allowed: true },
      { name: 'Change YouTube Video URL', allowed: true },
      { name: 'Promote / Demote Moderators', allowed: false },
      { name: 'Approve Control Requests', allowed: true },
    ],
    Participant: [
      { name: 'Play / Pause Video', allowed: false },
      { name: 'Seek Video Timeline', allowed: false },
      { name: 'Change YouTube Video URL', allowed: false },
      { name: 'Send Playback Request', allowed: true },
      { name: 'Participate in Chat & Reactions', allowed: true },
    ]
  };

  return (
    <div 
      onMouseMove={handleMouseMove}
      className="relative min-h-screen bg-[#030305] text-slate-100 font-sans selection:bg-fuchsia-600 selection:text-white overflow-hidden flex flex-col justify-between"
    >
      <div 
        className="pointer-events-none fixed w-[500px] h-[500px] bg-gradient-to-r from-fuchsia-600/15 via-purple-600/15 to-amber-500/10 rounded-full blur-[130px] transition-all duration-100 ease-out z-0"
        style={{ left: mousePos.x - 250, top: mousePos.y - 250 }}
      />

      {/* Sticky Navbar with Dynamic User Profile & Logout */}
      <nav className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled 
          ? 'bg-[#030305]/80 backdrop-blur-2xl border-b border-fuchsia-500/20 shadow-[0_10px_30px_rgba(0,0,0,0.8)]' 
          : 'bg-transparent border-b border-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div onClick={() => setMode('landing')} className="flex items-center space-x-3 cursor-pointer group">
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
            {activeUser ? (
              <div className="flex items-center space-x-3 bg-black/60 border border-fuchsia-500/30 px-3.5 py-2 rounded-xl shadow-md">
                <div className="flex items-center space-x-2 text-xs font-bold text-white">
                  <User className="w-4 h-4 text-fuchsia-400" />
                  <span>{activeUser.username}</span>
                </div>
                <button 
                  onClick={handleLogoutClick}
                  className="text-slate-400 hover:text-rose-400 transition-colors p-1 cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowAuthModal(true)}
                className="text-xs font-mono font-bold uppercase tracking-widest text-fuchsia-400 hover:text-fuchsia-300 transition-colors px-4 py-2 cursor-pointer border border-fuchsia-500/30 rounded-xl bg-fuchsia-950/30 hover:bg-fuchsia-900/40 flex items-center space-x-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}

            <button 
              onClick={() => { setError(''); setMode('join'); }}
              className="text-xs font-mono font-bold uppercase tracking-widest text-slate-300 hover:text-fuchsia-300 transition-colors px-4 py-2 cursor-pointer"
            >
              JOIN ROOM
            </button>
            <button 
              onClick={() => { setError(''); setMode('create'); }}
              className="text-xs font-mono font-bold uppercase tracking-widest px-5 py-2.5 bg-gradient-to-r from-fuchsia-600 via-purple-600 to-amber-500 text-white rounded-xl shadow-lg shadow-fuchsia-950/60 border border-fuchsia-400/30 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>CREATE ROOM</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-24 space-y-24 w-full">
        {/* HERO SECTION */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center pt-8">
          <div className="space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-fuchsia-950/60 border border-fuchsia-800/40 text-fuchsia-300 text-xs font-mono shadow-2xl backdrop-blur-xl">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
              <span className="uppercase tracking-widest">NEXT-GEN REALTIME WATCH EXPERIENCE</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.08]">
              Watch YouTube <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 via-purple-300 to-amber-400 drop-shadow-[0_0_35px_rgba(217,70,239,0.5)]">
                Together in Perfect Sync
              </span>
            </h1>

            <p className="text-slate-300 text-base sm:text-lg font-light leading-relaxed max-w-xl mx-auto lg:mx-0">
              Sub-second video stream synchronization, server-enforced RBAC role security, and instant guest access without requiring an account.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setError(''); setMode('create'); }}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-fuchsia-600 via-purple-600 to-amber-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-xl border border-fuchsia-400/40 transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>CREATE ROOM AS GUEST</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>

              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setError(''); setMode('join'); }}
                className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-slate-200 font-bold text-xs uppercase tracking-wider rounded-2xl border border-white/10 backdrop-blur-md transition-all cursor-pointer"
              >
                JOIN VIA CODE
              </motion.button>
            </div>
          </div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="relative w-full rounded-3xl overflow-hidden border border-fuchsia-500/30 shadow-[0_0_60px_rgba(217,70,239,0.25)] bg-slate-950/90 p-2.5 backdrop-blur-3xl group"
          >
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-white/10 group-hover:border-fuchsia-500/50 transition-colors">
              <img 
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRF8VKTZMtOCn8h4A4XYAQ3EVdOnMRdR-eGRFJ0UVlzP3pws8VxkxKryUiW&s=10" 
                alt="SyncRoom Platform Preview" 
                className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#030305] via-transparent to-transparent opacity-90" />
              
              <div className="absolute top-4 left-4 flex items-center space-x-2 bg-black/80 border border-emerald-500/40 px-3.5 py-1.5 rounded-full backdrop-blur-md shadow-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">GUEST MODE ENABLED</span>
              </div>

              <div className="absolute bottom-6 left-6 text-left">
                <span className="text-[10px] font-mono uppercase tracking-widest text-fuchsia-300 bg-fuchsia-950/80 px-3 py-1 rounded-md border border-fuchsia-700/50 shadow-[0_0_15px_rgba(217,70,239,0.4)]">
                  LIVE ROOM INFRASTRUCTURE
                </span>
                <h3 className="text-lg font-bold mt-2 text-white">Ultra-Low Latency Synchronization</h3>
              </div>
            </div>
          </motion.div>
        </section>

        {/* AUTH MODAL */}
        <AnimatePresence>
          {showAuthModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-[#08080f]/95 border border-fuchsia-500/40 p-8 rounded-3xl shadow-[0_0_80px_rgba(217,70,239,0.3)] text-left relative overflow-hidden backdrop-blur-3xl"
              >
                <button 
                  onClick={() => setShowAuthModal(false)}
                  className="absolute top-6 right-6 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <h2 className="text-2xl font-bold text-white mb-2">
                  {authMode === 'login' ? 'Sign In to SyncRoom' : 'Create Account'}
                </h2>
                <p className="text-xs text-slate-400 mb-6">
                  {authMode === 'login' ? 'Enter your registered email and password.' : 'Register to manage persistent rooms & saved profiles.'}
                </p>

                {authError && <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl">{authError}</div>}

                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  {authMode === 'register' && (
                    <div>
                      <label className="block text-[11px] font-mono text-fuchsia-400 mb-1.5 uppercase">Username</label>
                      <input 
                        type="text" 
                        required 
                        value={authUsername} 
                        onChange={(e) => setAuthUsername(e.target.value)} 
                        placeholder="e.g. Tiya Jain" 
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-fuchsia-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-mono text-fuchsia-400 mb-1.5 uppercase">Email Address</label>
                    <input 
                      type="email" 
                      required 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      placeholder="tiya@example.com" 
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-fuchsia-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-fuchsia-400 mb-1.5 uppercase">Password</label>
                    <input 
                      type="password" 
                      required 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      placeholder="••••••••" 
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-fuchsia-500"
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={authLoading}
                    className="w-full py-3.5 mt-2 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:opacity-90 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
                  >
                    {authLoading ? 'Processing...' : authMode === 'login' ? 'Sign In' : 'Register'}
                  </button>
                </form>

                <div className="mt-6 text-center text-xs text-slate-400">
                  {authMode === 'login' ? (
                    <span>Don't have an account? <button onClick={() => setAuthMode('register')} className="text-fuchsia-400 font-bold hover:underline ml-1 cursor-pointer">Register</button></span>
                  ) : (
                    <span>Already have an account? <button onClick={() => setAuthMode('login')} className="text-fuchsia-400 font-bold hover:underline ml-1 cursor-pointer">Sign In</button></span>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* CREATE / JOIN ROOM MODAL */}
        <AnimatePresence>
          {mode !== 'landing' && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl">
              <motion.form
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onSubmit={mode === 'create' ? handleCreate : handleJoinSubmit}
                className="w-full max-w-xl bg-[#08080f]/95 border border-fuchsia-500/40 p-10 rounded-3xl shadow-[0_0_80px_rgba(217,70,239,0.3)] text-left relative overflow-hidden backdrop-blur-3xl"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-amber-500" />
                <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">
                  {mode === 'create' ? 'Create Watch Room (Guest Mode Available)' : 'Join Watch Room'}
                </h2>
                <p className="text-xs text-slate-400 mb-8">
                  {mode === 'create' ? 'Enter a display name or join instantly as guest.' : 'Enter your name and room code.'}
                </p>

                {error && <div className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl">{error}</div>}

                <div className="space-y-6 mb-8">
                  <div>
                    <label className="block text-[11px] font-mono text-fuchsia-400 mb-2.5 uppercase tracking-wider">Display Name (Guest / User)</label>
                    <input 
                      type="text" 
                      value={username} 
                      onChange={(e) => setUsername(e.target.value)} 
                      placeholder={activeUser ? activeUser.username : "e.g. Guest Observer"} 
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-5 py-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-fuchsia-500 transition-all" 
                      autoFocus
                    />
                  </div>

                  {mode === 'join' && (
                    <div>
                      <label className="block text-[11px] font-mono text-fuchsia-400 mb-2.5 uppercase tracking-wider">Room Code</label>
                      <input 
                        type="text" 
                        value={roomId} 
                        onChange={(e) => setRoomId(e.target.value.toUpperCase())} 
                        placeholder="e.g. ABC123" 
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-5 py-3.5 text-sm text-white tracking-widest placeholder-slate-600 focus:outline-none focus:border-fuchsia-500 transition-all uppercase" 
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-4">
                  <button type="button" onClick={() => setMode('landing')} className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer">Cancel</button>
                  <button type="submit" disabled={loading} className="flex-1 py-3.5 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:opacity-90 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer">
                    {loading ? 'Connecting...' : mode === 'create' ? 'Launch Room 🚀' : 'Join Room'}
                  </button>
                </div>
              </motion.form>
            </div>
          )}
        </AnimatePresence>

        {/* FEATURES GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          <motion.div whileHover={{ y: -8, scale: 1.02 }} className="p-6 bg-white/[0.03] border border-white/10 hover:border-fuchsia-500/60 rounded-2xl transition-all backdrop-blur-md shadow-xl group cursor-default">
            <div className="w-9 h-9 rounded-xl bg-fuchsia-950/80 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-400 mb-4 shadow-[0_0_15px_rgba(217,70,239,0.3)] group-hover:shadow-[0_0_25px_rgba(217,70,239,0.7)] transition-shadow">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-white mb-1 group-hover:text-fuchsia-300 transition-colors">Sub-Second Sync Engine</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Play, pause, and seek commands stream across WebSockets with latency compensation for registered users and guests alike.</p>
          </motion.div>

          <motion.div whileHover={{ y: -8, scale: 1.02 }} className="p-6 bg-white/[0.03] border border-white/10 hover:border-purple-500/60 rounded-2xl transition-all backdrop-blur-md shadow-xl group cursor-default">
            <div className="w-9 h-9 rounded-xl bg-purple-950/80 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4 shadow-[0_0_15px_rgba(168,85,247,0.3)] group-hover:shadow-[0_0_25px_rgba(168,85,247,0.7)] transition-shadow">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-white mb-1 group-hover:text-purple-300 transition-colors">Host & Moderator RBAC</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Server-enforced access controls prevent unauthorized playback triggers across all roles.</p>
          </motion.div>

          <motion.div whileHover={{ y: -8, scale: 1.02 }} className="p-6 bg-white/[0.03] border border-white/10 hover:border-amber-500/60 rounded-2xl transition-all backdrop-blur-md shadow-xl group cursor-default">
            <div className="w-9 h-9 rounded-xl bg-amber-950/80 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 shadow-[0_0_15px_rgba(245,158,11,0.3)] group-hover:shadow-[0_0_25px_rgba(245,158,11,0.7)] transition-shadow">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-white mb-1 group-hover:text-amber-300 transition-colors">Persistent Group Chat</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Chat history securely saved in MongoDB Atlas with auto-cleanup TTL indexes.</p>
          </motion.div>
        </div>

        {/* INTERACTIVE PERMISSION MATRIX */}
        <section className="space-y-8">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-mono text-fuchsia-400 uppercase tracking-widest">Role-Based Access Control</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Interactive Permission Matrix</h2>
            <p className="text-slate-400 text-sm">Server-enforced WebSocket security prevents unauthorized sync actions.</p>
          </div>

          <div className="max-w-3xl mx-auto bg-slate-950/60 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
            <div className="flex justify-center space-x-3 mb-8">
              {['Host', 'Moderator', 'Participant'].map((role) => (
                <button
                  key={role}
                  onClick={() => setActiveTab(role)}
                  className={`px-6 py-2.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                    activeTab === role 
                      ? 'bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white shadow-lg shadow-fuchsia-900/50' 
                      : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {permissions[activeTab].map((perm, i) => (
                <motion.div
                  key={perm.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between p-4 rounded-xl bg-black/40 border border-white/5"
                >
                  <span className="text-sm font-medium text-slate-200">{perm.name}</span>
                  {perm.allowed ? (
                    <div className="flex items-center space-x-1.5 text-emerald-400 text-xs font-mono">
                      <Check className="w-4 h-4" />
                      <span>Allowed</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1.5 text-rose-400 text-xs font-mono">
                      <Lock className="w-4 h-4" />
                      <span>Restricted</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full border-t border-white/10 py-8 bg-[#030305]/90 backdrop-blur-xl relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500">
          <div>SyncRoom • Premium MERN Stack Watch Party Platform</div>
          <div className="flex items-center space-x-4">
            <span className="hover:text-fuchsia-400 transition-colors">React</span>
            <span>•</span>
            <span className="hover:text-fuchsia-400 transition-colors">Node.js</span>
            <span>•</span>
            <span className="hover:text-fuchsia-400 transition-colors">Socket.IO</span>
            <span>•</span>
            <span className="hover:text-fuchsia-400 transition-colors">MongoDB</span>
          </div>
        </div>
      </footer>
    </div>
  );
}