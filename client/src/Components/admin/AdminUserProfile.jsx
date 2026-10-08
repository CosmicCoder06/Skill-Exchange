import { useState, useEffect } from "react";
import {
    ArrowLeft,
    CheckCircle2,
    Shield,
    AlertTriangle,
    Trash2,
    Calendar,
    Clock,
    UserCheck,
    UserX,
    BookOpen,
    GraduationCap,
    Mail,
    Award
} from "lucide-react";
import {
    getAdminUserDetails,
    updateAdminUser,
    deleteAdminUser
} from "../../services/adminService";

function formatDate(date) {
    if (!date) return "—";
    try {
        return new Intl.DateTimeFormat("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        }).format(new Date(date));
    } catch {
        return "—";
    }
}

function getInitial(name) {
    return name?.trim()?.charAt(0)?.toUpperCase() || "?";
}

export default function AdminUserProfile({
    userId,
    token,
    onBack,
    onUserDeleted
}) {
    const [userData, setUserData] = useState(null);
    const [sessionsSummary, setSessionsSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionBusy, setActionBusy] = useState(false);
    const [error, setError] = useState("");
    const [toastMsg, setToastMsg] = useState("");

    function showToast(msg) {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(""), 3500);
    }

    async function loadData() {
        if (!userId || !token) return;
        setLoading(true);
        setError("");
        try {
            const res = await getAdminUserDetails(token, userId);
            setUserData(res.user);
            setSessionsSummary(res.sessionsSummary);
        } catch (err) {
            setError(err?.message || "Failed to load user profile");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, [userId, token]);

    async function handleToggleVerify() {
        if (!userData || actionBusy) return;
        setActionBusy(true);
        try {
            const nextVerified = !userData.isVerified;
            await updateAdminUser(token, userData._id, { isVerified: nextVerified });
            setUserData((prev) => ({ ...prev, isVerified: nextVerified }));
            showToast(nextVerified ? "Member marked as Verified" : "Member marked as Unverified");
        } catch (err) {
            showToast(err?.message || "Failed to update verification status");
        } finally {
            setActionBusy(false);
        }
    }

    async function handleToggleSuspend() {
        if (!userData || actionBusy) return;
        const willSuspend = userData.isActive !== false;
        const confirmMsg = willSuspend
            ? `Suspend ${userData.name || "this account"}? The user will not be able to log in or book sessions.`
            : `Reactivate ${userData.name || "this account"}?`;
        if (!window.confirm(confirmMsg)) return;

        setActionBusy(true);
        try {
            await updateAdminUser(token, userData._id, { isActive: !willSuspend });
            setUserData((prev) => ({ ...prev, isActive: !willSuspend }));
            showToast(willSuspend ? "Account suspended" : "Account reactivated");
        } catch (err) {
            showToast(err?.message || "Failed to update account status");
        } finally {
            setActionBusy(false);
        }
    }

    async function handleRoleChange(newRole) {
        if (!userData || actionBusy || newRole === userData.role) return;
        const isPromotingToAdmin = newRole === "admin";
        const confirmMsg = isPromotingToAdmin
            ? `Promote ${userData.name || "this member"} to Administrator?\n\nAdmins have full access to platform governance, payments, and member records.`
            : `Change ${userData.name || "this member"}'s role to ${newRole.toUpperCase()}?`;

        if (!window.confirm(confirmMsg)) return;

        setActionBusy(true);
        try {
            await updateAdminUser(token, userData._id, { role: newRole });
            setUserData((prev) => ({ ...prev, role: newRole }));
            showToast(`Role updated to ${newRole.toUpperCase()}`);
        } catch (err) {
            showToast(err?.message || "Failed to update role");
        } finally {
            setActionBusy(false);
        }
    }

    async function handleDeleteAccount() {
        if (!userData || actionBusy) return;
        const confirmMsg = `PERMANENT DELETION: Are you sure you want to delete ${userData.name || "this user"} (${userData.email})?\n\nThis will remove their profile, chat messages, and account permanently. This action CANNOT be undone.`;
        if (!window.confirm(confirmMsg)) return;

        setActionBusy(true);
        try {
            await deleteAdminUser(token, userData._id, "Administrative deletion");
            showToast("Account deleted permanently");
            if (onUserDeleted) {
                onUserDeleted(userData._id);
            } else if (onBack) {
                onBack();
            }
        } catch (err) {
            showToast(err?.message || "Failed to delete account");
            setActionBusy(false);
        }
    }

    if (loading) {
        return (
            <div className="admin-loading">
                <div className="admin-spinner" />
                <p>Loading member profile & session history...</p>
            </div>
        );
    }

    if (error || !userData) {
        return (
            <div className="admin-error-box" style={{ maxWidth: 800, margin: "40px auto", padding: 24, textAlign: "center" }}>
                <AlertTriangle size={32} color="#dc2626" style={{ margin: "0 auto 12px" }} />
                <h3>Member Profile Error</h3>
                <p>{error || "User could not be found."}</p>
                <button type="button" className="admin-quick-action-btn" onClick={onBack} style={{ marginTop: 16 }}>
                    <ArrowLeft size={14} />
                    <span>Back to Members</span>
                </button>
            </div>
        );
    }

    const teachSkills = Array.isArray(userData.skillsToTeach) ? userData.skillsToTeach.filter(Boolean) : [];
    const learnSkills = Array.isArray(userData.skillsToLearn) ? userData.skillsToLearn.filter(Boolean) : [];
    const avatar = userData.avatarUrl || userData.profilePhoto || "";
    const isSuspended = userData.isActive === false;
    const isVerified = userData.isVerified === true;

    return (
        <section className="admin-user-profile-view">
            {toastMsg && (
                <div className="admin-toast-banner" role="status">
                    <CheckCircle2 size={16} />
                    <span>{toastMsg}</span>
                </div>
            )}

            {/* Back Bar */}
            <div className="admin-profile-top-bar">
                <button type="button" className="admin-back-btn" onClick={onBack}>
                    <ArrowLeft size={16} />
                    <span>Back to Community Members</span>
                </button>
                <span className="admin-view-tag">ADMINISTRATIVE USER RECORD</span>
            </div>

            {/* Governance Action Center */}
            <div className="admin-governance-panel">
                <div className="gov-left">
                    <span className="gov-label">GOVERNANCE CONTROLS</span>
                    <div className="gov-user-quickinfo">
                        <strong>{userData.name}</strong>
                        <span><Mail size={12} /> {userData.email}</span>
                        <span>• Joined {formatDate(userData.createdAt)}</span>
                    </div>
                </div>

                <div className="gov-actions">
                    <div className="gov-role-selector">
                        <label htmlFor="admin-change-role-select">Role:</label>
                        <select
                            id="admin-change-role-select"
                            value={userData.role || "learner"}
                            disabled={actionBusy}
                            onChange={(e) => handleRoleChange(e.target.value)}
                        >
                            <option value="learner">Learner</option>
                            <option value="mentor">Mentor</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <button
                        type="button"
                        className={`gov-action-btn ${isVerified ? "verified" : "verify"}`}
                        onClick={handleToggleVerify}
                        disabled={actionBusy}
                    >
                        <Shield size={14} />
                        <span>{isVerified ? "Unverify Member" : "Verify Member"}</span>
                    </button>

                    <button
                        type="button"
                        className={`gov-action-btn ${isSuspended ? "activate" : "suspend"}`}
                        onClick={handleToggleSuspend}
                        disabled={actionBusy}
                    >
                        {isSuspended ? <UserCheck size={14} /> : <UserX size={14} />}
                        <span>{isSuspended ? "Reactivate Account" : "Suspend Account"}</span>
                    </button>

                    <button
                        type="button"
                        className="gov-action-btn delete"
                        onClick={handleDeleteAccount}
                        disabled={actionBusy}
                    >
                        <Trash2 size={14} />
                        <span>Delete</span>
                    </button>
                </div>
            </div>

            {/* Member Profile Card */}
            <div className="admin-profile-editorial-card">
                <div className="profile-editorial-header">
                    <div className="profile-editorial-avatar-wrap">
                        {avatar ? (
                            <img src={avatar} alt={userData.name} className="profile-editorial-avatar" />
                        ) : (
                            <div className="profile-editorial-avatar-placeholder">
                                {getInitial(userData.name)}
                            </div>
                        )}
                    </div>

                    <div className="profile-editorial-meta">
                        <div className="profile-editorial-title-row">
                            <h2>{userData.name}</h2>
                            <div className="profile-status-pills">
                                <span className={`pill-role ${userData.role}`}>
                                    {userData.role?.toUpperCase()}
                                </span>
                                <span className={`pill-verified ${isVerified ? "is-verified" : "is-pending"}`}>
                                    {isVerified ? "✓ Verified" : "Pending Verification"}
                                </span>
                                <span className={`pill-active ${isSuspended ? "is-suspended" : "is-active"}`}>
                                    {isSuspended ? "Paused / Suspended" : "Active"}
                                </span>
                                {userData.profileCompleted && (
                                    <span className="pill-complete">✓ Complete Profile</span>
                                )}
                            </div>
                        </div>

                        <p className="profile-editorial-bio">
                            {userData.bio || "No biography provided yet."}
                        </p>

                        <div className="profile-editorial-info-chips">
                            {userData.hourlyRate !== undefined && userData.hourlyRate > 0 && (
                                <div className="info-chip">
                                    <Award size={14} />
                                    <span>Rate: ₹{userData.hourlyRate}/hr</span>
                                </div>
                            )}
                            {Array.isArray(userData.availability) && userData.availability.length > 0 && (
                                <div className="info-chip">
                                    <Clock size={14} />
                                    <span>Available: {userData.availability.join(", ")}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Skills Grid */}
                <div className="profile-editorial-skills-section">
                    {teachSkills.length > 0 && (
                        <div className="skills-block">
                            <div className="skills-block-header">
                                <GraduationCap size={16} />
                                <h4>Skills They Teach</h4>
                            </div>
                            <div className="skills-tags-wrap">
                                {teachSkills.map((s) => (
                                    <span key={s} className="skill-tag teach">
                                        {s}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {learnSkills.length > 0 && (
                        <div className="skills-block">
                            <div className="skills-block-header">
                                <BookOpen size={16} />
                                <h4>Skills They Learn</h4>
                            </div>
                            <div className="skills-tags-wrap">
                                {learnSkills.map((s) => (
                                    <span key={s} className="skill-tag learn">
                                        {s}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Sessions & Exchange Record Section */}
            <div className="admin-sessions-record-section">
                <div className="section-head">
                    <h3>Session & Booking Activity</h3>
                    <p>Overview of mentorship deliveries and learning bookings</p>
                </div>

                {sessionsSummary && (
                    <div className="sessions-summary-grid">
                        <div className="session-summary-box">
                            <span className="sum-label">TOTAL SESSIONS</span>
                            <strong className="sum-val">{sessionsSummary.totalSessions || 0}</strong>
                            <small>Booked across platform</small>
                        </div>
                        <div className="session-summary-box">
                            <span className="sum-label">COMPLETED</span>
                            <strong className="sum-val text-green">{sessionsSummary.completedSessions || 0}</strong>
                            <small>Successfully delivered</small>
                        </div>
                        <div className="session-summary-box">
                            <span className="sum-label">AS MENTOR</span>
                            <strong className="sum-val">{sessionsSummary.asMentor?.total || 0}</strong>
                            <small>{sessionsSummary.asMentor?.completed || 0} completed</small>
                        </div>
                        <div className="session-summary-box">
                            <span className="sum-label">AS LEARNER</span>
                            <strong className="sum-val">{sessionsSummary.asLearner?.total || 0}</strong>
                            <small>{sessionsSummary.asLearner?.completed || 0} completed</small>
                        </div>
                    </div>
                )}

                {/* Recent Session History */}
                <div className="sessions-history-tables">
                    {sessionsSummary?.asMentor?.recent?.length > 0 && (
                        <div className="history-table-card">
                            <h4>Recent Sessions Hosted as Mentor</h4>
                            <div className="admin-table-wrap">
                                <table className="admin-users-table">
                                    <thead>
                                        <tr>
                                            <th>Learner</th>
                                            <th>Date & Time</th>
                                            <th>Duration</th>
                                            <th>Status</th>
                                            <th>Payment</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sessionsSummary.asMentor.recent.map((s) => (
                                            <tr key={s._id}>
                                                <td><strong>{s.learner?.name || "Learner"}</strong></td>
                                                <td><Calendar size={12} /> {s.date} {s.time}</td>
                                                <td>{s.duration || 60}m</td>
                                                <td><span className={`status-tag ${s.status}`}>{s.status}</span></td>
                                                <td><span className="payment-tag">{s.paymentStatus || s.payment?.status || "—"}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {sessionsSummary?.asLearner?.recent?.length > 0 && (
                        <div className="history-table-card" style={{ marginTop: 20 }}>
                            <h4>Recent Sessions Booked as Learner</h4>
                            <div className="admin-table-wrap">
                                <table className="admin-users-table">
                                    <thead>
                                        <tr>
                                            <th>Mentor</th>
                                            <th>Date & Time</th>
                                            <th>Duration</th>
                                            <th>Status</th>
                                            <th>Payment</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sessionsSummary.asLearner.recent.map((s) => (
                                            <tr key={s._id}>
                                                <td><strong>{s.mentor?.name || "Mentor"}</strong></td>
                                                <td><Calendar size={12} /> {s.date} {s.time}</td>
                                                <td>{s.duration || 60}m</td>
                                                <td><span className={`status-tag ${s.status}`}>{s.status}</span></td>
                                                <td><span className="payment-tag">{s.paymentStatus || s.payment?.status || "—"}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {(!sessionsSummary?.asMentor?.recent?.length && !sessionsSummary?.asLearner?.recent?.length) && (
                        <div className="admin-empty-table" style={{ padding: 24, textAlign: "center" }}>
                            <p>No recorded session bookings for this member yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
