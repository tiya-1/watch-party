import React, { useState, useEffect, useRef } from 'react';
import { socket } from '../lib/socket';
import { YouTubePlayer } from './YouTubePlayer';
import { Chat } from './Chat';
import { ParticipantList } from './ParticipantList';
import { CinemaSeats } from './CinemaSeats';
import { ReactionDock } from './ReactionDock';
import { HypeMeter } from './HypeMeter';
import { RoomSettingsModal } from './RoomSettingsModal';
import { VideoQueue } from './VideoQueue';
import { 
  Users, MessageSquare, ListVideo, Copy, Check, 
  Video, Shield, Crown, Settings, Play, Pause, 
  RotateCcw, RotateCw, Timer, Plus, HelpCircle, WifiOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MOODS = [
  { id: 'cinema', name: 'Cinema', color: 'from-amber-900/30 to-red-950/40' },
  { id: 'neon', name: 'Neon Arcade', color: 'from-fuchsia-950/40 to-cyan-950/40' },
  { id: 'lofi', name: 'Lo-fi Rain', color: 'from-slate-950 to-blue-950/50' },
  { id: 'sunset', name: 'Sunset', color: 'from-rose-950/40 to-amber-950/40' }
];

export function Room({ roomData, onLeave }) {
  const { roomId, userId, username, role: initialRole, participants: initialParticipants, initialState, messages: initialMessages, queue: initialQueue } = roomData;

  const [role, setRole] = useState(initialRole);
  const [participants, setParticipants] = useState(initialParticipants || []);
  const [messages, setMessages] = useState(initialMessages || []);
  const [queue, setQueue] = useState(initialQueue || []);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoState, setVideoState] = useState(initialState || { videoId: 'M7lc1UVf-VE', playState: 'paused', currentTime: 0 });
  
  const [activeTab, setActiveTab] = useState('chat');
  const [mood, setMood] = useState(roomData.mood || 'cinema');
  const [hypeCount, setHypeCount] = useState(roomData.hypeCount || 0);
  
  const [reactions, setReactions] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [speakingUsers, setSpeakingUsers] = useState({});
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [settings, setSettings] = useState({
    canChat: roomData.settings?.canChat ?? true,
    canReact: roomData.settings?.canReact ?? true,
    canRequestChanges: roomData.settings?.canRequestChanges ?? true,
    isLocked: Boolean(roomData.settings?.isLocked)
  });

  const [codeCopied, setCodeCopied] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [isConnected, setIsConnected] = useState(socket.connected);

  const [isIntroActive, setIsIntroActive] = useState(true);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const chatInputRef = useRef(null);

  useEffect(() => {
    window.socket = socket;
    const introTimer = setTimeout(() => setIsIntroActive(false), 2200);

    const handleMouseMove = (e) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      clearTimeout(introTimer);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          if (role === 'host' || role === 'moderator') {
            videoState.playState === 'playing' ? handlePause() : handlePlay();
          }
          break;
        case 'arrowright':
          e.preventDefault();
          if (role === 'host' || role === 'moderator') handleSeek(10);
          break;
        case 'arrowleft':
          e.preventDefault();
          if (role === 'host' || role === 'moderator') handleSeek(-10);
          break;
        case 'c':
          e.preventDefault();
          setActiveTab('chat');
          chatInputRef.current?.focus();
          break;
        case '?':
          e.preventDefault();
          setShowHelpModal((prev) => !prev);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [role, videoState]);

  // Socket Event Listeners
  useEffect(() => {
    const onConnect = () => {
      setIsConnected(true);
      console.log("Socket connected successfully in Room:", socket.id);
    };
    const onDisconnect = () => {
      setIsConnected(false);
      console.log("Socket disconnected");
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    socket.emit('join_room', { roomId, userId, username }, (res) => {
      if (res && res.ok) {
        if (res.state) setVideoState(res.state);
        if (res.participants) setParticipants(res.participants);
        if (res.messages) setMessages(res.messages);
        if (res.queue) setQueue(res.queue);
        if (res.settings) {
          setSettings({
            canChat: res.settings.canChat ?? true,
            canReact: res.settings.canReact ?? true,
            canRequestChanges: res.settings.canRequestChanges ?? true,
            isLocked: Boolean(res.settings.isLocked)
          });
        }
        if (res.mood) setMood(res.mood);
        if (res.role) setRole(res.role);
      } else {
        console.error("Failed to join room:", res?.error);
      }
    });

    const handleChatMessage = (msg) => {
      setMessages((prev) => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };

    socket.on('chat_message', handleChatMessage);

    socket.on('user_spoke', ({ userId: speakerId, text }) => {
      setSpeakingUsers((prev) => ({ ...prev, [speakerId]: text }));
      setTimeout(() => {
        setSpeakingUsers((prev) => {
          const next = { ...prev };
          delete next[speakerId];
          return next;
        });
      }, 3000);
    });

    socket.on('user_joined', ({ participants: updatedParts }) => {
      if (updatedParts) setParticipants(updatedParts);
    });
    socket.on('user_left', ({ participants: updatedParts }) => {
      if (updatedParts) setParticipants(updatedParts);
    });

    // Role, Host Transfer, and Kick Listeners
    socket.on('role_updated', ({ userId: targetUserId, role: newRole, participants: updatedParts }) => {
      if (updatedParts) setParticipants(updatedParts);
      if (targetUserId === userId) {
        setRole(newRole);
      }
    });

    socket.on('host_transferred', ({ newHostId, participants: updatedParts }) => {
      if (updatedParts) setParticipants(updatedParts);
      if (newHostId === userId) {
        setRole('host');
      } else {
        setRole('participant');
      }
    });

    socket.on('kicked_out', () => {
      alert('You have been removed from the room by the host.');
      onLeave();
    });

    socket.on('sync_state', (state) => setVideoState(state));
    socket.on('queue_updated', (newQueue) => setQueue(Array.isArray(newQueue) ? newQueue : []));
    
    socket.on('reaction', (reaction) => {
      setReactions((prev) => [...prev, reaction]);
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== reaction.id));
      }, 2000);
    });

    socket.on('hype_update', ({ hypeCount }) => setHypeCount(hypeCount));
    
    socket.on('settings_updated', (newSettings) => {
      setSettings(prev => ({
        ...prev,
        canChat: newSettings.canChat ?? prev.canChat,
        canReact: newSettings.canReact ?? prev.canReact,
        canRequestChanges: newSettings.canRequestChanges ?? prev.canRequestChanges,
        isLocked: Boolean(newSettings.isLocked)
      }));
    });

    socket.on('mood_changed', ({ moodId }) => setMood(moodId));

    socket.on('countdown_started', ({ duration }) => {
      let count = duration;
      setCountdown(count);
      const timer = setInterval(() => {
        count -= 1;
        if (count <= 0) {
          clearInterval(timer);
          setCountdown(null);
        } else {
          setCountdown(count);
        }
      }, 1000);
    });

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('chat_message', handleChatMessage);
      socket.off('user_spoke');
      socket.off('user_joined');
      socket.off('user_left');
      socket.off('role_updated');
      socket.off('host_transferred');
      socket.off('kicked_out');
      socket.off('sync_state');
      socket.off('queue_updated');
      socket.off('reaction');
      socket.off('hype_update');
      socket.off('settings_updated');
      socket.off('mood_changed');
      socket.off('countdown_started');
    };
  }, [roomId, userId, username]);

  const activeMoodObj = MOODS.find(m => m.id === mood) || MOODS[0];

  const handlePlay = () => socket.emit('play', { roomId });
  const handlePause = () => socket.emit('pause', { roomId });
  const handleSeek = (secs) => socket.emit('seek', { roomId, time: Math.max(0, (videoState.currentTime || 0) + secs) });

  const handleVideoChangeSubmit = (e) => {
    e.preventDefault();
    if (!videoUrl.trim()) return;
    const match = videoUrl.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
    const videoId = (match && match[2].length === 11) ? match[2] : videoUrl;
    socket.emit('change_video', { roomId, videoId });
    setVideoUrl('');
  };

  const handleSendReaction = (emoji) => {
    if (!settings.canReact) return;
    socket.emit('send_reaction', { roomId, emoji, username });
  };

  const handleMoodChange = (moodId) => socket.emit('set_mood', { roomId, moodId });
  const handleStartCountdown = () => socket.emit('start_countdown', { roomId });

  const handleSendMessage = (text) => {
    if (!text.trim() || !settings.canChat) return;
    socket.emit('chat_message', { roomId, text, username });
  };

  return (
    <div className={`relative min-h-screen bg-[#05060a] bg-gradient-to-b ${activeMoodObj.color} text-slate-100 flex flex-col font-sans transition-all duration-700 overflow-hidden`}>
      
      {/* Custom Desktop Cursor Glow */}
      <div 
        className="pointer-events-none fixed z-50 w-72 h-72 rounded-full bg-violet-600/10 blur-3xl transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 hidden md:block"
        style={{ left: cursorPos.x, top: cursorPos.y }}
      />

      {/* Reconnecting Alert Banner */}
      <AnimatePresence>
        {!isConnected && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-0 left-0 right-0 z-50 bg-rose-600 text-white py-2 text-center font-mono text-xs font-bold flex items-center justify-center space-x-2 shadow-2xl"
          >
            <WifiOff className="w-4 h-4 animate-bounce" />
            <span>Connection lost. Reconnecting to SyncRoom...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cinematic Entrance Overlay */}
      <AnimatePresence>
        {isIntroActive && (
          <motion.div 
            onClick={() => setIsIntroActive(false)}
            className="fixed inset-0 z-50 flex cursor-pointer"
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
          >
            <motion.div 
              initial={{ x: '0%' }}
              animate={{ x: '-100%' }}
              transition={{ duration: 1.8, ease: [0.77, 0, 0.175, 1] }}
              className="w-1/2 h-full bg-gradient-to-r from-red-950 via-red-900 to-black border-r border-amber-500/20 flex items-center justify-end pr-8"
            >
              <span className="text-4xl font-black text-amber-400 tracking-widest opacity-20">CINEMA</span>
            </motion.div>

            <motion.div 
              initial={{ x: '0%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 1.8, ease: [0.77, 0, 0.175, 1] }}
              className="w-1/2 h-full bg-gradient-to-l from-red-950 via-red-900 to-black border-l border-amber-500/20 flex items-center justify-start pl-8"
            >
              <span className="text-4xl font-black text-amber-400 tracking-widest opacity-20">LOUNGE</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Countdown Overlay */}
      <AnimatePresence>
        {countdown !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center backdrop-blur-md"
          >
            <span className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-amber-400 animate-pulse">
              {countdown}
            </span>
            <span className="text-xs font-mono tracking-widest text-white/50 uppercase mt-4">Starting in Sync...</span>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="relative z-20 flex items-center justify-between px-6 py-3.5 border-b border-white/5 bg-black/40 backdrop-blur-2xl">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-tr from-violet-600 to-amber-500 rounded-xl shadow-md">
              <Video className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-black tracking-wider text-white">Sync<span className="text-violet-400">Room</span></span>
          </div>

          <motion.button 
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              navigator.clipboard.writeText(roomId);
              setCodeCopied(true);
              setTimeout(() => setCodeCopied(false), 2000);
            }} 
            className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 cursor-pointer"
          >
            <span className="text-slate-500">ROOM:</span>
            <span className="font-bold text-violet-400">{roomId}</span>
            {codeCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
          </motion.button>

          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-violet-950/80 border border-violet-800/50 text-violet-300 text-xs font-semibold">
            {role === 'host' ? <Crown className="w-3.5 h-3.5 text-amber-400" /> : <Shield className="w-3.5 h-3.5 text-cyan-400" />}
            <span className="capitalize">{role}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {MOODS.map(m => (
            <motion.button
              key={m.id}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleMoodChange(m.id)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                mood === m.id ? 'bg-violet-600 text-white shadow-lg' : 'bg-slate-900/80 text-slate-400 hover:text-white'
              }`}
            >
              {m.name}
            </motion.button>
          ))}

          <motion.button 
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowHelpModal(true)} 
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
          </motion.button>

          {role === 'host' && (
            <motion.button 
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setIsSettingsOpen(true)} 
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </motion.button>
          )}

          <motion.button 
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { socket.emit('leave_room'); onLeave(); }} 
            className="px-4 py-1.5 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-semibold cursor-pointer"
          >
            Leave
          </motion.button>
        </div>
      </header>

      {/* Main Lounge Grid */}
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Cinema Stage */}
        <div className="flex-1 flex flex-col p-6 overflow-y-auto">
          
          <div className="relative group rounded-3xl overflow-hidden border border-white/10 shadow-[0_20px_80px_rgba(124,58,237,0.25)] bg-black">
            <YouTubePlayer
              videoState={videoState}
              role={role}
              onPlay={handlePlay}
              onPause={handlePause}
              floatingReactions={reactions}
            />
          </div>

          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              {(role === 'host' || role === 'moderator') && (
                <>
                  <motion.button 
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={videoState.playState === 'playing' ? handlePause : handlePlay} 
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center space-x-1.5 cursor-pointer"
                  >
                    {videoState.playState === 'playing' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                    <span>{videoState.playState === 'playing' ? 'Pause' : 'Play'}</span>
                  </motion.button>

                  <motion.button 
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleSeek(-10)} 
                    className="p-2 bg-slate-900 text-slate-300 rounded-xl text-xs cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </motion.button>

                  <motion.button 
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleSeek(10)} 
                    className="p-2 bg-slate-900 text-slate-300 rounded-xl text-xs cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </motion.button>

                  <motion.button 
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleStartCountdown} 
                    className="px-3 py-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold flex items-center space-x-1 cursor-pointer"
                  >
                    <Timer className="w-3.5 h-3.5" />
                    <span>Countdown</span>
                  </motion.button>
                </>
              )}
            </div>

            <div className="w-full sm:w-64">
              <HypeMeter hypeCount={hypeCount} />
            </div>
          </div>

          {(role === 'host' || role === 'moderator') && (
            <form onSubmit={handleVideoChangeSubmit} className="mt-3 flex items-center space-x-2 w-full">
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="Paste YouTube Video URL..."
                className="flex-1 bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 shadow-inner"
              />
              <motion.button 
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                type="submit" 
                className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs rounded-xl shadow-lg cursor-pointer flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>Change Video</span>
              </motion.button>
            </form>
          )}

          {/* Reaction Dock */}
          <div className="mt-4 flex justify-center">
            <ReactionDock onSendReaction={handleSendReaction} disabled={!settings.canReact} />
          </div>

          <div className="mt-6">
            <CinemaSeats
              participants={participants}
              currentUserId={userId}
              typingUsers={typingUsers}
              speakingUsers={speakingUsers}
              reactions={reactions}
            />
          </div>
        </div>

        {/* Sidebar */}
        <aside className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-white/5 bg-black/60 flex flex-col">
          <div className="flex border-b border-white/5 bg-slate-950">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 border-b-2 transition-all cursor-pointer ${
                activeTab === 'chat' ? 'border-violet-500 text-violet-400 bg-violet-500/10' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat</span>
            </button>

            <button
              onClick={() => setActiveTab('queue')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 border-b-2 transition-all cursor-pointer ${
                activeTab === 'queue' ? 'border-violet-500 text-violet-400 bg-violet-500/10' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <ListVideo className="w-3.5 h-3.5" />
              <span>Queue ({queue.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('participants')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-1.5 border-b-2 transition-all cursor-pointer ${
                activeTab === 'participants' ? 'border-violet-500 text-violet-400 bg-violet-500/10' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>People ({participants.length})</span>
            </button>
          </div>

          {activeTab === 'chat' && (
            <Chat 
              ref={chatInputRef}
              messages={messages} 
              currentUsername={username} 
              onSendMessage={handleSendMessage}
              disabled={!settings.canChat}
            />
          )}

          {activeTab === 'queue' && (
            <VideoQueue
              queue={queue}
              currentRole={role}
              onAddToQueue={(url, videoId) => socket.emit('add_to_queue', { roomId, videoUrl: url, videoId, username })}
              onVote={(queueItemId) => socket.emit('vote_queue', { roomId, queueItemId })}
              onPlayNext={() => socket.emit('play_next_queue', { roomId })}
              onRemove={(queueItemId) => socket.emit('remove_from_queue', { roomId, queueItemId })}
            />
          )}

          {activeTab === 'participants' && (
            <ParticipantList
              participants={participants}
              currentUserId={userId}
              currentRole={role}
              onAssignRole={(targetId, newRole) => {
                if (newRole === 'moderator') {
                  socket.emit('promote_to_moderator', { roomId, userId: targetId });
                }
              }}
              onRemoveParticipant={(targetId) => socket.emit('remove_participant', { roomId, userId: targetId })}
              onTransferHost={(targetId) => socket.emit('transfer_host', { roomId, userId: targetId })}
            />
          )}
        </aside>
      </div>

      <AnimatePresence>
        {showHelpModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full text-slate-200"
            >
              <h3 className="font-bold text-base text-white mb-4 flex items-center space-x-2">
                <HelpCircle className="w-5 h-5 text-violet-400" />
                <span>Keyboard Shortcuts</span>
              </h3>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between bg-slate-950 p-2 rounded-xl">
                  <span className="text-slate-400">Play / Pause</span>
                  <span className="text-violet-400 font-bold">Space</span>
                </div>
                <div className="flex justify-between bg-slate-950 p-2 rounded-xl">
                  <span className="text-slate-400">Seek 10s Backward/Forward</span>
                  <span className="text-violet-400 font-bold">← / →</span>
                </div>
                <div className="flex justify-between bg-slate-950 p-2 rounded-xl">
                  <span className="text-slate-400">Focus Chat</span>
                  <span className="text-violet-400 font-bold">C</span>
                </div>
                <div className="flex justify-between bg-slate-950 p-2 rounded-xl">
                  <span className="text-slate-400">Shortcuts Help</span>
                  <span className="text-violet-400 font-bold">?</span>
                </div>
              </div>

              <button 
                onClick={() => setShowHelpModal(false)}
                className="mt-6 w-full py-2 bg-violet-600 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Got it
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <RoomSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={(newSettings) => socket.emit('update_settings', { roomId, settings: newSettings })}
      />
    </div>
  );
}