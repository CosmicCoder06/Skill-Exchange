import { useState, useEffect } from 'react';
import { Video, ExternalLink, Edit2, AlertCircle } from 'lucide-react';

export default function GoogleMeetLink({ booking, token, currentUserId, onLinkSaved }) {
    const [link, setLink] = useState(booking.meetingUrl || '');
    const [saved, setSaved] = useState(booking.meetingUrl || '');
    const [editing, setEditing] = useState(!booking.meetingUrl);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        setLink(booking.meetingUrl || '');
        setSaved(booking.meetingUrl || '');
        setEditing(!booking.meetingUrl);
    }, [booking.meetingUrl]);

    const isMentor = String(booking.mentor?._id || booking.mentor?.id || booking.mentor) === String(currentUserId);

    async function save(e) {
        e.preventDefault();
        setBusy(true);
        setError('');
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/bookings/${booking._id}/meeting`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ meetingUrl: link })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Unable to save meeting link');
            }
            setSaved(data.meetingUrl);
            setEditing(false);
            if (onLinkSaved) {
                onLinkSaved(data.meetingUrl);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    }

    return (
        <section className="video-session-card" aria-label="Google Meet Video Session">
            {/* Header: Label and optional Edit button */}
            <div className="video-session-header">
                <div className="video-session-kicker">
                    <Video size={15} />
                    <span>Video Session</span>
                </div>
                {isMentor && saved && !editing && (
                    <button
                        type="button"
                        className="video-edit-btn"
                        onClick={() => setEditing(true)}
                    >
                        <Edit2 size={12} />
                        <span>Edit Link</span>
                    </button>
                )}
            </div>

            {/* Saved Link: Join Button */}
            {saved && !editing && (
                <div className="video-join-container">
                    <a
                        className="video-join-meet-btn"
                        href={saved}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Video size={16} />
                        <span>Join Google Meet ↗</span>
                    </a>
                    <span className="video-link-preview">{saved}</span>
                </div>
            )}

            {/* Awaiting Mentor Notice for Learner */}
            {!saved && !isMentor && (
                <div className="video-awaiting-notice">
                    <p>Your mentor will add the Google Meet link before the session starts.</p>
                </div>
            )}

            {/* Form for Mentor (when editing or link not yet added) */}
            {isMentor && editing && (
                <form className="video-meet-form" onSubmit={save}>
                    <div className="video-form-header">
                        <span className="video-form-title">
                            {saved ? "Update Google Meet Link" : "Add Google Meet Link"}
                        </span>
                        <a
                            href="https://meet.google.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="video-create-link"
                        >
                            <ExternalLink size={12} />
                            <span>Create a Meet ↗</span>
                        </a>
                    </div>

                    <p className="video-form-hint">
                        Choose &ldquo;Create a meeting for later&rdquo; on Google Meet, then paste the link here.
                    </p>

                    <div className="video-form-inputs">
                        <label htmlFor={`meet-${booking._id}`} className="video-input-label">
                            Meeting URL
                        </label>
                        <input
                            id={`meet-${booking._id}`}
                            type="url"
                            required
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                            placeholder="https://meet.google.com/abc-defg-hij"
                            className="video-url-input"
                        />
                    </div>

                    <div className="video-form-actions">
                        <button
                            type="submit"
                            disabled={busy}
                            className="video-submit-btn"
                        >
                            {busy ? "Saving…" : (saved ? "Update Link" : "Save Meeting Link")}
                        </button>
                        {saved && (
                            <button
                                type="button"
                                disabled={busy}
                                onClick={() => {
                                    setEditing(false);
                                    setLink(saved);
                                }}
                                className="video-cancel-btn"
                            >
                                Cancel
                            </button>
                        )}
                    </div>

                    {error && (
                        <div className="video-error-alert" role="alert">
                            <AlertCircle size={14} />
                            <span>{error}</span>
                        </div>
                    )}
                </form>
            )}
        </section>
    );
}
