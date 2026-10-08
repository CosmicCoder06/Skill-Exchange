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
    Clock,
    AlertCircle,
    CheckCircle,
    Calendar,
    ArrowRight
} from "lucide-react";
import {
    getAdminStats,
    getAdminPendingPayments,
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

            <strong>
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

    const stats = statsData?.stats || {};
    const recentMembers = statsData?.recentMembers || [];
    const pendingPayments = statsData?.pendingPayments || [];
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
                            <span>Review Payments</span>
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
                    description="Payments awaiting proof or admin match"
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
                                        <strong>{member.name}</strong>
                                        <span>{member.email}</span>
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

                {/* 2. Pending Payment Proofs to Review */}
                <div className="admin-overview-table-card">
                    <div className="table-card-head">
                        <div>
                            <h4>Pending Payment Proofs</h4>
                            <p>Submitted UTRs awaiting bank verification</p>
                        </div>
                        <button type="button" className="card-head-action" onClick={onOpenPayments}>
                            <span>Verify queue</span>
                            <ArrowRight size={13} />
                        </button>
                    </div>

                    <div className="admin-mini-list">
                        {pendingPayments.length === 0 ? (
                            <div className="mini-all-good">
                                <CheckCircle size={22} color="#059669" />
                                <p>All caught up! Zero payments awaiting verification.</p>
                            </div>
                        ) : (
                            pendingPayments.map((booking) => (
                                <div key={booking._id} className="mini-list-item">
                                    <div className="mini-info">
                                        <strong>{booking.learner?.name || "Learner"} → {booking.mentor?.name || "Mentor"}</strong>
                                        <span>UTR: <code>{booking.payment?.utr || "Pending"}</code> • ₹{booking.payment?.amount || 0}</span>
                                    </div>
                                    <button
                                        type="button"
                                        className="mini-action-btn verify"
                                        onClick={onOpenPayments}
                                    >
                                        Review
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* 3. Recent Sessions */}
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
                            <table className="admin-users-table">
                                <thead>
                                    <tr>
                                        <th>Mentor</th>
                                        <th>Learner</th>
                                        <th>Date & Time</th>
                                        <th>Duration</th>
                                        <th>Status</th>
                                        <th>Payment</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentSessions.map((session) => (
                                        <tr key={session._id}>
                                            <td><strong>{session.mentor?.name || "Mentor"}</strong></td>
                                            <td><strong>{session.learner?.name || "Learner"}</strong></td>
                                            <td><Calendar size={12} style={{ verticalAlign: "middle", marginRight: 4 }} /> {session.date} {session.time}</td>
                                            <td>{session.duration || 60}m</td>
                                            <td><span className={`status-tag ${session.status}`}>{session.status}</span></td>
                                            <td><span className="payment-tag">{session.paymentStatus || session.payment?.status || "—"}</span></td>
                                        </tr>
                                    ))}
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
                            <p>Platform Paytm Business QR custody & escrow rules</p>
                        </div>
                    </div>

                    <div className="admin-compliance-list">
                        <div className="compliance-row">
                            <CheckCircle size={15} className="compliance-check" />
                            <div className="compliance-info">
                                <strong>Platform-Only QR Code</strong>
                                <span>Mentors never exchange bank or UPI details directly</span>
                            </div>
                        </div>

                        <div className="compliance-row">
                            <CheckCircle size={15} className="compliance-check" />
                            <div className="compliance-info">
                                <strong>Mandatory 12-Digit UTR Bank Match</strong>
                                <span>Admins must verify bank statement before unlocking session</span>
                            </div>
                        </div>

                        <div className="compliance-row">
                            <CheckCircle size={15} className="compliance-check" />
                            <div className="compliance-info">
                                <strong>Escrow Settlement Protection</strong>
                                <span>Mentor payout happens after session completion</span>
                            </div>
                        </div>
                    </div>

                    <div className="admin-panel-footer">
                        <button
                            type="button"
                            className="admin-link-button"
                            onClick={onOpenPayments}
                        >
                            <span>Open Payment Verification Center</span>
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
