import React, { useState, forwardRef } from 'react';
import { Send, MessageSquare, Smile } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EMOJI_CATEGORIES = {
  'Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😋', '😛', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', 'cry', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', 'chuckle', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', 'rolleyes', '🙄', '😯', 'frown', '😦', '😧', 'openmouth', '😮', '😲', 'yawn', '😴', 'drool', 'sleepy', 'dizzy', 'zany', 'neerd', 'sunglasses', 'cowboy', 'clown', 'skull', 'ghost', 'alien', 'robot', 'poop', 'cat', 'dog', 'monkey', 'unicorn'],
  'Gestures': ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🦷', 'bone', 'eyes', 'eye', 'tongue', 'mouth', 'kiss', 'heart', 'brokenheart', 'fire', 'sparkles', 'star', 'trophy', 'medal', 'crown', 'gem'],
  'Objects & Symbols': ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🥊', '🥋', '🛹', '🛼', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🎮', '🕹️', '🎰', '🎲', '🧩', '🧸', '🪅', '🪄', '🔮', '🧿', '🎮', '🎧', '🎤', '🎬', '🎨', '📚', '📖', '📌', '📎', '🔗', '🔒', '🔓', '🔑', '🗝️', '🔨', '⛏️', '⚒️', '🛠️', '⚙️', '🧱', '⛓️', '🧲', '🔫', '💣', '🧨', '🪓', '🔪', '🗡️', '⚔️', 'shield', '🚬', '⚰️', '🪦', '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '⚗️', '🔭', '🔬', '🕳️', '🩹', '🩺', '💊', '💉', '🚪', '🛏️', '🛋️', 'toilet', 'shower', 'bathtub', '🪒', '🧷', 'broom', 'basket', 'tp', 'soap', 'sponge', 'bucket', 'bell']
};

export const Chat = forwardRef(({ messages, currentUsername, onSendMessage, disabled }, ref) => {
  const [inputMessage, setInputMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Smileys');

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || disabled) return;
    onSendMessage(inputMessage.trim());
    setInputMessage('');
    setShowEmojiPicker(false);
  };

  const handleEmojiClick = (emoji) => {
    setInputMessage((prev) => prev + emoji);
    ref?.current?.focus();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#080a14] overflow-hidden relative">
      {/* Chat Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {(!messages || messages.length === 0) ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs space-y-2">
            <MessageSquare className="w-8 h-8 opacity-40 animate-pulse" />
            <span>No messages yet. Say hello! 👋</span>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isSystem = msg.system || msg.username === 'System';
            const isSelf = msg.username === currentUsername;

            if (isSystem) {
              return (
                <div key={msg.id || index} className="text-center my-1.5">
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-800 shadow-sm">
                    ✨ {msg.text}
                  </span>
                </div>
              );
            }

            return (
              <motion.div 
                key={msg.id || index}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center space-x-1.5 mb-1">
                  <span className="text-[10px] font-bold text-slate-400">👤 {msg.username}</span>
                  <span className="text-[9px] text-slate-600 font-mono">
                    {new Date(msg.createdAt || msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className={`px-3 py-2 rounded-2xl text-xs max-w-[85%] break-words ${
                  isSelf 
                    ? 'bg-violet-600 text-white rounded-tr-none shadow-md shadow-violet-900/20' 
                    : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Comprehensive Full Emoji Picker Box */}
      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div 
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className="absolute bottom-16 left-3 right-3 bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl z-40 backdrop-blur-md flex flex-col h-56 overflow-hidden"
          >
            {/* Category Header Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-950 px-2 pt-2">
              {Object.keys(EMOJI_CATEGORIES).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`flex-1 pb-2 text-[10px] font-bold uppercase transition-colors cursor-pointer border-b-2 ${
                    activeCategory === cat ? 'border-violet-500 text-violet-400' : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Emoji Grid */}
            <div className="flex-1 overflow-y-auto p-3 grid grid-cols-8 gap-2">
              {EMOJI_CATEGORIES[activeCategory].map((emoji, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleEmojiClick(emoji)}
                  className="text-xl hover:scale-125 transition-transform p-1.5 flex items-center justify-center bg-slate-800/40 hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Input Bar */}
      <form onSubmit={handleSend} className="p-3 bg-slate-950 border-t border-white/5 flex items-center space-x-2 relative">
        <button
          type="button"
          onClick={() => setShowEmojiPicker((prev) => !prev)}
          className={`p-2 transition-colors rounded-xl hover:bg-slate-900 cursor-pointer ${showEmojiPicker ? 'text-amber-400 bg-slate-900' : 'text-slate-400 hover:text-amber-400'}`}
          title="Open Emoji Picker"
        >
          <Smile className="w-4 h-4" />
        </button>

        <input
          ref={ref}
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder={disabled ? "Chat is disabled by host 🔒" : "Type a message... 💬"}
          disabled={disabled}
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 shadow-inner disabled:opacity-50"
        />
        
        <button
          type="submit"
          disabled={disabled || !inputMessage.trim()}
          className="p-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl shadow cursor-pointer transition-all"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
});

Chat.displayName = 'Chat';