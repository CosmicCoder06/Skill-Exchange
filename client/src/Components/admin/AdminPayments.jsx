import { useState, useEffect } from "react";
import {
    getAdminPendingPayments,
    verifyAdminPayment,
    getAdminPayouts,
    markAdminPaidOut,
    refundAdminBooking,
    downloadPaymentLedger
} from "../../services/adminService";

export default function AdminPayments({ token }) {
    const [tab, setTab] = useState("pending"); // "pending" | "payouts"
    const [pendingList, setPendingList] = useState([]);
    const [payoutsList, setPayoutsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionMsg, setActionMsg] = useState("");
    const [busyId, setBusyId] = useState(null);

    // Image preview modal
    const [previewImage, setPreviewImage] = useState(null);

    // Form states for approval/rejection per booking
    const [approveChecks, setApproveChecks] = useState({});
    const [paytmRefs, setPaytmRefs] = useState({});
    const [rejectReasons, setRejectReasons] = useState({});

    // Payout & refund form states
    const [payoutRefs, setPayoutRefs] = useState({});
    const [refundReasons, setRefundReasons] = useState({});

    async function loadData() {
        setLoading(true);
        setError("");
        try {
            if (tab === "pending") {
                const res = await getAdminPendingPayments(token);
                setPendingList(res.bookings || []);
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
        if (token) loadData();
    }, [token, tab]);

    async function handleVerify(bookingId, approve) {
        setError("");
        setActionMsg("");

        if (approve) {
            if (!approveChecks[bookingId]) {
                setError("Please confirm: 'Paytm me exact amount aur UTR mila' checkbox is mandatory.");
                return;
            }
        } else {
            if (!rejectReasons[bookingId]?.trim()) {
                setError("Rejection reason is mandatory.");
                return;
            }
        }

        setBusyId(bookingId);
        try {
            await verifyAdminPayment(token, bookingId, {
                approve,
                matchedExact: Boolean(approveChecks[bookingId]),
                paytmTxnRef: paytmRefs[bookingId] || "",
                rejectReason: rejectReasons[bookingId] || ""
            });

            setActionMsg(approve ? "✓ Payment approved and session unlocked!" : "Payment rejected.");
            setPendingList((prev) => prev.filter((b) => b._id !== bookingId));
        } catch (err) {
            setError(err.message || "Action failed");
        } finally {
            setBusyId(null);
        }
    }

    async function handlePayout(bookingId) {
        setError("");
        setActionMsg("");
        setBusyId(bookingId);
        try {
            await markAdminPaidOut(token, bookingId, {
                payoutRef: payoutRefs[bookingId] || "MANUAL_UPI_TRANSFER",
                note: "Paid out via Paytm Business UPI"
            });
            setActionMsg("✓ Mentor payout recorded as paid out.");
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

    return (
        <section className="admin-content-section">
            <div className="admin-section-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                <div>
                    <p className="admin-eyebrow">PAYMENT & PAYOUT OPERATIONS</p>
                    <h2>Platform Payment Verification</h2>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <button
                        type="button"
                        className="admin-outline-button"
                        onClick={() => downloadPaymentLedger(token)}
                    >
                        📥 Export Ledger (CSV)
                    </button>
                    <button
                        type="button"
                        className="admin-outline-button"
                        onClick={loadData}
                    >
                        ↻ Refresh
                    </button>
                </div>
            </div>

            {/* TAB SELECTOR */}
            <div style={{ display: "flex", gap: "10px", margin: "16px 0", borderBottom: "1px solid var(--border, #e2e8f0)", paddingBottom: "8px" }}>
                <button
                    type="button"
                    style={{
                        padding: "8px 16px",
                        fontWeight: tab === "pending" ? "700" : "500",
                        background: tab === "pending" ? "#0f766e" : "transparent",
                        color: tab === "pending" ? "#ffffff" : "inherit",
                        borderRadius: "6px",
                        border: "none",
                        cursor: "pointer"
                    }}
                    onClick={() => setTab("pending")}
                >
                    Pending Verifications ({pendingList.length})
                </button>
                <button
                    type="button"
                    style={{
                        padding: "8px 16px",
                        fontWeight: tab === "payouts" ? "700" : "500",
                        background: tab === "payouts" ? "#0f766e" : "transparent",
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

            {/* VERIFICATION WARNING BANNER */}
            {tab === "pending" && (
                <div style={{
                    background: "#fffbeb",
                    border: "1px solid #fde68a",
                    borderLeft: "4px solid #f59e0b",
                    padding: "12px 16px",
                    borderRadius: "6px",
                    marginBottom: "16px",
                    color: "#92400e",
                    fontSize: "13.5px",
                    fontWeight: "600"
                }}>
                    ⚠️ Paytm for Business app me amount aur UTR match karke hi approve karo. Note field par bharosa mat karo.
                </div>
            )}

            {loading ? (
                <div className="admin-loading"><div className="admin-spinner" /><p>Loading payments…</p></div>
            ) : tab === "pending" ? (
                /* PENDING PAYMENTS LIST */
                pendingList.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "32px", color: "#64748b" }}>
                        ✓ No pending payments awaiting verification!
                    </div>
                ) : (
                    <div style={{ display: "grid", gap: "16px" }}>
                        {pendingList.map((b) => (
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
                                        <strong style={{ fontSize: "18px", color: "#0f766e" }}>
                                            ₹{b.payment?.amount || b.grossAmountWithGst || 0}
                                        </strong>
                                        <span style={{ marginLeft: "8px", fontSize: "12px", color: "#64748b" }}>
                                            (Fee: ₹{b.payment?.platformFee || 0} | Mentor Payout: ₹{b.payment?.mentorPayout || 0})
                                        </span>
                                    </div>
                                    <div style={{ fontSize: "13px", textAlign: "right" }}>
                                        <div><strong>Date:</strong> {b.date} at {b.time}</div>
                                        <div style={{ color: "#64748b" }}>Duration: {b.duration} mins</div>
                                    </div>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px", marginTop: "12px" }}>
                                    <div>
                                        <div style={{ fontSize: "12px", color: "#64748b" }}>LEARNER</div>
                                        <div><strong>{b.learner?.name}</strong></div>
                                        <div style={{ fontSize: "12px", color: "#64748b" }}>{b.learner?.email}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "12px", color: "#64748b" }}>MENTOR</div>
                                        <div><strong>{b.mentor?.name}</strong></div>
                                        <div style={{ fontSize: "12px", color: "#64748b" }}>{b.mentor?.email}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "12px", color: "#64748b" }}>SUBMITTED UTR (12 DIGITS)</div>
                                        <code style={{ fontSize: "15px", fontWeight: "700", background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px" }}>
                                            {b.payment?.utr || "N/A"}
                                        </code>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "12px", color: "#64748b" }}>PAYMENT SCREENSHOT</div>
                                        {b.payment?.screenshot ? (
                                            <button
                                                type="button"
                                                onClick={() => setPreviewImage(b.payment.screenshot)}
                                                style={{ fontSize: "12px", color: "#0284c7", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", padding: 0 }}
                                            >
                                                👁 View Screenshot Proof
                                            </button>
                                        ) : (
                                            <span style={{ fontSize: "12px", color: "#94a3b8" }}>No screenshot</span>
                                        )}
                                    </div>
                                </div>

                                {/* APPROVAL & REJECTION ACTIONS */}
                                <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px dashed #cbd5e1", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "14px" }}>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>
                                            <input
                                                type="checkbox"
                                                checked={Boolean(approveChecks[b._id])}
                                                onChange={(e) => setApproveChecks({ ...approveChecks, [b._id]: e.target.checked })}
                                            />
                                            <span style={{ color: approveChecks[b._id] ? "#15803d" : "#b45309" }}>
                                                ✓ Paytm me exact amount aur UTR mila
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Optional Paytm Txn Reference"
                                            value={paytmRefs[b._id] || ""}
                                            onChange={(e) => setPaytmRefs({ ...paytmRefs, [b._id]: e.target.value })}
                                            style={{ padding: "4px 8px", fontSize: "12px", borderRadius: "4px", border: "1px solid #cbd5e1", width: "240px" }}
                                        />
                                    </div>

                                    <div style={{ display: "flex", gap: "8px" }}>
                                        <button
                                            type="button"
                                            disabled={busyId === b._id || !approveChecks[b._id]}
                                            onClick={() => handleVerify(b._id, true)}
                                            style={{
                                                background: approveChecks[b._id] ? "#16a34a" : "#94a3b8",
                                                color: "#ffffff",
                                                border: "none",
                                                padding: "8px 14px",
                                                borderRadius: "6px",
                                                cursor: approveChecks[b._id] ? "pointer" : "not-allowed",
                                                fontWeight: "600"
                                            }}
                                        >
                                            {busyId === b._id ? "Processing…" : "Approve Payment"}
                                        </button>
                                        <button
                                            type="button"
                                            disabled={busyId === b._id}
                                            onClick={() => {
                                                const reason = prompt("Enter mandatory rejection reason (visible to learner):");
                                                if (reason) {
                                                    setRejectReasons({ ...rejectReasons, [b._id]: reason });
                                                    verifyAdminPayment(token, b._id, { approve: false, rejectReason: reason })
                                                        .then(() => {
                                                            setActionMsg("Payment rejected with reason.");
                                                            setPendingList((prev) => prev.filter((item) => item._id !== b._id));
                                                        })
                                                        .catch((e) => setError(e.message));
                                                }
                                            }}
                                            style={{
                                                background: "#dc2626",
                                                color: "#ffffff",
                                                border: "none",
                                                padding: "8px 14px",
                                                borderRadius: "6px",
                                                cursor: "pointer",
                                                fontWeight: "600"
                                            }}
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            ) : (
                /* PAYOUTS LIST */
                payoutsList.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "32px", color: "#64748b" }}>
                        No completed sessions awaiting payout.
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
                                    padding: "18px"
                                }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px" }}>
                                    <div>
                                        <strong>Session #{String(b._id).slice(-8).toUpperCase()}</strong> - Completed
                                    </div>
                                    <div style={{ color: "#0f766e", fontWeight: "700", fontSize: "16px" }}>
                                        Mentor Payout: ₹{b.payment?.mentorPayout || 0}
                                    </div>
                                </div>
                                <div style={{ margin: "10px 0", fontSize: "13px" }}>
                                    Mentor: <strong>{b.mentor?.name}</strong> ({b.mentor?.email})
                                </div>

                                <div style={{ display: "flex", gap: "10px", marginTop: "12px", alignItems: "center", flexWrap: "wrap" }}>
                                    <input
                                        type="text"
                                        placeholder="Paytm/UPI payout reference"
                                        value={payoutRefs[b._id] || ""}
                                        onChange={(e) => setPayoutRefs({ ...payoutRefs, [b._id]: e.target.value })}
                                        style={{ padding: "6px 10px", fontSize: "12px", borderRadius: "4px", border: "1px solid #cbd5e1", width: "240px" }}
                                    />
                                    <button
                                        type="button"
                                        disabled={busyId === b._id}
                                        onClick={() => handlePayout(b._id)}
                                        style={{ background: "#0f766e", color: "#fff", border: "none", padding: "6px 14px", borderRadius: "4px", cursor: "pointer", fontWeight: "600" }}
                                    >
                                        Mark Paid Out
                                    </button>
                                    <button
                                        type="button"
                                        disabled={busyId === b._id}
                                        onClick={() => {
                                            const reason = prompt("Enter cancellation/refund reason:");
                                            if (reason) {
                                                setRefundReasons({ ...refundReasons, [b._id]: reason });
                                                handleRefund(b._id);
                                            }
                                        }}
                                        style={{ background: "#f87171", color: "#fff", border: "none", padding: "6px 14px", borderRadius: "4px", cursor: "pointer" }}
                                    >
                                        Refund
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}

            {/* SCREENSHOT LIGHTBOX MODAL */}
            {previewImage && (
                <div
                    onClick={() => setPreviewImage(null)}
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        background: "rgba(0,0,0,0.75)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 9999,
                        padding: "20px"
                    }}
                >
                    <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", padding: "16px", borderRadius: "8px", maxWidth: "90%", maxHeight: "90%", overflow: "auto" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                            <strong>Payment Proof Screenshot</strong>
                            <button onClick={() => setPreviewImage(null)} style={{ border: "none", background: "none", fontSize: "16px", cursor: "pointer" }}>✕</button>
                        </div>
                        <img src={previewImage} alt="Payment Screenshot Proof" style={{ maxWidth: "100%", maxHeight: "70vh", display: "block" }} />
                    </div>
                </div>
            )}
        </section>
    );
}
