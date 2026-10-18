import React, { useState, useEffect } from 'react';
import { Home } from './components/Home';
import { Room } from './components/Room';
import { AuthModal } from './components/AuthModal';
import { socket } from './lib/socket';

export function App() {
  const [roomData, setRoomData] = useState(() => {
    const saved = sessionStorage.getItem('syncroom_data');
    return saved ? JSON.parse(saved) : null;
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const name = localStorage.getItem('username');
    return name ? { username: name } : null;
  });

  const [isAuthOpen, setIsAuthOpen] = useState(false);

  useEffect(() => {
    if (roomData) {
      sessionStorage.setItem('syncroom_data', JSON.stringify(roomData));
      const newUrl = `${window.location.pathname}?room=${roomData.roomId}`;
      window.history.replaceState({ path: newUrl }, '', newUrl);
    } else {
      sessionStorage.removeItem('syncroom_data');
      window.history.replaceState({ path: window.location.pathname }, '', window.location.pathname);
    }
  }, [roomData]);

  useEffect(() => {
    const handleAuthChange = () => {
      const name = localStorage.getItem('username');
      setCurrentUser(name ? { username: name } : null);
    };

    window.addEventListener('auth-changed', handleAuthChange);
    return () => window.removeEventListener('auth-changed', handleAuthChange);
  }, []);

  const handleJoin = (data) => {
    // Agar local storage mein username na mile toh Guest assign karo
    if (!localStorage.getItem('username')) {
      const guestName = `Guest_${Math.floor(1000 + Math.random() * 9000)}`;
      localStorage.setItem('username', guestName);
      localStorage.setItem('userId', `usr_guest_${Date.now()}`);
    }
    setRoomData(data);
  };

  const handleLeave = () => {
    socket.emit('leave_room');
    setRoomData(null);
  };

  const handleAuthSuccess = (userObj) => {
    const name = userObj?.username || localStorage.getItem('username');
    setCurrentUser({ username: name });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    setCurrentUser(null);
    window.dispatchEvent(new Event('auth-changed'));
  };

  return (
    <div className="min-h-screen bg-[#05060A] text-slate-100 flex flex-col">
      {!roomData ? (
        <Home 
          onJoin={handleJoin} 
          currentUser={currentUser}
          onOpenAuth={() => setIsAuthOpen(true)} 
          onLogout={handleLogout}
        />
      ) : (
        <Room roomData={roomData} onLeave={handleLeave} />
      )}

      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        onAuthSuccess={handleAuthSuccess} 
      />
    </div>
  );
}

export default App;