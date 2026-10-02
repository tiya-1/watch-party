import { useState } from 'react';

// UI only: messages are kept in this component and are not sent to other users yet.
export default function Chat({ username }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');

  const send = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setMessages([...messages, { name: username, text }]);
    setText('');
  };

  return (
    <div className="panel">
      <h3>Chat</h3>
      <div className="msgs">
        {messages.length === 0 && <span className="muted">No messages yet</span>}
        {messages.map((m, i) => (
          <div key={i}><b>{m.name}</b> {m.text}</div>
        ))}
      </div>
      <form onSubmit={send} className="row">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message…" />
        <button className="primary">Send</button>
      </form>
    </div>
  );
}
