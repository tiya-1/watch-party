import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Mail, User } from 'lucide-react';

export function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin ? { email, password } : { email, password, username };

    try {
      const res = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      const data = await res.json();

      if (res.ok && data.ok) {
        localStorage.setItem('token', data.accessToken);
        
        const resolvedUsername = data.user?.username || username || email.split('@')[0];
        const resolvedUserId = data.user?.id || data.user?._id || 'guest';
        
        localStorage.setItem('username', resolvedUsername);
        localStorage.setItem('userId', resolvedUserId);

        window.dispatchEvent(new Event('auth-changed'));

        if (onAuthSuccess) onAuthSuccess(data.user);
        onClose();
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (err) {
      setError('Network error. Ensure backend server is online.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-[#08080f] border border-fuchsia-500/40 p-8 rounded-3xl shadow-[0_0_50px_rgba(217,70,239,0.3)] relative text-left"
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-white cursor-pointer">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold text-white mb-2">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
        <p className="text-xs text-slate-400 mb-6">Persistent profiles & room history across sessions.</p>

        {error && <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-[11px] font-mono text-fuchsia-400 mb-2 uppercase">Username</label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Tiya Jain"
                  className="w-full bg-black/60 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:border-fuchsia-500 outline-none"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-mono text-fuchsia-400 mb-2 uppercase">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tiya@example.com"
                className="w-full bg-black/60 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:border-fuchsia-500 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-fuchsia-400 mb-2 uppercase">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-black/60 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:border-fuchsia-500 outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer"
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Register Account'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => setIsLogin(!isLogin)} className="text-fuchsia-400 font-bold hover:underline cursor-pointer">
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// Default export ensure karne ke liye taaki module resolution fail na ho
export default AuthModal;