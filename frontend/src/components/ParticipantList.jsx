export default function ParticipantList({ participants, meId, myRole, onAssign, onRemove, onTransfer }) {
  const isHost = myRole === 'host';
  return (
    <div className="panel">
      <h3>Participants ({participants.length})</h3>
      <ul className="plist">
        {participants.map((p) => (
          <li key={p.id}>
            <div className="pname">
              <span>{p.username}{p.id === meId && ' (you)'}</span>
              <span className={`badge ${p.role}`}>{p.role}</span>
            </div>
            {isHost && p.id !== meId && (
              <div className="pactions">
                <select value={p.role} onChange={(e) => onAssign(p.id, e.target.value)}>
                  <option value="participant">participant</option>
                  <option value="moderator">moderator</option>
                </select>
                <button className="small" onClick={() => onTransfer(p.id)} title="Make this person the host">👑</button>
                <button className="small danger" onClick={() => onRemove(p.id)} title="Remove from room">✕</button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
