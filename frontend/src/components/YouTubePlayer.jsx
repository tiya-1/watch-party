import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function YouTubePlayer({ videoState, role, onPlay, onPause, floatingReactions }) {
  const playerRef = useRef(null);
  const playerInstanceRef = useRef(null);
  const currentVideoIdRef = useRef(videoState.videoId);

  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        createPlayer();
      };
    } else if (window.YT && window.YT.Player) {
      createPlayer();
    }

    return () => {
      if (playerInstanceRef.current && typeof playerInstanceRef.current.destroy === 'function') {
        playerInstanceRef.current.destroy();
        playerInstanceRef.current = null;
      }
    };
  }, []);

  const createPlayer = () => {
    if (playerInstanceRef.current || !playerRef.current) return;

    playerInstanceRef.current = new window.YT.Player(playerRef.current, {
      height: '100%',
      width: '100%',
      videoId: videoState.videoId || 'M7lc1UVf-VE',
      playerVars: {
        autoplay: 1,
        controls: 1,
        modestbranding: 1,
        rel: 0,
      },
      events: {
        onStateChange: (event) => {
          if (role === 'host') {
            if (event.data === window.YT.PlayerState.PLAYING && onPlay) {
              onPlay();
            } else if (event.data === window.YT.PlayerState.PAUSED && onPause) {
              onPause();
            }
          }
        }
      }
    });
  };

  useEffect(() => {
    if (!playerInstanceRef.current || !playerInstanceRef.current.loadVideoById) return;

    const player = playerInstanceRef.current;
    const targetVideoId = videoState.videoId || 'M7lc1UVf-VE';

    try {
      if (currentVideoIdRef.current !== targetVideoId) {
        currentVideoIdRef.current = targetVideoId;
        player.loadVideoById(targetVideoId, videoState.currentTime || 0);
        return;
      }

      const playerState = player.getPlayerState();
      if (videoState.playState === 'playing' && playerState !== window.YT.PlayerState.PLAYING) {
        player.playVideo();
      } else if (videoState.playState === 'paused' && playerState === window.YT.PlayerState.PLAYING) {
        player.pauseVideo();
      }

      if (typeof videoState.currentTime === 'number') {
        const playerTime = player.getCurrentTime ? player.getCurrentTime() : 0;
        if (Math.abs(playerTime - videoState.currentTime) > 2) {
          player.seekTo(videoState.currentTime, true);
        }
      }
    } catch (err) {
      console.error('Player sync error:', err);
    }
  }, [videoState]);

  return (
    <div className="relative w-full aspect-video rounded-3xl overflow-hidden border border-slate-800/90 shadow-[0_0_50px_rgba(124,58,237,0.15)] bg-black">
      <div ref={playerRef} className="w-full h-full" />

      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
        <AnimatePresence>
          {floatingReactions.map((reaction) => (
            <motion.div
              key={reaction.id}
              initial={{ y: 250, opacity: 0, scale: 0.5 }}
              animate={{ y: -90, opacity: 1, scale: 1.4 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.8, ease: "easeOut" }}
              style={{ left: `${reaction.left}%` }}
              className="absolute bottom-6 flex flex-col items-center"
            >
              <span className="text-4xl drop-shadow-[0_0_18px_rgba(255,255,255,0.9)]">{reaction.emoji}</span>
              <span className="text-[10px] font-mono text-white/90 bg-slate-950/80 border border-slate-700 px-2 py-0.5 rounded-full backdrop-blur-md mt-1">
                {reaction.username}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}