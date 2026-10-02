import { useState } from 'react';

export default function Home({ onStart }) {
  const prefill = new URLSearchParams(window.location.search).get('room') || '';
  const [username, setUsername] = useState(localStorage.getItem('wp_name') || '');
  const [code, setCode] = useState(prefill.toUpperCase());

  const go = (mode) => {
    const name = username.trim();
    if (!name) return alert('Enter a username first');
    if (mode === 'join' && !code.trim()) return alert('Enter a room code');
    localStorage.setItem('wp_name', name);
    onStart({ mode, username: name, roomId: code.trim().toUpperCase() });
  };

  return (
    <div className="center">
      <div className="card home">
        <h1>🎬 Watch Party</h1>
        <p className="muted">Watch YouTube together, perfectly in sync.</p>
        <input placeholder="Your name" value={username} maxLength={24} onChange={(e) => setUsername(e.target.value)} />
        <button className="primary" onClick={() => go('create')}>Create a room</button>
        <div className="divider"><span>or join one</span></div>
        <input placeholder="Room code" value={code} maxLength={6} onChange={(e) => setCode(e.target.value.toUpperCase())} />
        <button onClick={() => go('join')}>Join room</button>
      </div>
    </div>
  );
}
