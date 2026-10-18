import React, { useState, useEffect } from 'react';
import { X, Lock, Unlock, MessageSquare, Shield, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function RoomSettingsModal({ isOpen, onClose, settings, onSave }) {
  const [localSettings, setLocalSettings] = useState({
    canChat: true,
    canReact: true,
    canRequestChanges: true,
    isLocked: false,
    ...settings
  });

  useEffect(() => {
    if (settings) {
      setLocalSettings({
        canChat: settings.canChat ?? true,
        canReact: settings.canReact ?? true,
        canRequestChanges: settings.canRequestChanges ?? true,
        isLocked: Boolean(settings.isLocked)
      });
    }
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleToggle = (key) => {
    const updated = { 
      ...localSettings, 
      [key]: key === 'isLocked' ? !localSettings.isLocked : !localSettings[key] 
    };
    setLocalSettings(updated);
    onSave(updated);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full text-slate-200 shadow-2xl"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <h3 className="font-bold text-base text-white flex items-center space-x-2">
            <Shield className="w-5 h-5 text-violet-400" />
            <span>Host Lounge Settings</span>
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Room Lock Toggle */}
          <div className="flex items-center justify-between bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-xl ${localSettings.isLocked ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                {localSettings.isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Lock Room</h4>
                <p className="text-[10px] text-slate-400">Prevent new participants from joining</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={Boolean(localSettings.isLocked)}
              onChange={() => handleToggle('isLocked')}
              className="w-4 h-4 accent-violet-600 cursor-pointer"
            />
          </div>

          {/* Chat Toggle */}
          <div className="flex items-center justify-between bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-violet-500/20 text-violet-400">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Allow Chat</h4>
                <p className="text-[10px] text-slate-400">Let participants send messages</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={localSettings.canChat ?? true}
              onChange={() => handleToggle('canChat')}
              className="w-4 h-4 accent-violet-600 cursor-pointer"
            />
          </div>

          {/* Reactions Toggle */}
          <div className="flex items-center justify-between bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Allow Reactions</h4>
                <p className="text-[10px] text-slate-400">Let participants send emojis & hype</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={localSettings.canReact ?? true}
              onChange={() => handleToggle('canReact')}
              className="w-4 h-4 accent-violet-600 cursor-pointer"
            />
          </div>
        </div>

        <button 
          onClick={onClose}
          className="mt-6 w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-lg transition-all"
        >
          Save & Close
        </button>
      </motion.div>
    </div>
  );
}