import { useEffect } from 'react';

export function useKeyboardShortcuts({ isHostOrMod, onTogglePlay, onSeek, onToggleMute, onToggleFullscreen, onOpenShortcutsHelp }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing in input or textarea
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      if (e.code === 'KeyF') {
        e.preventDefault();
        onToggleFullscreen?.();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        onToggleMute?.();
      } else if (e.key === '?') {
        e.preventDefault();
        onOpenShortcutsHelp?.();
      }

      if (isHostOrMod) {
        if (e.code === 'Space') {
          e.preventDefault();
          onTogglePlay?.();
        } else if (e.code === 'ArrowRight') {
          e.preventDefault();
          onSeek?.(5);
        } else if (e.code === 'ArrowLeft') {
          e.preventDefault();
          onSeek?.(-5);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHostOrMod, onTogglePlay, onSeek, onToggleMute, onToggleFullscreen, onOpenShortcutsHelp]);
}