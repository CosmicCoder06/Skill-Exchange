import { useState } from 'react';

export default function GoogleMeetLink({ booking, token, currentUserId }) {
  const [link, setLink] = useState(booking.meetingUrl || '');
  const [saved, setSaved] = useState(booking.meetingUrl || '');
  const [editing, setEditing] = useState(!booking.meetingUrl);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const isMentor = String(booking.mentor?._id || booking.mentor) === String(currentUserId);
  async function save(e) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/bookings/${booking._id}/meeting`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ meetingUrl: link }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to save meeting link');
      setSaved(data.meetingUrl); setEditing(false);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <section className="receipt-meeting" aria-label="Google Meet">
    <span className="receipt-label">VIDEO SESSION</span>
    {saved && <a className="join-session-button" href={saved} target="_blank" rel="noopener noreferrer">Join Google Meet ↗</a>}
    {!saved && !isMentor && <p>Your mentor will add the Google Meet link here.</p>}
    {isMentor && !editing && <button className="receipt-edit-link" onClick={() => setEditing(true)}>Edit meeting link</button>}
    {isMentor && editing && <form onSubmit={save}>
      <a href="https://meet.google.com/" target="_blank" rel="noopener noreferrer">Create a Google Meet ↗</a>
      <p>Choose “Create a meeting for later”, then paste its link below.</p>
      <label htmlFor={`meet-${booking._id}`}>Google Meet link</label>
      <input id={`meet-${booking._id}`} type="url" required value={link} onChange={e => setLink(e.target.value)} placeholder="https://meet.google.com/abc-defg-hij" />
      <button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save meeting link'}</button>
      {error && <p role="alert">{error}</p>}
    </form>}
  </section>;
}
