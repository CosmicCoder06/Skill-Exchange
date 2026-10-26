import { useState, useEffect } from "react";
import {
    getAdminPayments,
    getAdminPayouts,
    settleAdminPayouts,
    getAdminPayoutHistory,
    getAdminRefunds,
    refundAdminRazorpay,
    downloadPaymentLedger
} from "../../services/adminService";
import {
    CreditCard,
    CheckCircle,
    Clock,
    AlertTriangle,
    Search,
    RefreshCw,
    Download,
    Copy,
    ChevronDown,
    ChevronUp,
    ShieldAlert,
    ExternalLink
} from "lucide-react";

export default function AdminPayments({ token }) {
    const [tab, setTab] = useState("all-payments"); // "all-payments" | "payouts" | "payout-history" | "refunds"
    const [payments, setPayments] = useState([]);
    const [mentorGroups, setMentorGroups] = useState([]);
    const [payoutHistory, setPayoutHistory] = useState([]);
    const [refundsList, setRefundsList] = useState([]);

    const [stats, setStats] = useState({
        totalCollected: 0,
        paidCount: 0,
        awaitingCount: 0,
        failedCount: 0,
        refundsDueCount: 0,
        pendingPayoutsCount: 0,
        settledPayoutsCount: 0
    });
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionMsg, setActionMsg] = useState("");
    const [busyId, setBusyId] = useState(null);

    // Filters for All Payments & Payout History
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [historySearch, setHistorySearch] = useState("");
    const [expandedMentors, setExpandedMentors] = useState({});
    const [copiedUpi, setCopiedUpi] = useState(null);

    // Settlement Modal state
    const [settleModal, setSettleModal] = useState(null); // { mentorName, mentorUpi, sessionsCount, netTotal, bookingIds }
    const [modalRef, setModalRef] = useState("");
    const [modalNote, setModalNote] = useState("");
    const [modalError, setModalError] = useState("");
    const [settleBusy, setSettleBusy] = useState(false);

    // Refund Modal state
    const [refundModal, setRefundModal] = useState(null); // { bookingId, learnerName, amount, canCallRazorpay }
    const [refundNote, setRefundNote] = useState("");
    const [refundBusy, setRefundBusy] = useState(false);

    async function loadPaymentsData() {
        setLoading(true);
        setError("");
        try {
            if (tab === "all-payments") {
                const res = await getAdminPayments(token, {
                    status: statusFilter,
                    search,
                    page: pagination.page,
                    limit: pagination.limit
                });
                setPayments(res.payments || []);
                if (res.stats) setStats(res.stats);
                if (res.pagination) setPagination(res.pagination);
            } else if (tab === "payouts") {
                const res = await getAdminPayouts(token);
                setMentorGroups(res.mentorGroups || []);
            } else if (tab === "payout-history") {
                const res = await getAdminPayoutHistory(token, { search: historySearch });
                setPayoutHistory(res.history || []);
            } else if (tab === "refunds") {
                const res = await getAdminRefunds(token);
                setRefundsList(res.refunds || []);
            }
        } catch (err) {
            setError(err.message || "Failed to load payment data");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (token) loadPaymentsData();
    }, [token, tab, statusFilter, pagination.page]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setPagination((prev) => ({ ...prev, page: 1 }));
        loadPaymentsData();
    };

    const handleHistorySearch = (e) => {
        e.preventDefault();
        loadPaymentsData();
    };

    const toggleMentorExpanded = (mentorId) => {
        setExpandedMentors((prev) => ({ ...prev, [mentorId]: !prev[mentorId] }));
    };

    const copyToClipboard = (text) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedUpi(text);
        setTimeout(() => setCopiedUpi(null), 2500);
    };

    // Open settlement modal
    const openSettleModal = (mentor, specificSession = null) => {
        setModalError("");
        setModalNote("");
        setModalRef("");

        if (specificSession) {
            setSettleModal({
                mentorName: mentor.mentorName,
                mentorUpi: mentor.payoutUpiId,
                sessionsCount: 1,
                netTotal: specificSession.netAmount,
                bookingIds: [specificSession.bookingId]
            });
        } else {
            setSettleModal({
                mentorName: mentor.mentorName,
                mentorUpi: mentor.payoutUpiId,
                sessionsCount: mentor.sessionsCount,
                netTotal: mentor.netPayoutTotal,
                bookingIds: mentor.sessions.map((s) => s.bookingId)
            });
        }
    };

    // Execute settlement
    const handleConfirmSettle = async (e) => {
        e.preventDefault();
        if (!modalRef || modalRef.trim().length < 8) {
            setModalError("Payout reference / UTR is required (at least 8 characters).");
            return;
        }

        setSettleBusy(true);
        setModalError("");
        try {
            const res = await settleAdminPayouts(token, {
                bookingIds: settleModal.bookingIds,
                reference: modalRef.trim(),
                note: modalNote.trim()
            });

            setActionMsg(`✓ ${res.message || "Payout settled successfully!"}`);
            setSettleModal(null);
            loadPaymentsData();
        } catch (err) {
            setModalError(err.message || "Failed to settle payout");
        } finally {
            setSettleBusy(false);
        }
    };

    // Open refund confirmation modal
    const openRefundModal = (item) => {
        setRefundNote("Session cancelled - approved refund to learner");
        setRefundModal(item);
    };

    // Execute refund
    const handleConfirmRefund = async () => {
        if (!refundModal) return;
        setRefundBusy(true);
        setError("");
        setActionMsg("");
        try {
            const res = await refundAdminRazorpay(token, refundModal.bookingId, {
                note: refundNote
            });
            setActionMsg(`✓ ${res.message || "Refund processed successfully."}`);
            setRefundModal(null);
            loadPaymentsData();
        } catch (err) {
            setError(err.message || "Failed to process refund");
        } finally {
            setRefundBusy(false);
        }
    };

    function renderStatusPill(status, booking) {
        const st = status || booking?.payment?.status || booking?.paymentStatus;
        const config = {
            paid: { label: "Paid", bg: "#ecfdf5", color: "#065f46", border: "#a7f3d0" },
            confirmed: { label: "Paid", bg: "#ecfdf5", color: "#065f46", border: "#a7f3d0" },
            verified: { label: "Paid", bg: "#ecfdf5", color: "#065f46", border: "#a7f3d0" },
            awaiting_payment: { label: "Awaiting", bg: "#fef3c7", color: "#92400e", border: "#fde68a" },
            unpaid: { label: "Awaiting", bg: "#fef3c7", color: "#92400e", border: "#fde68a" },
            failed: { label: "Failed", bg: "#fef2f2", color: "#991b1b", border: "#fecaca" },
            rejected: { label: "Declined", bg: "#fef2f2", color: "#991b1b", border: "#fecaca" },
            refunded: { label: "Refunded", bg: "#f1f5f9", color: "#475569", border: "#cbd5e1" },
            paid_out: { label: "Paid Out", bg: "#f0fdf4", color: "#166534", border: "#bbf7d0" },
            not_required: { label: "Free", bg: "#f8fafc", color: "#64748b", border: "#e2e8f0" }
        }[st] || { label: String(st || "Unknown"), bg: "#f8fafc", color: "#64748b", border: "#e2e8f0" };

        return (
            <span style={{
                display: "inline-block",
                padding: "3px 10px",
                borderRadius: "999px",
                fontSize: "12px",
                fontWeight: "600",
                background: config.bg,
                color: config.color,
                border: `1px solid ${config.border}`
            }}>
                {config.label}
            </span>
        );
    }

    const totalPendingPayouts = mentorGroups.reduce((acc, m) => acc + m.sessionsCount, 0);
    const activeRefundsDueCount = refundsList.filter((r) => !r.isRefunded).length;

    return (
        <section className="admin-content-section">
            <div className="admin-section-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                <div>
                    <p className="admin-eyebrow">FINANCIAL & PAYMENT OPERATIONS</p>
                    <h2>Razorpay Platform Payments</h2>
                    <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--text-muted, #64748b)" }}>
                        Track Razorpay payments and settle mentor payouts
                    </p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <button
                        type="button"
                        className="admin-outline-button"
                        onClick={() => downloadPaymentLedger(token)}
                    >
                        <Download size={14} style={{ marginRight: "6px" }} />
                        Export Ledger (CSV)
                    </button>
                    <button
                        type="button"
                        className="admin-outline-button"
                        onClick={loadPaymentsData}
                    >
                        <RefreshCw size={14} style={{ marginRight: "6px" }} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* PAYMENT SUMMARY STATS */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", margin: "20px 0" }}>
                <div style={{ background: "var(--card-bg, #ffffff)", border: "1px solid var(--border, #e2e8f0)", borderRadius: "10px", padding: "16px" }}>
                    <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>TOTAL COLLECTED</span>
                    <h3 style={{ margin: "6px 0 0", fontSize: "24px", color: "#176b4e" }}>₹{stats.totalCollected?.toLocaleString("en-IN") || 0}</h3>
                    <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#94a3b8" }}>Paid & active (excludes cancelled/refunded)</p>
                </div>
                <div style={{ background: "var(--card-bg, #ffffff)", border: "1px solid var(--border, #e2e8f0)", borderRadius: "10px", padding: "16px" }}>
                    <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>PAID SESSIONS</span>
                    <h3 style={{ margin: "6px 0 0", fontSize: "24px", color: "#0f766e" }}>{stats.paidCount || 0}</h3>
                    <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#94a3b8" }}>Successful checkouts</p>
                </div>
                <div style={{ background: "var(--card-bg, #ffffff)", border: "1px solid var(--border, #e2e8f0)", borderRadius: "10px", padding: "16px" }}>
                    <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>AWAITING PAYMENT</span>
                    <h3 style={{ margin: "6px 0 0", fontSize: "24px", color: "#d97706" }}>{stats.awaitingCount || 0}</h3>
                    <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#94a3b8" }}>Approved sessions pending checkout</p>
                </div>
                <div style={{ background: "var(--card-bg, #ffffff)", border: "1px solid var(--border, #e2e8f0)", borderRadius: "10px", padding: "16px" }}>
                    <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>REFUNDS DUE</span>
                    <h3 style={{ margin: "6px 0 0", fontSize: "24px", color: stats.refundsDueCount > 0 ? "#dc2626" : "#64748b" }}>
                        {stats.refundsDueCount || 0}
                    </h3>
                    <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#94a3b8" }}>Paid cancelled sessions requiring refund</p>
                </div>
            </div>

            {/* TAB SELECTOR */}
            <div style={{ display: "flex", gap: "10px", margin: "16px 0", borderBottom: "1px solid var(--border, #e2e8f0)", paddingBottom: "8px", flexWrap: "wrap" }}>
                <button
                    type="button"
                    style={{
                        padding: "8px 16px",
                        fontWeight: tab === "all-payments" ? "700" : "500",
                        background: tab === "all-payments" ? "#176b4e" : "transparent",
                        color: tab === "all-payments" ? "#ffffff" : "inherit",
                        borderRadius: "6px",
                        border: "none",
                        cursor: "pointer"
                    }}
                    onClick={() => setTab("all-payments")}
                >
                    All Transactions
                </button>
                <button
                    type="button"
                    style={{
                        padding: "8px 16px",
                        fontWeight: tab === "payouts" ? "700" : "500",
                        background: tab === "payouts" ? "#176b4e" : "transparent",
                        color: tab === "payouts" ? "#ffffff" : "inherit",
                        borderRadius: "6px",
                        border: "none",
                        cursor: "pointer"
                    }}
                    onClick={() => setTab("payouts")}
                >
                    Pending Mentor Payouts ({totalPendingPayouts})
                </button>
                <button
                    type="button"
                    style={{
                        padding: "8px 16px",
                        fontWeight: tab === "payout-history" ? "700" : "500",
                        background: tab === "payout-history" ? "#176b4e" : "transparent",
                        color: tab === "payout-history" ? "#ffffff" : "inherit",
                        borderRadius: "6px",
                        border: "none",
                        cursor: "pointer"
                    }}
                    onClick={() => setTab("payout-history")}
                >
                    Payout History
                </button>
                <button
                    type="button"
                    style={{
                        padding: "8px 16px",
                        fontWeight: tab === "refunds" ? "700" : "500",
                        background: tab === "refunds" ? "#176b4e" : "transparent",
                        color: tab === "refunds" ? "#ffffff" : "inherit",
                        borderRadius: "6px",
                        border: "none",
                        cursor: "pointer"
                    }}
                    onClick={() => setTab("refunds")}
                >
                    Refunds {activeRefundsDueCount > 0 && `(${activeRefundsDueCount})`}
                </button>
            </div>

            {error && (
                <div style={{ background: "#fef2f2", border: "1px solid #f87171", color: "#991b1b", padding: "10px 14px", borderRadius: "6px", marginBottom: "16px" }}>
                    ⚠️ {error}
                </div>
            )}
            {actionMsg && (
                <div style={{ background: "#f0fdf4", border: "1px solid #86efac", color: "#166534", padding: "10px 14px", borderRadius: "6px", marginBottom: "16px" }}>
                    {actionMsg}
                </div>
            )}

            {/* TAB 1: ALL TRANSACTIONS */}
            {tab === "all-payments" && (
                <>
                    <div className="admin-users-panel" style={{ marginBottom: "20px" }}>
                        <div className="admin-users-toolbar" style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
                            <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "8px", flex: 1, minWidth: "260px" }}>
                                <label className="admin-search" style={{ flex: 1, margin: 0 }}>
                                    <span>⌕</span>
                                    <input
                                        type="search"
                                        placeholder="Search by learner, mentor, session ID, or payment ID..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </label>
                                <button type="submit" className="admin-outline-button" style={{ padding: "0 14px" }}>Search</button>
                            </form>

                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setPagination((p) => ({ ...p, page: 1 }));
                                }}
                                style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border, #cbd5e1)" }}
                            >
                                <option value="all">All Payment Statuses</option>
                                <option value="paid">Paid / Confirmed</option>
                                <option value="awaiting">Awaiting Payment</option>
                                <option value="failed">Failed</option>
                                <option value="refunded">Refunded</option>
                                <option value="paid_out">Paid Out</option>
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div className="admin-loading"><div className="admin-spinner" /><p>Loading platform payments…</p></div>
                    ) : payments.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                            No payment records found matching the filter criteria.
                        </div>
                    ) : (
                        <div className="admin-table-wrap">
                            <table className="admin-users-table">
                                <thead>
                                    <tr>
                                        <th>Session ID</th>
                                        <th>Learner</th>
                                        <th>Mentor</th>
                                        <th>Date & Time</th>
                                        <th>Amount</th>
                                        <th>Razorpay Payment ID</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.map((p) => {
                                        const amt = Number(p.payment?.amount || p.baseSessionAmount || p.grossAmountWithGst || p.paymentAmount || 0);
                                        const rzpId = p.razorpayPaymentId || p.payment?.razorpayPaymentId || "—";
                                        return (
                                            <tr key={p._id}>
                                                <td>
                                                    <strong>#{String(p._id).slice(-6).toUpperCase()}</strong>
                                                </td>
                                                <td>
                                                    <div>{p.learner?.name || "Learner"}</div>
                                                    <small style={{ color: "#64748b" }}>{p.learner?.email}</small>
                                                </td>
                                                <td>
                                                    <div>{p.mentor?.name || "Mentor"}</div>
                                                    <small style={{ color: "#64748b" }}>{p.mentor?.email}</small>
                                                </td>
                                                <td>
                                                    <div>{p.date}</div>
                                                    <small style={{ color: "#64748b" }}>{p.time} ({p.duration}m)</small>
                                                </td>
                                                <td>
                                                    <strong style={{ color: "#176b4e" }}>₹{amt.toLocaleString("en-IN")}</strong>
                                                </td>
                                                <td>
                                                    {rzpId !== "—" ? (
                                                        <code style={{ fontSize: "11px", background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px" }}>
                                                            {rzpId}
                                                        </code>
                                                    ) : (
                                                        <span style={{ color: "#94a3b8" }}>—</span>
                                                    )}
                                                </td>
                                                <td>
                                                    {renderStatusPill(p.payment?.status || p.paymentStatus, p)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* TAB 2: PENDING MENTOR PAYOUTS (GROUPED BY MENTOR) */}
            {tab === "payouts" && (
                loading ? (
                    <div className="admin-loading"><div className="admin-spinner" /><p>Loading pending payouts…</p></div>
                ) : mentorGroups.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "48px 24px", color: "#64748b" }}>
                        <CheckCircle size={36} color="#059669" style={{ marginBottom: "12px" }} />
                        <h3 style={{ margin: "0 0 6px", color: "#10261f" }}>No pending mentor payouts!</h3>
                        <p style={{ margin: 0 }}>All completed, paid sessions have been disbursed to mentors.</p>
                    </div>
                ) : (
                    <div style={{ display: "grid", gap: "20px" }}>
                        {mentorGroups.map((group) => {
                            const isExpanded = Boolean(expandedMentors[group.mentorId]);
                            return (
                                <div
                                    key={group.mentorId}
                                    style={{
                                        background: "var(--card-bg, #ffffff)",
                                        border: "1px solid var(--border, #e2e8f0)",
                                        borderRadius: "12px",
                                        padding: "20px",
                                        boxShadow: "0 2px 10px rgba(0,0,0,0.04)"
                                    }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", borderBottom: isExpanded ? "1px solid #f1f5f9" : "none", paddingBottom: isExpanded ? "16px" : 0 }}>
                                        <div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                                                <strong style={{ fontSize: "17px", color: "#10261f" }}>{group.mentorName}</strong>
                                                <span style={{ fontSize: "12px", color: "#64748b" }}>({group.mentorEmail})</span>
                                            </div>

                                            {/* UPI ID Display & Copy */}
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                                                <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Payout UPI:</span>
                                                {group.hasUpiId ? (
                                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                        <code style={{ background: "#edf7f2", color: "#087456", padding: "2px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: 700 }}>
                                                            {group.payoutUpiId}
                                                        </code>
                                                        <button
                                                            type="button"
                                                            onClick={() => copyToClipboard(group.payoutUpiId)}
                                                            title="Copy UPI ID"
                                                            style={{ background: "none", border: "none", cursor: "pointer", color: "#087456", padding: "2px" }}
                                                        >
                                                            <Copy size={13} />
                                                        </button>
                                                        {copiedUpi === group.payoutUpiId && (
                                                            <span style={{ fontSize: "11px", color: "#059669" }}>Copied!</span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span style={{ background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca", borderRadius: "4px", padding: "2px 8px", fontSize: "11px", fontWeight: 600 }}>
                                                        ⚠️ UPI ID missing on mentor profile
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Financial Summary & Actions */}
                                        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                                            <div style={{ textAlign: "right" }}>
                                                <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase" }}>{group.sessionsCount} session(s)</div>
                                                <div style={{ fontSize: "20px", fontWeight: 800, color: "#176b4e" }}>
                                                    ₹{group.netPayoutTotal.toLocaleString("en-IN")}
                                                </div>
                                                <small style={{ fontSize: "11px", color: "#94a3b8" }}>
                                                    (Gross: ₹{group.grossTotal.toLocaleString("en-IN")} - 3% fee: ₹{group.feeTotal.toLocaleString("en-IN")})
                                                </small>
                                            </div>

                                            <div style={{ display: "flex", gap: "8px" }}>
                                                <button
                                                    type="button"
                                                    onClick={() => openSettleModal(group)}
                                                    style={{
                                                        padding: "8px 16px",
                                                        background: "#176b4e",
                                                        color: "#ffffff",
                                                        borderRadius: "6px",
                                                        border: "none",
                                                        fontWeight: 700,
                                                        cursor: "pointer",
                                                        fontSize: "13px"
                                                    }}
                                                >
                                                    Settle All (₹{group.netPayoutTotal})
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => toggleMentorExpanded(group.mentorId)}
                                                    style={{
                                                        padding: "8px 10px",
                                                        background: "#f1f5f9",
                                                        color: "#475569",
                                                        borderRadius: "6px",
                                                        border: "none",
                                                        cursor: "pointer",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "4px",
                                                        fontSize: "12px"
                                                    }}
                                                >
                                                    <span>{isExpanded ? "Hide" : "Details"}</span>
                                                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Sessions Table */}
                                    {isExpanded && (
                                        <div style={{ marginTop: "14px", overflowX: "auto" }}>
                                            <table className="admin-sessions-overview-table">
                                                <thead>
                                                    <tr>
                                                        <th>Learner</th>
                                                        <th>Date & Time</th>
                                                        <th>Gross Amount</th>
                                                        <th>Platform Fee (3%)</th>
                                                        <th>Net Mentor Payout</th>
                                                        <th>Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {group.sessions.map((s) => (
                                                        <tr key={s.bookingId}>
                                                            <td>
                                                                <strong>{s.learnerName}</strong>
                                                                <small style={{ display: "block", color: "#64748b" }}>{s.learnerEmail}</small>
                                                            </td>
                                                            <td>
                                                                {s.date} • {s.time} ({s.duration}m)
                                                            </td>
                                                            <td>₹{s.grossAmount.toLocaleString("en-IN")}</td>
                                                            <td>₹{s.platformFee.toLocaleString("en-IN")}</td>
                                                            <td>
                                                                <strong style={{ color: "#176b4e" }}>₹{s.netAmount.toLocaleString("en-IN")}</strong>
                                                                {s.isLegacy && (
                                                                    <span style={{ marginLeft: "6px", fontSize: "10px", background: "#fef3c7", color: "#b45309", padding: "1px 5px", borderRadius: "3px" }}>
                                                                        Legacy
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openSettleModal(group, s)}
                                                                    style={{
                                                                        padding: "4px 10px",
                                                                        background: "#edf7f2",
                                                                        color: "#087456",
                                                                        border: "1px solid #cce8dc",
                                                                        borderRadius: "4px",
                                                                        fontSize: "12px",
                                                                        fontWeight: 600,
                                                                        cursor: "pointer"
                                                                    }}
                                                                >
                                                                    Mark as Paid
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )
            )}

            {/* TAB 3: PAYOUT HISTORY */}
            {tab === "payout-history" && (
                <>
                    <div className="admin-users-panel" style={{ marginBottom: "20px" }}>
                        <div className="admin-users-toolbar">
                            <form onSubmit={handleHistorySearch} style={{ display: "flex", gap: "8px", flex: 1, minWidth: "260px" }}>
                                <label className="admin-search" style={{ flex: 1, margin: 0 }}>
                                    <span>⌕</span>
                                    <input
                                        type="search"
                                        placeholder="Search by mentor, learner, or payout reference / UTR..."
                                        value={historySearch}
                                        onChange={(e) => setHistorySearch(e.target.value)}
                                    />
                                </label>
                                <button type="submit" className="admin-outline-button" style={{ padding: "0 14px" }}>Search</button>
                            </form>
                        </div>
                    </div>

                    {loading ? (
                        <div className="admin-loading"><div className="admin-spinner" /><p>Loading payout history…</p></div>
                    ) : payoutHistory.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                            No settled payouts recorded yet.
                        </div>
                    ) : (
                        <div className="admin-table-wrap">
                            <table className="admin-sessions-overview-table">
                                <thead>
                                    <tr>
                                        <th>Payout Reference / UTR</th>
                                        <th>Mentor</th>
                                        <th>Learner</th>
                                        <th>Session Date</th>
                                        <th>Disbursed Net Amount</th>
                                        <th>Settled At</th>
                                        <th>Settled By</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payoutHistory.map((item) => (
                                        <tr key={item.bookingId}>
                                            <td>
                                                <code style={{ background: "#edf7f2", color: "#087456", padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>
                                                    {item.payoutReference}
                                                </code>
                                                {item.payoutNote && (
                                                    <small style={{ display: "block", color: "#64748b", marginTop: "2px" }}>{item.payoutNote}</small>
                                                )}
                                            </td>
                                            <td>
                                                <strong>{item.mentorName}</strong>
                                                <small style={{ display: "block", color: "#64748b" }}>{item.mentorEmail}</small>
                                                {item.mentorUpiId && (
                                                    <small style={{ display: "block", color: "#087456" }}>UPI: {item.mentorUpiId}</small>
                                                )}
                                            </td>
                                            <td>
                                                <strong>{item.learnerName}</strong>
                                                <small style={{ display: "block", color: "#64748b" }}>{item.learnerEmail}</small>
                                            </td>
                                            <td>{item.sessionDate} {item.sessionTime}</td>
                                            <td>
                                                <strong style={{ color: "#176b4e" }}>₹{item.netAmount.toLocaleString("en-IN")}</strong>
                                                <small style={{ display: "block", color: "#94a3b8" }}>Fee: ₹{item.platformFee}</small>
                                            </td>
                                            <td>
                                                {item.payoutAt ? new Date(item.payoutAt).toLocaleDateString() : "—"}
                                            </td>
                                            <td>
                                                <div>{item.settledByName}</div>
                                                <small style={{ color: "#64748b" }}>{item.settledByEmail}</small>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* TAB 4: REFUNDS */}
            {tab === "refunds" && (
                loading ? (
                    <div className="admin-loading"><div className="admin-spinner" /><p>Loading refunds queue…</p></div>
                ) : refundsList.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "48px 24px", color: "#64748b" }}>
                        <CheckCircle size={36} color="#059669" style={{ marginBottom: "12px" }} />
                        <h3 style={{ margin: "0 0 6px", color: "#10261f" }}>No pending refunds!</h3>
                        <p style={{ margin: 0 }}>Zero cancelled bookings awaiting learner refund.</p>
                    </div>
                ) : (
                    <div className="admin-table-wrap">
                        <table className="admin-sessions-overview-table">
                            <thead>
                                <tr>
                                    <th>Booking ID</th>
                                    <th>Learner</th>
                                    <th>Mentor</th>
                                    <th>Date</th>
                                    <th>Amount</th>
                                    <th>Reason</th>
                                    <th>Status & Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {refundsList.map((r) => (
                                    <tr key={r.bookingId}>
                                        <td><strong>#{String(r.bookingId).slice(-6).toUpperCase()}</strong></td>
                                        <td>
                                            <strong>{r.learnerName}</strong>
                                            <small style={{ display: "block", color: "#64748b" }}>{r.learnerEmail}</small>
                                        </td>
                                        <td>{r.mentorName}</td>
                                        <td>{r.date}</td>
                                        <td><strong style={{ color: "#176b4e" }}>₹{r.amount.toLocaleString("en-IN")}</strong></td>
                                        <td>
                                            <span style={{ fontSize: "12px", color: "#64748b" }}>{r.cancellationReason}</span>
                                        </td>
                                        <td>
                                            {r.isRefunded ? (
                                                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                                    <span style={{ background: "#edf7f2", color: "#087456", padding: "2px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, width: "fit-content" }}>
                                                        ✓ Refunded
                                                    </span>
                                                    <code style={{ fontSize: "10px", color: "#64748b" }}>{r.refundId}</code>
                                                </div>
                                            ) : r.canCallRazorpay ? (
                                                <button
                                                    type="button"
                                                    onClick={() => openRefundModal(r)}
                                                    style={{
                                                        padding: "5px 12px",
                                                        background: "#176b4e",
                                                        color: "#fff",
                                                        borderRadius: "5px",
                                                        border: "none",
                                                        fontWeight: 600,
                                                        fontSize: "12px",
                                                        cursor: "pointer"
                                                    }}
                                                >
                                                    Refund via Razorpay
                                                </button>
                                            ) : (
                                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                    <span style={{ background: "#fef3c7", color: "#b45309", padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 600 }}>
                                                        Manual refund needed
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => openRefundModal(r)}
                                                        style={{
                                                            padding: "3px 8px",
                                                            background: "#f1f5f9",
                                                            color: "#334155",
                                                            borderRadius: "4px",
                                                            border: "1px solid #cbd5e1",
                                                            fontSize: "11px",
                                                            cursor: "pointer"
                                                        }}
                                                    >
                                                        Mark Done
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            )}

            {/* SETTLEMENT MODAL */}
            {settleModal && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "rgba(0,0,0,0.6)",
                        zIndex: 9999,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "20px"
                    }}
                >
                    <div
                        style={{
                            background: "var(--card-bg, #ffffff)",
                            color: "var(--text-color, #0f172a)",
                            maxWidth: "520px",
                            width: "100%",
                            borderRadius: "12px",
                            padding: "28px",
                            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)"
                        }}
                    >
                        <h3 style={{ margin: "0 0 8px", fontSize: "18px", color: "#10261f" }}>Settle Mentor Payout</h3>
                        <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#64748b" }}>
                            Admin sends the payout manually via UPI or bank transfer outside the platform, then records the payout transaction reference here.
                        </p>

                        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "14px", marginBottom: "18px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                                <span style={{ fontSize: "13px", color: "#64748b" }}>Mentor:</span>
                                <strong style={{ fontSize: "13px" }}>{settleModal.mentorName}</strong>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                                <span style={{ fontSize: "13px", color: "#64748b" }}>Mentor UPI ID:</span>
                                <code style={{ fontSize: "12px", color: "#087456", fontWeight: 700 }}>
                                    {settleModal.mentorUpi || "⚠️ Not set on profile"}
                                </code>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                                <span style={{ fontSize: "13px", color: "#64748b" }}>Sessions to Settle:</span>
                                <span style={{ fontSize: "13px", fontWeight: 600 }}>{settleModal.sessionsCount} session(s)</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #e2e8f0", paddingTop: "8px", marginTop: "8px" }}>
                                <span style={{ fontSize: "14px", fontWeight: 700, color: "#10261f" }}>Total Net Payout:</span>
                                <strong style={{ fontSize: "18px", color: "#176b4e" }}>₹{settleModal.netTotal.toLocaleString("en-IN")}</strong>
                            </div>
                        </div>

                        {modalError && (
                            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: "8px 12px", borderRadius: "6px", fontSize: "13px", marginBottom: "14px" }}>
                                ⚠️ {modalError}
                            </div>
                        )}

                        <form onSubmit={handleConfirmSettle}>
                            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>
                                Payout Reference / Bank UTR / IMPS ID <span style={{ color: "#dc2626" }}>*</span>
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. UTR12345678 or BANK_TXN_987654"
                                value={modalRef}
                                onChange={(e) => setModalRef(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "10px 12px",
                                    borderRadius: "6px",
                                    border: "1px solid #cbd5e1",
                                    fontSize: "14px",
                                    marginBottom: "14px"
                                }}
                            />

                            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>
                                Optional Note
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Disbursed via HDFC NetBanking"
                                value={modalNote}
                                onChange={(e) => setModalNote(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "10px 12px",
                                    borderRadius: "6px",
                                    border: "1px solid #cbd5e1",
                                    fontSize: "14px",
                                    marginBottom: "20px"
                                }}
                            />

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                                <button
                                    type="button"
                                    onClick={() => setSettleModal(null)}
                                    disabled={settleBusy}
                                    style={{
                                        padding: "8px 16px",
                                        background: "#f1f5f9",
                                        color: "#334155",
                                        borderRadius: "6px",
                                        border: "none",
                                        cursor: "pointer",
                                        fontWeight: 600
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={settleBusy || modalRef.trim().length < 8}
                                    style={{
                                        padding: "8px 18px",
                                        background: "#176b4e",
                                        color: "#ffffff",
                                        borderRadius: "6px",
                                        border: "none",
                                        cursor: "pointer",
                                        fontWeight: 700
                                    }}
                                >
                                    {settleBusy ? "Settling…" : "Confirm & Settle"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* REFUND MODAL */}
            {refundModal && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "rgba(0,0,0,0.6)",
                        zIndex: 9999,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "20px"
                    }}
                >
                    <div
                        style={{
                            background: "var(--card-bg, #ffffff)",
                            color: "var(--text-color, #0f172a)",
                            maxWidth: "480px",
                            width: "100%",
                            borderRadius: "12px",
                            padding: "24px",
                            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)"
                        }}
                    >
                        <h3 style={{ margin: "0 0 8px", fontSize: "17px", color: "#10261f" }}>
                            {refundModal.canCallRazorpay ? "Process Razorpay Refund" : "Record Manual Refund"}
                        </h3>
                        <p style={{ margin: "0 0 14px", fontSize: "13px", color: "#64748b" }}>
                            {refundModal.canCallRazorpay
                                ? `The Razorpay API will be called immediately to refund ₹${refundModal.amount} back to ${refundModal.learnerName}'s original payment source.`
                                : `This is a legacy booking without Razorpay ID. Verify you have transferred ₹${refundModal.amount} to ${refundModal.learnerName} manually.`}
                        </p>

                        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>
                            Refund Reason / Note
                        </label>
                        <input
                            type="text"
                            value={refundNote}
                            onChange={(e) => setRefundNote(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "8px 12px",
                                borderRadius: "6px",
                                border: "1px solid #cbd5e1",
                                fontSize: "13px",
                                marginBottom: "18px"
                            }}
                        />

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                            <button
                                type="button"
                                onClick={() => setRefundModal(null)}
                                disabled={refundBusy}
                                style={{
                                    padding: "8px 14px",
                                    background: "#f1f5f9",
                                    color: "#334155",
                                    borderRadius: "6px",
                                    border: "none",
                                    cursor: "pointer"
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmRefund}
                                disabled={refundBusy}
                                style={{
                                    padding: "8px 16px",
                                    background: "#176b4e",
                                    color: "#ffffff",
                                    borderRadius: "6px",
                                    border: "none",
                                    fontWeight: 700,
                                    cursor: "pointer"
                                }}
                            >
                                {refundBusy ? "Processing…" : "Confirm Refund"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
// @teamcosmiccoders
