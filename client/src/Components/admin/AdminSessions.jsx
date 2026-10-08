import { useState, useEffect } from "react";
import { Calendar, Clock, Video, Filter } from "lucide-react";
import { getAdminSessions } from "../../services/adminService";

export default function AdminSessions({ token }) {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [paymentFilter, setPaymentFilter] = useState("all");

    async function loadSessions() {
        setLoading(true);
        setError("");
        try {
            const params = {};
            if (statusFilter !== "all") params.status = statusFilter;
            if (paymentFilter !== "all") params.paymentStatus = paymentFilter;

            const res = await getAdminSessions(token, params);
            setSessions(res.sessions || []);
        } catch (err) {
            setError(err?.message || "Failed to load sessions");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (token) loadSessions();
    }, [token, statusFilter, paymentFilter]);

    return (
        <section className="admin-content-section">
            <div className="admin-section-heading">
                <div>
                    <p className="admin-eyebrow">{sessions.length} RECORDED SESSIONS</p>
                    <h2>Platform Sessions & Bookings</h2>
                </div>
                <button type="button" className="admin-outline-button" onClick={loadSessions}>
                    ↻ Refresh
                </button>
            </div>

            <div className="admin-users-panel">
                <div className="admin-users-toolbar">
                    <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#617b70", fontSize: 13, fontWeight: 600 }}>
                        <Filter size={15} />
                        <span>Filter:</span>
                    </div>

                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="all">All Session Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="accepted">Accepted</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="rejected">Rejected</option>
                    </select>

                    <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
                        <option value="all">All Payment Statuses</option>
                        <option value="awaiting_payment">Awaiting Payment</option>
                        <option value="payment_submitted">Payment Submitted</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="rejected">Rejected</option>
                        <option value="paid_out">Paid Out</option>
                        <option value="refunded">Refunded</option>
                    </select>
                </div>

                {loading ? (
                    <div className="admin-loading">
                        <div className="admin-spinner" />
                        <p>Loading platform sessions...</p>
                    </div>
                ) : error ? (
                    <div className="admin-error-box" style={{ padding: 24, textAlign: "center" }}>
                        <p style={{ color: "#dc2626" }}>{error}</p>
                    </div>
                ) : !sessions.length ? (
                    <div className="admin-empty-table" style={{ padding: 40, textAlign: "center" }}>
                        <p>No sessions match the selected filter criteria.</p>
                    </div>
                ) : (
                    <div className="admin-table-wrap">
                        <table className="admin-users-table">
                            <thead>
                                <tr>
                                    <th>Mentor</th>
                                    <th>Learner</th>
                                    <th>Date & Time</th>
                                    <th>Duration</th>
                                    <th>Session Status</th>
                                    <th>Payment Status</th>
                                    <th>Meeting Link</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sessions.map((s) => (
                                    <tr key={s._id}>
                                        <td><strong>{s.mentor?.name || "Mentor"}</strong><br/><small style={{ color: "#64748b" }}>{s.mentor?.email}</small></td>
                                        <td><strong>{s.learner?.name || "Learner"}</strong><br/><small style={{ color: "#64748b" }}>{s.learner?.email}</small></td>
                                        <td><Calendar size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />{s.date} {s.time}</td>
                                        <td>{s.duration || 60}m</td>
                                        <td><span className={`status-tag ${s.status}`}>{s.status}</span></td>
                                        <td><span className="payment-tag">{s.paymentStatus || s.payment?.status || "—"}</span></td>
                                        <td>
                                            {s.meetingUrl ? (
                                                <a href={s.meetingUrl} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#176b4e", fontWeight: 650 }}>
                                                    <Video size={13} /> Link
                                                </a>
                                            ) : (
                                                <span style={{ color: "#94a3b8" }}>—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </section>
    );
}
