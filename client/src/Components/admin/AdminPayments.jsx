import { useState, useEffect } from "react";
import {
    getAdminPayments,
    getAdminPayouts,
    markAdminPaidOut,
    refundAdminBooking,
    downloadPaymentLedger
} from "../../services/adminService";
import { CreditCard, CheckCircle, Clock, AlertTriangle, Search, Filter, RefreshCw, Download } from "lucide-react";

export default function AdminPayments({ token }) {
    const [tab, setTab] = useState("all-payments"); // "all-payments" | "payouts"
    const [payments, setPayments] = useState([]);
    const [payoutsList, setPayoutsList] = useState([]);
    const [stats, setStats] = useState({ totalCollected: 0, paidCount: 0, awaitingCount: 0, failedCount: 0 });
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionMsg, setActionMsg] = useState("");
    const [busyId, setBusyId] = useState(null);

    // Filters for All Payments
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    // Form states for payouts & refunds
    const [payoutRefs, setPayoutRefs] = useState({});
    const [refundReasons, setRefundReasons] = useState({});

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
            } else {
                const res = await getAdminPayouts(token);
                setPayoutsList(res.bookings || []);
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

    // Handle search with enter or button
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setPagination((prev) => ({ ...prev, page: 1 }));
        loadPaymentsData();
    };

    async function handlePayout(bookingId) {
        setError("");
        setActionMsg("");
        setBusyId(bookingId);
        try {
            await markAdminPaidOut(token, bookingId, {
                payoutRef: payoutRefs[bookingId] || `PAYOUT_${Date.now()}`,
                note: "Paid out to mentor"
            });
            setActionMsg("✓ Mentor payout recorded successfully.");
            setPayoutsList((prev) => prev.filter((b) => b._id !== bookingId));
        } catch (err) {
            setError(err.message || "Failed to mark payout");
        } finally {
            setBusyId(null);
        }
    }

    async function handleRefund(bookingId) {
        const reason = refundReasons[bookingId]?.trim();
        if (!reason) {
            setError("Please specify a refund reason.");
            return;
        }

        setError("");
        setActionMsg("");
        setBusyId(bookingId);
        try {
            await refundAdminBooking(token, bookingId, { reason });
            setActionMsg("✓ Booking refunded and cancelled.");
            setPayoutsList((prev) => prev.filter((b) => b._id !== bookingId));
        } catch (err) {
            setError(err.message || "Failed to process refund");
        } finally {
            setBusyId(null);
        }
    }

    function renderStatusPill(status, booking) {
        const st = status || booking?.payment?.status || booking?.paymentStatus;
        const config = {
            paid: { label: "Paid", bg: "#ecfdf5", color: "#065f46", border: "#a7f3d0" },
            confirmed: { label: "Paid", bg: "#ecfdf5", color: "#065f46", border: "#a7f3d0" },
            verified: { label: "Paid", bg: "#ecfdf5", color: "#065f46", border: "#a7f3d0" },
            awaiting_payment: { label: "Awaiting", bg: "#fef3c7", color: "#92400e", border: "#fde68a" },
            unpaid: { label: "Awaiting", bg: "#fef3c7", color: "#92400e", border: "#fde68a" },
            payment_submitted: { label: "Submitted", bg: "#eff6ff", color: "#1e40af", border: "#bfdbfe" },
            failed: { label: "Failed", bg: "#fef2f2", color: "#991b1b", border: "#fecaca" },
            rejected: { label: "Rejected", bg: "#fef2f2", color: "#991b1b", border: "#fecaca" },
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

    return (
        <section className="admin-content-section">
            <div className="admin-section-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                <div>
                    <p className="admin-eyebrow">FINANCIAL & PAYMENT OPERATIONS</p>
                    <h2>Razorpay Platform Payments</h2>
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
                    <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#94a3b8" }}>Auto-verified via Razorpay</p>
                </div>
                <div style={{ background: "var(--card-bg, #ffffff)", border: "1px solid var(--border, #e2e8f0)", borderRadius: "10px", padding: "16px" }}>
                    <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>PAID SESSIONS</span>
                    <h3 style={{ margin: "6px 0 0", fontSize: "24px", color: "#0f766e" }}>{stats.paidCount || 0}</h3>
                    <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#94a3b8" }}>Successful checkouts</p>
                </div>
                <div style={{ background: "var(--card-bg, #ffffff)", border: "1px solid var(--border, #e2e8f0)", borderRadius: "10px", padding: "16px" }}>
                    <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>AWAITING PAYMENT</span>
                    <h3 style={{ margin: "6px 0 0", fontSize: "24px", color: "#d97706" }}>{stats.awaitingCount || 0}</h3>
                    <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#94a3b8" }}>Approved sessions pending pay</p>
                </div>
                <div style={{ background: "var(--card-bg, #ffffff)", border: "1px solid var(--border, #e2e8f0)", borderRadius: "10px", padding: "16px" }}>
                    <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>FAILED PAYMENTS</span>
                    <h3 style={{ margin: "6px 0 0", fontSize: "24px", color: "#dc2626" }}>{stats.failedCount || 0}</h3>
                    <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#94a3b8" }}>Failed or declined transactions</p>
                </div>
            </div>

            {/* TAB SELECTOR */}
            <div style={{ display: "flex", gap: "10px", margin: "16px 0", borderBottom: "1px solid var(--border, #e2e8f0)", paddingBottom: "8px" }}>
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
                    Pending Mentor Payouts ({payoutsList.length})
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

            {tab === "all-payments" && (
                <>
                    {/* TOOLBAR: SEARCH & STATUS FILTER */}
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

            {/* PENDING MENTOR PAYOUTS TAB */}
            {tab === "payouts" && (
                loading ? (
                    <div className="admin-loading"><div className="admin-spinner" /><p>Loading payouts…</p></div>
                ) : payoutsList.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "32px", color: "#64748b" }}>
                        ✓ No pending mentor payouts! All completed sessions have been disbursed.
                    </div>
                ) : (
                    <div style={{ display: "grid", gap: "16px" }}>
                        {payoutsList.map((b) => (
                            <div
                                key={b._id}
                                style={{
                                    background: "var(--card-bg, #ffffff)",
                                    border: "1px solid var(--border, #e2e8f0)",
                                    borderRadius: "10px",
                                    padding: "18px",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
                                }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
                                    <div>
                                        <div style={{ fontSize: "12px", color: "#64748b" }}>BOOKING #{String(b._id).slice(-8).toUpperCase()}</div>
                                        <strong style={{ fontSize: "18px", color: "#176b4e" }}>
                                            ₹{b.payment?.mentorPayout || b.payment?.amount || 0}
                                        </strong>
                                        <span style={{ marginLeft: "8px", fontSize: "12px", color: "#64748b" }}>
                                            (Session Total: ₹{b.payment?.amount || 0} | Platform Fee: ₹{b.payment?.platformFee || 0})
                                        </span>
                                    </div>
                                    <div style={{ fontSize: "13px", textAlign: "right" }}>
                                        <div><strong>Mentor:</strong> {b.mentor?.name} ({b.mentor?.email})</div>
                                        <div style={{ color: "#64748b" }}>Completed: {b.date} at {b.time}</div>
                                    </div>
                                </div>

                                <div style={{ marginTop: "14px", display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
                                    <input
                                        type="text"
                                        placeholder="Payout Transaction Ref (e.g. UTR / IMPS)"
                                        value={payoutRefs[b._id] || ""}
                                        onChange={(e) => setPayoutRefs({ ...payoutRefs, [b._id]: e.target.value })}
                                        style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", flex: 1, minWidth: "220px" }}
                                    />
                                    <button
                                        type="button"
                                        disabled={busyId === b._id}
                                        onClick={() => handlePayout(b._id)}
                                        style={{
                                            padding: "8px 16px",
                                            background: "#176b4e",
                                            color: "#fff",
                                            borderRadius: "6px",
                                            border: "none",
                                            fontWeight: "600",
                                            cursor: "pointer"
                                        }}
                                    >
                                        Mark Paid Out
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}
        </section>
    );
}
