import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

let ytPromise;
function loadYT() {
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (!ytPromise) {
    ytPromise = new Promise((resolve) => {
      window.onYouTubeIframeAPIReady = () => resolve(window.YT);
      const s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(s);
    });
  }
  return ytPromise;
}

/**
 * Wraps the YouTube IFrame API.
 *  - ref.applyState(state): apply remote state (server -> player)
 *  - onLocalEvent(type, time): user-initiated play/pause/seek (player -> server), only if canControl
 * `remoteRef` suppresses events fired by our own programmatic changes (prevents echo loops).
 */
const YouTubePlayer = forwardRef(function YouTubePlayer({ canControl, onLocalEvent }, ref) {
  const mountRef = useRef(null);
  const playerRef = useRef(null);
  const readyRef = useRef(false);
  const pendingRef = useRef(null);
  const remoteRef = useRef(false);
  const remoteTimer = useRef(null);
  const canControlRef = useRef(canControl);
  const cbRef = useRef(onLocalEvent);
  const lastRef = useRef({ time: 0, ts: Date.now() });
  const playingRef = useRef(false);
  canControlRef.current = canControl;
  cbRef.current = onLocalEvent;

  const apply = (s) => {
    const p = playerRef.current;
    if (!readyRef.current || !p) { pendingRef.current = s; return; }
    const YT = window.YT;

    remoteRef.current = true;
    clearTimeout(remoteTimer.current);
    remoteTimer.current = setTimeout(() => { remoteRef.current = false; }, 1500);

    const t = s.currentTime || 0;
    const playing = s.playState === 'playing';
    playingRef.current = playing;
    const currentId = p.getVideoData?.().video_id;

    if (currentId !== s.videoId) {
      if (playing) p.loadVideoById({ videoId: s.videoId, startSeconds: t });
      else p.cueVideoById({ videoId: s.videoId, startSeconds: t });
    } else {
      if (Math.abs(p.getCurrentTime() - t) > 1.5) p.seekTo(t, true);
      const st = p.getPlayerState();
      if (playing) {
        if (st !== YT.PlayerState.PLAYING && st !== YT.PlayerState.BUFFERING) p.playVideo();
      } else {
        p.pauseVideo();
      }
    }
    lastRef.current = { time: t, ts: Date.now() };
  };

  useImperativeHandle(ref, () => ({ applyState: apply }));

  useEffect(() => {
    let cancelled = false;
    loadYT().then((YT) => {
      if (cancelled) return;
      playerRef.current = new YT.Player(mountRef.current, {
        width: '100%',
        height: '100%',
        playerVars: { rel: 0, playsinline: 1, origin: window.location.origin },
        events: {
          onReady: () => {
            readyRef.current = true;
            if (pendingRef.current) { apply(pendingRef.current); pendingRef.current = null; }
          },
          onStateChange: (e) => {
            if (remoteRef.current || !canControlRef.current) return;
            const t = playerRef.current.getCurrentTime();
            if (e.data === YT.PlayerState.PLAYING) { playingRef.current = true; cbRef.current('play', t); }
            else if (e.data === YT.PlayerState.PAUSED) { playingRef.current = false; cbRef.current('pause', t); }
          },
        },
      });
    });

    // YouTube has no "seeked" event, so detect scrubbing: current time jumps vs. expected time.
    const timer = setInterval(() => {
      const p = playerRef.current;
      if (!readyRef.current || !p) return;
      const cur = p.getCurrentTime();
      const now = Date.now();
      const last = lastRef.current;
      const expected = last.time + (playingRef.current ? (now - last.ts) / 1000 : 0);
      if (!remoteRef.current && canControlRef.current && Math.abs(cur - expected) > 2) cbRef.current('seek', cur);
      lastRef.current = { time: cur, ts: now };
    }, 1000);

    return () => {
      cancelled = true;
      clearInterval(timer);
      clearTimeout(remoteTimer.current);
      try { playerRef.current?.destroy(); } catch { /* ignore */ }
    };
  }, []);

  return (
    <div className="player-box">
      <div className="player-inner"><div ref={mountRef} /></div>
      {/* Blocks clicks so participants cannot control the shared video */}
      {!canControl && <div className="player-block" title="Only the host and moderators can control playback" />}
    </div>
  );
});

export default YouTubePlayer;
