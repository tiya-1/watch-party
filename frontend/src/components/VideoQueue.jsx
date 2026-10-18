import React, { useState } from 'react';
import { Play, ThumbsUp, Trash2, Plus, ListVideo, Film } from 'lucide-react';
import { motion } from 'framer-motion';

export function VideoQueue({ queue, currentRole, onAddToQueue, onVote, onPlayNext, onRemove }) {
  const [urlInput, setUrlInput] = useState('');

  const extractVideoId = (url) => {
    const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
    return (match && match[2].length === 11) ? match[2] : url;
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    const videoId = extractVideoId(urlInput.trim());
    onAddToQueue(urlInput.trim(), videoId);
    setUrlInput('');
  };

  return (
    <div className="flex-1 flex flex-col p-4 bg-[#080a14] overflow-hidden">
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center space-x-2 text-violet-400 font-bold text-xs uppercase tracking-wider">
          <ListVideo className="w-4 h-4" />
          <span>Room Queue ({queue?.length || 0})</span>
        </div>

        {(currentRole === 'host' || currentRole === 'moderator') && queue && queue.length > 0 && (
          <button
            onClick={() => onPlayNext()}
            className="px-3 py-1 bg-gradient-to-r from-violet-600 to-amber-500 hover:opacity-90 text-white rounded-xl text-[10px] font-bold flex items-center space-x-1 cursor-pointer"
          >
            <Play className="w-3 h-3 fill-white" />
            <span>Play Top Next</span>
          </button>
        )}
      </div>

      {/* Input to suggest video */}
      <form onSubmit={handleAdd} className="mt-3 flex items-center space-x-2">
        <input
          type="text"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="Paste YouTube Link to Suggest..."
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
        />
        <button type="submit" className="p-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl cursor-pointer">
          <Plus className="w-4 h-4" />
        </button>
      </form>

      {/* Queue List */}
      <div className="flex-1 overflow-y-auto mt-4 space-y-2 pr-1">
        {(!queue || queue.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-xs space-y-2">
            <Film className="w-8 h-8 opacity-40" />
            <span>No videos in queue. Suggest one above!</span>
          </div>
        ) : (
          queue.map((item, index) => (
            <motion.div 
              key={item.id || index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between bg-slate-900/80 border border-slate-800/80 p-2.5 rounded-2xl"
            >
              <div className="flex items-center space-x-3 truncate">
                {item.thumbnailUrl ? (
                  <img src={item.thumbnailUrl} alt={item.title} className="w-14 h-10 object-cover rounded-xl border border-slate-700 flex-shrink-0" />
                ) : (
                  <div className="w-14 h-10 bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0 text-slate-500">
                    <Film className="w-4 h-4" />
                  </div>
                )}
                <div className="truncate text-xs">
                  <p className="font-semibold text-slate-200 truncate">{item.title || `Video ID: ${item.videoId}`}</p>
                  <p className="text-[10px] text-slate-500">Added by {item.addedBy || 'User'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-1.5 pl-2 flex-shrink-0">
                <button
                  onClick={() => onVote(item.id)}
                  className="flex items-center space-x-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] font-mono cursor-pointer"
                >
                  <ThumbsUp className="w-3 h-3 text-amber-400" />
                  <span>{Array.isArray(item.votes) ? item.votes.length : (item.votes || 0)}</span>
                </button>

                {(currentRole === 'host' || currentRole === 'moderator') && (
                  <button
                    onClick={() => onRemove(item.id)}
                    className="p-1.5 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 rounded-xl transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}