import { useEffect, useState } from "react";
import { CheckCircle2, ShieldCheck, AlertCircle, XCircle, Clock, CalendarClock } from "lucide-react";

function formatCurrency(num) {
    const val = Number(num) || 0;
    if (val === 0) return "₹0";
    if (val % 1 === 0) {
        return `₹${val.toLocaleString("en-IN")}`;
    }
    return `₹${val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function PaymentReceipt({
    booking,
    token,
    currentUserId,
    onBookingUpdated
}) {
    const [bookingData, setBookingData] = useState(booking);
    const [status, setStatus] = useState(booking.payment?.status || booking.paymentStatus || "awaiting_payment");
    const [bookingStatus, setBookingStatus] = useState(booking.status);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    useEffect(() => {
        setBookingData(booking);
        setStatus(booking.payment?.status || booking.paymentStatus || "awaiting_payment");
        setBookingStatus(booking.status);
    }, [booking]);

    const isMentor =
        String(booking.mentor?._id || booking.mentor?.id || booking.mentor) === String(currentUserId);
    const isLearner =
        String(booking.learner?._id || booking.learner?.id || booking.learner) === String(currentUserId) || !isMentor;

    const duration = Number(booking.duration) || 60;
    const mentorName = booking.mentor?.name || "Mentor";

    // Standardized server amounts
    const sessionAmount = Number(
        bookingData.payment?.amount ||
        bookingData.baseSessionAmount ||
        bookingData.grossAmountWithGst ||
        bookingData.paymentAmount ||
        0
    );
    const platformFee = Number(bookingData.payment?.platformFee || bookingData.mentorPlatformFee || 0);
    const mentorPayout = Number(bookingData.payment?.mentorPayout || bookingData.mentorEarnings || sessionAmount);

    const isCompleted = bookingStatus === "completed" || bookingData.status === "completed";
    const isCancelled = bookingStatus === "cancelled" || bookingData.status === "cancelled";
    const isDeclined = bookingStatus === "rejected" || bookingData.status === "rejected" || bookingStatus === "declined";
    const isTerminal = isCompleted || isCancelled || isDeclined;

    const currentPaymentStatus = bookingData.payment?.status || bookingData.paymentStatus || status || "awaiting_payment";
    const isPaid = ["paid", "confirmed", "verified"].includes(currentPaymentStatus);

    const isApproved = bookingStatus === "approved" || bookingData.status === "approved";

    // Can pay ONLY when learner, session approved by mentor, awaiting payment, and amount > 0
    const canPay =
        isLearner &&
        !isTerminal &&
        !isPaid &&
        isApproved &&
        sessionAmount > 0 &&
        ["awaiting_payment", "unpaid", "awaiting_approval", "failed", "rejected"].includes(currentPaymentStatus);

    // Razorpay Checkout Trigger
    const handleRazorpayPay = async () => {
        setError("");
        setSuccessMsg("");
        setBusy(true);

        try {
            const activeToken = token || localStorage.getItem("token");
            const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

            // 1. Create order on backend
            const orderRes = await fetch(`${apiBase}/payments/create-order`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${activeToken}`
                },
                body: JSON.stringify({
                    bookingId: booking._id
                })
            });

            const orderData = await orderRes.json();
            if (!orderRes.ok) {
                throw new Error(orderData.message || "Unable to initiate Razorpay payment.");
            }

            // 2. Ensure Razorpay script is loaded
            if (typeof window.Razorpay === "undefined") {
                throw new Error("Razorpay Checkout SDK is still loading. Please refresh and try again.");
            }

            const options = {
                key: orderData.key,
                amount: orderData.amount,
                currency: orderData.currency || "INR",
                name: "Skill Exchange",
                description: `Skill Exchange Session with ${mentorName} (${duration} mins)`,
                order_id: orderData.orderId,
                prefill: {
                    name: booking.learner?.name || "",
                    email: booking.learner?.email || ""
                },
                theme: {
                    color: "#176b4e"
                },
                handler: async function (response) {
                    try {
                        setBusy(true);
                        const verifyRes = await fetch(`${apiBase}/payments/verify`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${activeToken}`
                            },
                            body: JSON.stringify({
                                bookingId: booking._id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            })
                        });

                        const verifyData = await verifyRes.json();
                        if (!verifyRes.ok) {
                            throw new Error(verifyData.message || "Payment signature verification failed.");
                        }

                        setStatus("paid");
                        setSuccessMsg("✓ Payment verified successfully! Your session is confirmed.");
                        const updated = verifyData.booking || {
                            ...bookingData,
                            paymentStatus: "paid",
                            status: "accepted",
                            razorpayPaymentId: response.razorpay_payment_id,
                            payment: {
                                ...bookingData.payment,
                                status: "paid",
                                razorpayPaymentId: response.razorpay_payment_id
                            }
                        };
                        setBookingData(updated);
                        if (onBookingUpdated) {
                            onBookingUpdated(updated);
                        }
                    } catch (verifyErr) {
                        setError(verifyErr.message || "Failed to verify payment with server.");
                    } finally {
                        setBusy(false);
                    }
                },
                modal: {
                    ondismiss: function () {
                        setBusy(false);
                        setError("Payment dismissed. You can click 'Pay' whenever you are ready.");
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on("payment.failed", function (resp) {
                setBusy(false);
                const reason = resp.error?.description || resp.error?.reason || "Payment was declined or failed.";
                setError(`Payment Failed: ${reason}`);
            });

            rzp.open();
        } catch (err) {
            setBusy(false);
            setError(err.message || "Error initiating payment.");
        }
    };

    function renderStatusBadge(st) {
        const key = st || currentPaymentStatus;

        if (!isTerminal && !isPaid) {
            const bStatus = bookingStatus || bookingData.status;
            if (bStatus === "pending") {
                return <span className="payment-pill badge-status-pending">Awaiting Approval</span>;
            }
            if (bStatus === "slots_offered") {
                return <span className="payment-pill badge-status-pending">Slot Choice Needed</span>;
            }
            if (bStatus === "approved") {
                return <span className="payment-pill badge-status-unpaid">Payment Due</span>;
            }
        }

        const config = {
            paid: { label: "Paid", cls: "badge-status-verified" },
            confirmed: { label: "Paid", cls: "badge-status-verified" },
            verified: { label: "Paid", cls: "badge-status-verified" },
            awaiting_payment: { label: "Awaiting Payment", cls: "badge-status-unpaid" },
            unpaid: { label: "Awaiting Payment", cls: "badge-status-unpaid" },
            awaiting_approval: { label: "Awaiting Approval", cls: "badge-status-pending" },
            payment_submitted: { label: "Payment Submitted", cls: "badge-status-verify" },
            failed: { label: "Payment Failed", cls: "badge-status-declined" },
            rejected: { label: "Payment Failed", cls: "badge-status-declined" },
            refunded: { label: "Refunded", cls: "badge-status-refunded" },
            paid_out: { label: "Paid Out", cls: "badge-status-verified" },
            not_required: { label: "Free Session", cls: "badge-status-free" },
            cancelled: { label: "Cancelled", cls: "badge-status-cancelled" },
            declined: { label: "Declined", cls: "badge-status-declined" }
        }[key] || {
            label: String(key).replace(/_/g, " ").toUpperCase(),
            cls: "badge-status-default"
        };

        return <span className={`payment-pill ${config.cls}`}>{config.label}</span>;
    }

    // ==========================================
    // 1. LEARNER RECEIPT & RAZORPAY CHECKOUT
    // ==========================================
    if (isLearner) {
        return (
            <div className="payment-receipt-container">
                <section className="receipt-role-card booker-receipt-card">
                    <div className="receipt-role-header">
                        <span className="receipt-card-title">Session Payment</span>
                        <span className="receipt-duration-chip">⏱ {duration} MINS</span>
                    </div>

                    <div className="receipt-details-list">
                        <div className="receipt-detail-item">
                            <span className="item-label">Mentor</span>
                            <strong className="item-val">{mentorName}</strong>
                        </div>
                        <div className="receipt-detail-item item-total-row">
                            <span className="item-label">Total Amount Due</span>
                            <strong className="item-val total-amount">{sessionAmount === 0 ? "Free" : formatCurrency(sessionAmount)}</strong>
                        </div>
                        <div className="receipt-detail-item">
                            <span className="item-label">Payment Status</span>
                            <div className="item-val">{renderStatusBadge(currentPaymentStatus)}</div>
                        </div>
                        {(bookingData.razorpayPaymentId || bookingData.payment?.razorpayPaymentId) && (
                            <div className="receipt-detail-item">
                                <span className="item-label">Razorpay Payment ID</span>
                                <code className="item-code">{bookingData.razorpayPaymentId || bookingData.payment?.razorpayPaymentId}</code>
                            </div>
                        )}
                    </div>

                    {/* TERMINAL STATUS BADGES */}
                    {isCompleted && (
                        <div className="session-terminal-badge-box completed" style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "6px 12px",
                            borderRadius: "999px",
                            background: "#ecfdf5",
                            color: "#065f46",
                            border: "1px solid #a7f3d0",
                            fontSize: "12px",
                            fontWeight: "700",
                            marginTop: "14px"
                        }}>
                            <CheckCircle2 size={14} />
                            <span>Session completed</span>
                        </div>
                    )}

                    {isCancelled && (
                        <div className="session-terminal-badge-box cancelled" style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "6px 12px",
                            borderRadius: "999px",
                            background: "#fef2f2",
                            color: "#991b1b",
                            border: "1px solid #fecaca",
                            fontSize: "12px",
                            fontWeight: "700",
                            marginTop: "14px"
                        }}>
                            <span>Session cancelled</span>
                        </div>
                    )}

                    {isDeclined && !isCancelled && (
                        <div className="session-terminal-badge-box declined" style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "6px 12px",
                            borderRadius: "999px",
                            background: "#fff1f2",
                            color: "#be123c",
                            border: "1px solid #fecdd3",
                            fontSize: "12px",
                            fontWeight: "700",
                            marginTop: "14px"
                        }}>
                            <XCircle size={14} />
                            <span>Request declined by mentor</span>
                        </div>
                    )}

                    {/* CONFIRMED / PAID NOTICE */}
                    {isPaid && (
                        <div style={{
                            background: "#ecfdf5",
                            border: "1px solid #6ee7b7",
                            color: "#065f46",
                            padding: "12px 14px",
                            borderRadius: "8px",
                            marginTop: "16px"
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "700", fontSize: "14px" }}>
                                <CheckCircle2 size={16} /> Payment Verified & Session Confirmed
                            </div>
                            <p style={{ margin: "4px 0 0 0", fontSize: "13px", lineHeight: "1.5" }}>
                                Your session booking is confirmed. Join the session meeting once your mentor shares the link.
                            </p>
                        </div>
                    )}

                    {/* AWAITING MENTOR APPROVAL NOTICE (Payment locked until mentor approves) */}
                    {!isPaid && !isTerminal && (bookingStatus === "pending" || bookingData.status === "pending") && (
                        <div style={{
                            background: "#fffbeb",
                            border: "1px solid #fde68a",
                            color: "#92400e",
                            padding: "12px 14px",
                            borderRadius: "8px",
                            marginTop: "16px",
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "10px"
                        }}>
                            <Clock size={18} style={{ flexShrink: 0, marginTop: "2px", color: "#b45309" }} />
                            <div>
                                <div style={{ fontWeight: "700", fontSize: "14px" }}>
                                    Awaiting Mentor Approval
                                </div>
                                <p style={{ margin: "4px 0 0 0", fontSize: "12.5px", lineHeight: "1.5", color: "#78350f" }}>
                                    Your session request has been submitted to ${mentorName}. Payment will unlock as soon as the mentor approves this time slot. You will not be charged before approval.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* SLOTS OFFERED NOTICE */}
                    {!isPaid && !isTerminal && (bookingStatus === "slots_offered" || bookingData.status === "slots_offered") && (
                        <div style={{
                            background: "#eff6ff",
                            border: "1px solid #bfdbfe",
                            color: "#1e40af",
                            padding: "12px 14px",
                            borderRadius: "8px",
                            marginTop: "16px",
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "10px"
                        }}>
                            <CalendarClock size={18} style={{ flexShrink: 0, marginTop: "2px", color: "#2563eb" }} />
                            <div>
                                <div style={{ fontWeight: "700", fontSize: "14px" }}>
                                    Alternate Slots Proposed
                                </div>
                                <p style={{ margin: "4px 0 0 0", fontSize: "12.5px", lineHeight: "1.5", color: "#1e3a8a" }}>
                                    ${mentorName} suggested alternative time slots. Please select a proposed slot below to proceed to payment.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* RAZORPAY INSTANT CHECKOUT BUTTON (ONLY WHEN APPROVED) */}
                    {canPay && (
                        <div className="receipt-razorpay-action-box" style={{ marginTop: "16px" }}>
                            <div style={{
                                background: "#ecfdf5",
                                border: "1px solid #a7f3d0",
                                color: "#065f46",
                                padding: "10px 14px",
                                borderRadius: "8px",
                                marginBottom: "12px",
                                fontSize: "13px",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px"
                            }}>
                                <CheckCircle2 size={16} color="#15803d" />
                                <span><strong>Time Slot Approved!</strong> Complete payment below to confirm and finalize your session.</span>
                            </div>
                            <button
                                type="button"
                                className="unlock-confirm-btn razorpay-pay-btn"
                                disabled={busy}
                                onClick={handleRazorpayPay}
                                style={{
                                    width: "100%",
                                    padding: "12px 16px",
                                    backgroundColor: "#176b4e",
                                    color: "#ffffff",
                                    border: "none",
                                    borderRadius: "8px",
                                    fontWeight: "700",
                                    fontSize: "15px",
                                    cursor: busy ? "not-allowed" : "pointer",
                                    opacity: busy ? 0.75 : 1,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "8px",
                                    boxShadow: "0 2px 6px rgba(23, 107, 78, 0.2)",
                                    transition: "background-color 0.15s ease"
                                }}
                            >
                                <ShieldCheck size={18} />
                                {busy ? "Connecting to Razorpay…" : `Pay ${formatCurrency(sessionAmount)}`}
                            </button>
                            <p style={{
                                fontSize: "12px",
                                color: "#64748b",
                                textAlign: "center",
                                margin: "8px 0 0 0"
                            }}>
                                🔒 Secure checkout via Razorpay • UPI, Cards & NetBanking
                            </p>
                        </div>
                    )}

                    {error && (
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            background: "#fef2f2",
                            border: "1px solid #fecaca",
                            color: "#b91c1c",
                            padding: "10px 12px",
                            borderRadius: "6px",
                            fontSize: "13px",
                            marginTop: "12px"
                        }}>
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    {successMsg && (
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            background: "#f0fdf4",
                            border: "1px solid #bbf7d0",
                            color: "#15803d",
                            padding: "10px 12px",
                            borderRadius: "6px",
                            fontSize: "13px",
                            marginTop: "12px"
                        }}>
                            <CheckCircle2 size={16} />
                            <span>{successMsg}</span>
                        </div>
                    )}
                </section>
            </div>
        );
    }

    // ==========================================
    // 2. MENTOR INVOICE
    // ==========================================
    return (
        <div className="payment-receipt-container">
            <section className="receipt-role-card mentor-invoice-card">
                <div className="receipt-role-header">
                    <span className="receipt-card-title">Host Earning Details</span>
                    <span className="receipt-duration-chip">⏱ {duration} MINS</span>
                </div>

                <div className="receipt-details-list">
                    <div className="receipt-detail-item">
                        <span className="item-label">Session Fee</span>
                        <strong className="item-val">{sessionAmount === 0 ? "Free session" : formatCurrency(sessionAmount)}</strong>
                    </div>
                    {sessionAmount > 0 && (
                        <>
                            {platformFee > 0 ? (
                                <div className="receipt-detail-item">
                                    <span className="item-label">Platform Fee ({bookingData.payment?.platformFeePercent || 0}%)</span>
                                    <strong className="item-val fee-deduct">-{formatCurrency(platformFee)}</strong>
                                </div>
                            ) : (
                                <div className="receipt-detail-item">
                                    <span className="item-label">Platform Fee</span>
                                    <strong className="item-val">₹0</strong>
                                </div>
                            )}
                            <div className="receipt-detail-item item-total-row">
                                <span className="item-label">Net Mentor Payout</span>
                                <strong className="item-val total-amount net-earnings">{formatCurrency(mentorPayout)}</strong>
                            </div>
                        </>
                    )}
                    <div className="receipt-detail-item">
                        <span className="item-label">Payment Status</span>
                        <div className="item-val">{renderStatusBadge(currentPaymentStatus)}</div>
                    </div>
                    {(bookingData.razorpayPaymentId || bookingData.payment?.razorpayPaymentId) && (
                        <div className="receipt-detail-item">
                            <span className="item-label">Razorpay Payment ID</span>
                            <code className="item-code">{bookingData.razorpayPaymentId || bookingData.payment?.razorpayPaymentId}</code>
                        </div>
                    )}
                    {bookingData.payment?.payoutRef && (
                        <div className="receipt-detail-item">
                            <span className="item-label">Payout Reference</span>
                            <code className="item-code">{bookingData.payment.payoutRef}</code>
                        </div>
                    )}
                </div>

                {isCompleted && (
                    <div className="session-terminal-badge-box completed" style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "6px 12px",
                        borderRadius: "999px",
                        background: "#ecfdf5",
                        color: "#065f46",
                        border: "1px solid #a7f3d0",
                        fontSize: "12px",
                        fontWeight: "700",
                        marginTop: "12px"
                    }}>
                        <CheckCircle2 size={14} />
                        <span>Session completed</span>
                    </div>
                )}

                {isCancelled && (
                    <div className="session-terminal-badge-box cancelled" style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "6px 12px",
                        borderRadius: "999px",
                        background: "#fef2f2",
                        color: "#991b1b",
                        border: "1px solid #fecaca",
                        fontSize: "12px",
                        fontWeight: "700",
                        marginTop: "12px"
                    }}>
                        <span>Session cancelled</span>
                    </div>
                )}

                {isDeclined && !isCancelled && (
                    <div className="session-terminal-badge-box declined" style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "6px 12px",
                        borderRadius: "999px",
                        background: "#fff1f2",
                        color: "#be123c",
                        border: "1px solid #fecdd3",
                        fontSize: "12px",
                        fontWeight: "700",
                        marginTop: "12px"
                    }}>
                        <XCircle size={14} />
                        <span>Session declined</span>
                    </div>
                )}

                <p className="mentor-fee-policy-footnote" style={{ marginTop: "12px", fontSize: "12px", color: "#64748b" }}>
                    * Payments are collected securely via Razorpay and disbursed directly to you upon session completion with 0% platform deductions.
                </p>

                {error && <p className="receipt-error-alert" role="alert">{error}</p>}
            </section>
        </div>
    );
}
