import { useState, useEffect } from "react";
import {
    Users,
    ShieldCheck,
    GraduationCap,
    BookOpen,
    CalendarCheck2,
    CreditCard,
    ArrowUpRight,
    Download,
    FileSpreadsheet,
    Shield,
    ExternalLink,
    AlertCircle,
    CheckCircle,
    Calendar,
    ArrowRight
} from "lucide-react";
import {
    getAdminStats,
    downloadPaymentLedger
} from "../../services/adminService";

function StatCard({
    value,
    title,
    description,
    featured = false,
    tone = "",
    icon: Icon,
    onClick,
}) {
    return (
        <button
            type="button"
            className={`admin-stat-card ${
                featured ? "featured" : ""
            } ${tone}`}
            onClick={onClick}
        >
            <div className="admin-stat-top-row">
                <span className="admin-stat-icon-wrap">
                    {Icon ? <Icon size={18} strokeWidth={2.2} /> : null}
                </span>
                <span className="admin-stat-arrow">
                    <ArrowUpRight size={16} strokeWidth={2.2} />
                </span>
            </div>

            <strong className="admin-stat-number">
                {Number(value) || 0}
            </strong>

            <div className="admin-stat-content">
                <h3>{title}</h3>
                <p>{description}</p>
            </div>
        </button>
    );
}

