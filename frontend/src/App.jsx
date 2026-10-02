import { useState } from 'react';
import Home from './components/Home.jsx';
import Room from './components/Room.jsx';

export default function App() {
  const [session, setSession] = useState(null); // { mode, username, roomId? }
  return session ? (
    <Room key={`${session.mode}-${session.roomId || 'new'}`} session={session} onExit={() => { window.history.replaceState({}, '', '/'); setSession(null); }} />
  ) : (
    <Home onStart={setSession} />
  );
}
