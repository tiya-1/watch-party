import { useEffect, useRef, useState } from 'react';
import socket from '../socket.js';
import YouTubePlayer from './YouTubePlayer.jsx';
import ParticipantList from './ParticipantList.jsx';
import Chat from './Chat.jsx';

export default function Room({ session, onExit }) {
  const [roomId, setRoomId] = useState(session.roomId || '');
  const [meId, setMeId] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [videoInput, setVideoInput] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const playerRef = useRef(null);
  const meIdRef = useRef(null);
  const toastTimer = useRef(null);

  const myRole = participants.find((p) => p.id === meId)?.role || 'participant';
  const canControl = myRole === 'host' || myRole === 'moderator';

  const flash = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 3500);
  };

  useEffect(() => {
    const handlers = {
      sync_state: (s) => playerRef.current?.applyState(s),
      user_joined: (d) => { setParticipants(d.participants); flash(`${d.username} joined`); },
      user_left: (d) => { setParticipants(d.participants); flash(`${d.username} left`); },
      role_assigned: (d) => {
        setParticipants(d.participants);
        flash(d.userId === meIdRef.current ? `You are now ${d.role}` : `${d.username} is now ${d.role}`);
      },
      participant_removed: (d) => {
        if (d.userId === meIdRef.current) setError('You were removed from the room by the host.');
        else { setParticipants(d.participants); flash(`${d.username} was removed`); }
      },
      error_message: (d) => flash(d.message),
    };
    Object.entries(handlers).forEach(([ev, fn]) => socket.on(ev, fn));

    const onAck = (res) => {
      if (!res.ok) return setError(res.error);
      meIdRef.current = res.userId;
      setMeId(res.userId);
      setRoomId(res.roomId);
      setParticipants(res.participants);
      playerRef.current?.applyState(res.state);
      window.history.replaceState({}, '', `/?room=${res.roomId}`);
    };

    const start = () => {
      if (session.mode === 'create') socket.emit('create_room', { username: session.username }, onAck);
      else socket.emit('join_room', { roomId: session.roomId, username: session.username }, onAck);
    };
    if (socket.connected) start();
    else socket.once('connect', start);

    return () => {
      socket.emit('leave_room');
      socket.off('connect', start);
      Object.entries(handlers).forEach(([ev, fn]) => socket.off(ev, fn));
      clearTimeout(toastTimer.current);
    };
  }, []);

  const submitVideo = (e) => {
    e.preventDefault();
    if (!videoInput.trim()) return;
    socket.emit('change_video', { url: videoInput });
    setVideoInput('');
  };

  const copyLink = () => {
    navigator.clipboard?.writeText(`${window.location.origin}/?room=${roomId}`);
    flash('Invite link copied');
  };

  if (error) {
    return (
      <div className="center">
        <div className="card">
          <h2>Can't be here</h2>
          <p>{error}</p>
          <button className="primary" onClick={onExit}>Back to home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="room">
      <header>
        <div><b>Room {roomId}</b> <span className={`badge ${myRole}`}>{myRole}</span></div>
        <div className="row">
          <button onClick={copyLink}>Copy invite link</button>
          <button onClick={() => socket.emit('request_sync')}>Resync</button>
          <button className="danger" onClick={onExit}>Leave</button>
        </div>
      </header>

      <main>
        <section className="left">
          <YouTubePlayer
            ref={playerRef}
            canControl={canControl}
            onLocalEvent={(type, time) => socket.emit(type, { time })}
          />
          <div className="panel controls">
            {canControl ? (
              <form onSubmit={submitVideo} className="row">
                <input value={videoInput} onChange={(e) => setVideoInput(e.target.value)} placeholder="Paste a YouTube URL" />
                <button className="primary">Change video</button>
              </form>
            ) : (
              <p className="muted" style={{ margin: 0 }}>Only the host and moderators can control playback.</p>
            )}
          </div>
        </section>

        <aside>
          <ParticipantList
            participants={participants}
            meId={meId}
            myRole={myRole}
            onAssign={(userId, role) => socket.emit('assign_role', { userId, role })}
            onRemove={(userId) => socket.emit('remove_participant', { userId })}
            onTransfer={(userId) => window.confirm('Transfer host to this user?') && socket.emit('transfer_host', { userId })}
          />
          <Chat username={session.username} />
        </aside>
      </main>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