export default function AdminOverview({
    overview,
    token,
    onOpenUsers,
    onOpenReports,
    onOpenPayments,
    onOpenSessions,
    onViewUser,
}) {
    const [statsData, setStatsData] = useState(null);
    const [loadingStats, setLoadingStats] = useState(true);
    const [downloadingCsv, setDownloadingCsv] = useState(false);
    const [downloadError, setDownloadError] = useState("");

    async function loadStats() {
        if (!token) return;
        setLoadingStats(true);
        try {
            const data = await getAdminStats(token);
            setStatsData(data);
        } catch (err) {
            console.error("Unable to load stats:", err);
        } finally {
            setLoadingStats(false);
        }
    }

    useEffect(() => {
        loadStats();
    }, [token]);

    async function handleExportCsv() {
        if (!token || downloadingCsv) return;
        setDownloadingCsv(true);
        setDownloadError("");
        try {
            await downloadPaymentLedger(token);
        } catch (err) {
            setDownloadError(err?.message || "Failed to download ledger CSV.");
        } finally {
            setDownloadingCsv(false);
        }
    }

    const stats = statsData?.stats || overview?.stats || {};
    const recentMembers = statsData?.recentMembers || overview?.recentUsers || [];
    const recentPayments = statsData?.recentPayments || statsData?.pendingPayments || [];
    const recentSessions = statsData?.recentSessions || [];

    const totalUsers = stats.totalUsers || 0;
    const mentors = stats.mentors || 0;
    const learners = stats.learners || 0;
    const pendingVerification = stats.pendingVerification || 0;
    const awaitingPayments = stats.awaitingPayments || 0;
    const totalSessions = stats.totalSessions || 0;

    return (
        <section className="admin-overview">
            {/* Quick Actions Bar */}
            <div className="admin-quick-actions-bar">
                <div className="admin-quick-actions-left">
                    <span className="admin-quick-actions-label">QUICK ACTIONS</span>
                    <div className="admin-quick-actions-buttons">
                        <button
                            type="button"
                            className="admin-quick-action-btn primary"
                            onClick={onOpenPayments}
                        >
                            <CreditCard size={15} />
                            <span>Payments & Revenue</span>
                            {awaitingPayments > 0 && (
                                <span className="admin-action-badge">{awaitingPayments} pending</span>
                            )}
                        </button>

                        <button
                            type="button"
                            className="admin-quick-action-btn"
                            onClick={onOpenUsers}
                        >
                            <Users size={15} />
                            <span>Manage Members</span>
                        </button>

                        {onOpenSessions && (
                            <button
                                type="button"
                                className="admin-quick-action-btn"
                                onClick={onOpenSessions}
                            >
                                <Calendar size={15} />
                                <span>Platform Sessions</span>
                            </button>
                        )}

                        <button
                            type="button"
                            className="admin-quick-action-btn"
                            onClick={onOpenReports}
                        >
                            <FileSpreadsheet size={15} />
                            <span>Platform Reports</span>
                        </button>
                    </div>
                </div>

                <div className="admin-quick-actions-right">
                    <button
                        type="button"
                        className="admin-quick-action-btn outline"
                        onClick={handleExportCsv}
                        disabled={downloadingCsv}
                        title="Download detailed payment & transaction ledger in CSV format"
                    >
                        <Download size={14} />
                        <span>{downloadingCsv ? "Exporting..." : "Export Ledger CSV"}</span>
                    </button>
                </div>
            </div>

            {downloadError && (
                <div className="admin-action-error-note">
                    <AlertCircle size={14} />
                    <span>{downloadError}</span>
                </div>
            )}

            {/* 6 Metric Stats Row */}
            <div className="admin-stats-grid">
                <StatCard
                    value={totalUsers}
                    title="Total Users"
                    description="Registered community members"
                    featured
                    icon={Users}
                    onClick={onOpenUsers}
                />

                <StatCard
                    value={mentors}
                    title="Mentors"
                    description="Verified experts sharing skills"
                    tone="tone-mint"
                    icon={GraduationCap}
                    onClick={onOpenUsers}
                />

                <StatCard
                    value={learners}
                    title="Learners"
                    description="Members currently upskilling"
                    tone="tone-sand"
                    icon={BookOpen}
                    onClick={onOpenUsers}
                />

                <StatCard
                    value={pendingVerification}
                    title="Pending Verification"
                    description="Accounts awaiting verification review"
                    tone="tone-rose"
                    icon={ShieldCheck}
                    onClick={onOpenUsers}
                />

                <StatCard
                    value={awaitingPayments}
                    title="Awaiting Payments"
                    description="Approved sessions awaiting checkout"
                    tone="tone-blue"
                    icon={CreditCard}
                    onClick={onOpenPayments}
                />

                <StatCard
                    value={totalSessions}
                    title="Total Sessions"
                    description="Knowledge exchange bookings"
                    tone="tone-lavender"
                    icon={CalendarCheck2}
                    onClick={onOpenSessions || onOpenReports}
                />
            </div>

            {/* Operational Tables Below Stats */}
            <div className="admin-overview-tables-grid">
                {/* 1. Recent Members */}
                <div className="admin-overview-table-card">
                    <div className="table-card-head">
                        <div>
                            <h4>Recent Members</h4>
                            <p>Newly joined community members</p>
                        </div>
                        <button type="button" className="card-head-action" onClick={onOpenUsers}>
                            <span>View all</span>
                            <ArrowRight size={13} />
                        </button>
                    </div>

                    <div className="admin-mini-list">
                        {recentMembers.length === 0 ? (
                            <p className="mini-empty">No members registered yet.</p>
                        ) : (
                            recentMembers.map((member) => (
                                <div
                                    key={member._id}
                                    className="mini-list-item clickable"
                                    onClick={() => (onViewUser ? onViewUser(member._id) : onOpenUsers())}
                                >
                                    <div className="mini-avatar">
                                        {member.avatarUrl ? (
                                            <img src={member.avatarUrl} alt={member.name} />
                                        ) : (
                                            <span>{member.name?.charAt(0)?.toUpperCase() || "?"}</span>
                                        )}
                                    </div>
                                    <div className="mini-info">
                                        <strong title={member.name}>{member.name}</strong>
                                        <span title={member.email}>{member.email}</span>
                                    </div>
                                    <div className="mini-tag-group">
                                        <span className={`pill-role ${member.role}`}>{member.role}</span>
                                        {member.isVerified && <span className="pill-verified is-verified">✓ Verified</span>}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* 2. Recent Payments */}
                <div className="admin-overview-table-card">
                    <div className="table-card-head">
                        <div>
                            <h4>Recent Payments</h4>
                            <p>Latest Razorpay platform transactions</p>
                        </div>
                        <button type="button" className="card-head-action" onClick={onOpenPayments}>
                            <span>View all</span>
                            <ArrowRight size={13} />
                        </button>
                    </div>

                    <div className="admin-mini-list">
                        {recentPayments.length === 0 ? (
                            <p className="mini-empty">No payments yet</p>
                        ) : (
                            recentPayments.map((booking) => {
                                const amount = Number(
                                    booking.paymentAmount ??
                                    booking.payment?.amount ??
                                    booking.baseSessionAmount ??
                                    0
                                );
                                const status = booking.payment?.status || booking.paymentStatus || "awaiting_payment";
                                const isPaid = ["paid", "confirmed", "verified"].includes(status);
                                const isAwaiting = ["awaiting_payment", "unpaid", "pending_verification"].includes(status);
                                const isFailed = status === "failed";
                                const learnerName = booking.learner?.name || "Learner";
                                const mentorName = booking.mentor?.name || "Mentor";
                                const dateDisplay = booking.paidAt
                                    ? new Date(booking.paidAt).toLocaleDateString()
                                    : (booking.date ? `${booking.date} ${booking.time || ""}`.trim() : "Recent");

                                return (
                                    <div
                                        key={booking._id}
                                        className="mini-list-item clickable"
                                        onClick={onOpenPayments}
                                    >
                                        <div className="mini-avatar payment-avatar">
                                            <span>₹</span>
                                        </div>
                                        <div className="mini-info">
                                            <strong title={`${learnerName} → ${mentorName}`}>
                                                {learnerName} → {mentorName}
                                            </strong>
                                            <span title={`₹${amount} • ${dateDisplay}`}>
                                                ₹{amount.toLocaleString("en-IN")} • {dateDisplay}
                                            </span>
                                        </div>
                                        <div className="mini-tag-group">
                                            <span className={`pill-payment-status status-${isPaid ? "paid" : isAwaiting ? "awaiting" : isFailed ? "failed" : status}`}>
                                                {isPaid ? "Paid" : isAwaiting ? "Awaiting" : isFailed ? "Failed" : status}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* 3. Recent Platform Sessions (Full Width Below) */}
                <div className="admin-overview-table-card full-span">
                    <div className="table-card-head">
                        <div>
                            <h4>Recent Platform Sessions</h4>
                            <p>Latest knowledge exchange bookings</p>
                        </div>
                        {onOpenSessions && (
                            <button type="button" className="card-head-action" onClick={onOpenSessions}>
                                <span>All sessions</span>
                                <ArrowRight size={13} />
                            </button>
                        )}
                    </div>

                    <div className="admin-table-wrap">
                        {recentSessions.length === 0 ? (
                            <p className="mini-empty" style={{ padding: 24, textAlign: "center" }}>No recorded sessions yet.</p>
                        ) : (
                            <table className="admin-sessions-overview-table">
                                <thead>
                                    <tr>
                                        <th>Mentor</th>
                                        <th>Learner</th>
                                        <th>Date & Time</th>
                                        <th>Status</th>
                                        <th>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentSessions.map((session) => {
                                        const sameName = Boolean(
                                            session.mentor?.name &&
                                            session.learner?.name &&
                                            session.mentor.name.trim().toLowerCase() === session.learner.name.trim().toLowerCase()
                                        );
                                        const amt = Number(
                                            session.paymentAmount ??
                                            session.payment?.amount ??
                                            session.baseSessionAmount ??
                                            0
                                        );

                                        return (
                                            <tr key={session._id}>
                                                <td>
                                                    <div className="session-participant-cell">
                                                        <strong className="participant-name" title={session.mentor?.name}>
                                                            {session.mentor?.name || "Mentor"}
                                                        </strong>
                                                        <small className="participant-role">Mentor</small>
                                                        {sameName && session.mentor?.email && (
                                                            <span className="participant-email-muted" title={session.mentor.email}>
                                                                {session.mentor.email}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="session-participant-cell">
                                                        <strong className="participant-name" title={session.learner?.name}>
                                                            {session.learner?.name || "Learner"}
                                                        </strong>
                                                        <small className="participant-role">Learner</small>
                                                        {sameName && session.learner?.email && (
                                                            <span className="participant-email-muted" title={session.learner.email}>
                                                                {session.learner.email}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="session-datetime-cell">
                                                        <span className="session-date-val">
                                                            <Calendar size={13} style={{ verticalAlign: "middle", marginRight: 5, color: "#176b4e" }} />
                                                            {session.date}
                                                        </span>
                                                        <small className="session-time-val">
                                                            {session.time} ({session.duration || 60}m)
                                                        </small>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`pill-status status-${session.status}`}>
                                                        {session.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    {amt > 0 ? (
                                                        <strong className="session-fee-val">
                                                            ₹{amt.toLocaleString("en-IN")}
                                                        </strong>
                                                    ) : (
                                                        <span className="session-fee-free">Free</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {/* Governance & Safeguards */}
            <div className="admin-dashboard-panels">
                <div className="admin-panel-card">
                    <div className="admin-panel-header">
                        <div className="admin-panel-icon-tag mint">
                            <CreditCard size={18} />
                        </div>
                        <div>
                            <h3>Payment & Escrow Safeguards</h3>
                            <p>Razorpay platform escrow rules & automated security</p>
                        </div>
                    </div>

                    <div className="admin-compliance-list">
                        <div className="compliance-row">
                            <CheckCircle size={15} className="compliance-check" />
                            <div className="compliance-info">
                                <strong>Payments via Razorpay</strong>
                                <span>Mentors and learners transact securely through integrated Razorpay platform checkout</span>
                            </div>
                        </div>

                        <div className="compliance-row">
                            <CheckCircle size={15} className="compliance-check" />
                            <div className="compliance-info">
                                <strong>Payment verified automatically on the server (signature check)</strong>
                                <span>Cryptographic HMAC-SHA256 signature check verifies authentic transactions in real time</span>
                            </div>
                        </div>

                        <div className="compliance-row">
                            <CheckCircle size={15} className="compliance-check" />
                            <div className="compliance-info">
                                <strong>Booking confirmed only after successful payment</strong>
                                <span>Time slots and encrypted session meeting links unlock automatically upon payment capture</span>
                            </div>
                        </div>
                    </div>

                    <div className="admin-panel-footer">
                        <button
                            type="button"
                            className="admin-link-button"
                            onClick={onOpenPayments}
                        >
                            <span>Open Payments & Ledger</span>
                            <ArrowUpRight size={14} />
                        </button>
                    </div>
                </div>

                <div className="admin-panel-card">
                    <div className="admin-panel-header">
                        <div className="admin-panel-icon-tag blue">
                            <Shield size={18} />
                        </div>
                        <div>
                            <h3>Community Governance</h3>
                            <p>Statutory compliance & community guidelines</p>
                        </div>
                    </div>

                    <div className="admin-compliance-list">
                        <div className="compliance-row">
                            <CheckCircle size={15} className="compliance-check" />
                            <div className="compliance-info">
                                <strong>18+ Age Restriction</strong>
                                <span>Enforced via date-of-birth check on registration</span>
                            </div>
                        </div>

                        <div className="compliance-row">
                            <CheckCircle size={15} className="compliance-check" />
                            <div className="compliance-info">
                                <strong>Account Moderation Controls</strong>
                                <span>Full avatar removal, member suspension, and role management</span>
                            </div>
                        </div>

                        <div className="compliance-row">
                            <CheckCircle size={15} className="compliance-check" />
                            <div className="compliance-info">
                                <strong>Transparent Refund & Grievance Mechanism</strong>
                                <span>Disputes reviewed within 24 hours of session delivery</span>
                            </div>
                        </div>
                    </div>

                    <div className="admin-panel-footer compliance-links">
                        <span className="compliance-footer-label">Public Policies:</span>
                        <a href="/terms" target="_blank" rel="noreferrer" className="compliance-link">Terms <ExternalLink size={11} /></a>
                        <a href="/privacy" target="_blank" rel="noreferrer" className="compliance-link">Privacy <ExternalLink size={11} /></a>
                        <a href="/refund-policy" target="_blank" rel="noreferrer" className="compliance-link">Refunds <ExternalLink size={11} /></a>
                        <a href="/contact" target="_blank" rel="noreferrer" className="compliance-link">Contact <ExternalLink size={11} /></a>
                    </div>
                </div>
            </div>
        </section>
    );
}
// @teamcosmiccoders
