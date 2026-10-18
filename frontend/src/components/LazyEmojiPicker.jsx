import React, { lazy, Suspense } from 'react';

const Picker = lazy(() => import('emoji-picker-react'));

export default function LazyEmojiPicker({ onEmojiSelect }) {
  return (
    <Suspense fallback={<div className="p-4 text-xs text-slate-400 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">Loading emojis...</div>}>
      <Picker
        onEmojiClick={(emojiObject) => onEmojiSelect(emojiObject.emoji)}
        theme="dark"
        height={350}
        width={300}
      />
    </Suspense>
  );
}