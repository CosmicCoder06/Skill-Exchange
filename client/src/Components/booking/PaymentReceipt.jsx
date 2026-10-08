import { useEffect, useState } from "react";
import { CheckCircle2, Clock } from "lucide-react";

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

    // QR & Submission states for learner
    const [qrData, setQrData] = useState(null);
    const [loadingQr, setLoadingQr] = useState(false);
    const [utr, setUtr] = useState(booking.payment?.utr || "");
    const [screenshot, setScreenshot] = useState(booking.payment?.screenshot || "");
    const [screenshotPreview, setScreenshotPreview] = useState(booking.payment?.screenshot || "");
    const [screenshotName, setScreenshotName] = useState("");

    useEffect(() => {
        setBookingData(booking);
        setStatus(booking.payment?.status || booking.paymentStatus || "awaiting_payment");
        setBookingStatus(booking.status);
        if (booking.payment?.utr) setUtr(booking.payment.utr);
        if (booking.payment?.screenshot) {
            setScreenshot(booking.payment.screenshot);
            setScreenshotPreview(booking.payment.screenshot);
        }
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

    // Fetch platform QR for learner when awaiting payment
    useEffect(() => {
        let active = true;
        const currentPaymentStatus = bookingData.payment?.status || bookingData.paymentStatus;
        const shouldLoadQr = isLearner && !isCompleted && !isCancelled && (currentPaymentStatus === "awaiting_payment" || currentPaymentStatus === "rejected" || currentPaymentStatus === "unpaid" || currentPaymentStatus === "awaiting_approval") && sessionAmount > 0;

        if (shouldLoadQr) {
            setLoadingQr(true);
            const activeToken = token || localStorage.getItem("token");
            fetch(`${import.meta.env.VITE_API_URL}/bookings/${booking._id}/payment-qr`, {
                headers: { Authorization: `Bearer ${activeToken}` }
            })
                .then((res) => {
                    if (!res.ok) throw new Error("Unable to generate payment QR");
                    return res.json();
                })
                .then((data) => {
                    if (active) {
                        setQrData(data);
                        setLoadingQr(false);
                    }
                })
                .catch((err) => {
                    if (active) {
                        setError(err.message);
                        setLoadingQr(false);
                    }
                });
        }

        return () => {
            active = false;
        };
    }, [booking._id, bookingData.payment?.status, bookingData.paymentStatus, isLearner, isCompleted, isCancelled, sessionAmount, token]);

    // Handle Screenshot File Change (Max 1MB, image only)
    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setError("Please upload an image file (PNG, JPG, WebP).");
            return;
        }

        if (file.size > 1024 * 1024) {
            setError("Image size exceeds 1MB limit. Please upload a smaller screenshot.");
            return;
        }

        setError("");
        setScreenshotName(file.name);

        const reader = new FileReader();
        reader.onload = () => {
            setScreenshot(reader.result);
            setScreenshotPreview(reader.result);
        };
        reader.onerror = () => {
            setError("Failed to read image file.");
        };
        reader.readAsDataURL(file);
    };

    // Learner submits payment proof
    const handleSubmitPayment = async (e) => {
        e.preventDefault();
        setError("");
        setSuccessMsg("");

        const cleanUtr = String(utr).trim();
        if (!/^\d{12}$/.test(cleanUtr)) {
            setError("Invalid UTR: Must be exactly 12 numeric digits.");
            return;
        }

        if (!screenshot) {
            setError("Please upload the Paytm / UPI payment screenshot (Max 1MB).");
            return;
        }

        setBusy(true);
        try {
            const activeToken = token || localStorage.getItem("token");
            const res = await fetch(`${import.meta.env.VITE_API_URL}/bookings/${booking._id}/submit-payment`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${activeToken}`
                },
                body: JSON.stringify({
                    utr: cleanUtr,
                    screenshot
                })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || "Failed to submit payment proof");
            }

            setStatus("payment_submitted");
            setSuccessMsg("Payment submitted successfully! Admin will verify your payment via Paytm for Business.");
            const updated = data.booking || {
                ...bookingData,
                paymentStatus: "payment_submitted",
                payment: {
                    ...bookingData.payment,
                    status: "payment_submitted",
                    utr: cleanUtr,
                    screenshot
                }
            };
            setBookingData(updated);
            if (onBookingUpdated) {
                onBookingUpdated(updated);
            }
        } catch (err) {
            setError(err.message || "Error submitting payment");
        } finally {
            setBusy(false);
        }
    };

    function renderStatusBadge(st) {
        const key = st || bookingData.payment?.status || bookingData.paymentStatus;
        const config = {
            awaiting_payment: { label: "Awaiting Payment", cls: "badge-status-unpaid" },
            payment_submitted: { label: "Payment Submitted", cls: "badge-status-verify" },
            confirmed: { label: "Payment Confirmed", cls: "badge-status-verified" },
            rejected: { label: "Payment Rejected", cls: "badge-status-declined" },
            refunded: { label: "Refund Processed", cls: "badge-status-refunded" },
            paid_out: { label: "Paid Out", cls: "badge-status-verified" },
            not_required: { label: "Free Session", cls: "badge-status-free" },
            awaiting_approval: { label: "Awaiting Payment", cls: "badge-status-pending" },
            unpaid: { label: "Awaiting Payment", cls: "badge-status-unpaid" },
            pending_verification: { label: "Payment Submitted", cls: "badge-status-verify" },
            verified: { label: "Payment Confirmed", cls: "badge-status-verified" },
            declined: { label: "Payment Rejected", cls: "badge-status-declined" },
            cancelled: { label: "Cancelled", cls: "badge-status-cancelled" }
        }[key] || {
            label: String(key).replace(/_/g, " ").toUpperCase(),
            cls: "badge-status-default"
        };

        return <span className={`payment-pill ${config.cls}`}>{config.label}</span>;
    }

    // ==========================================
    // 1. LEARNER RECEIPT & PLATFORM QR PAYMENT
    // ==========================================
    if (isLearner) {
        const currentPaymentStatus = bookingData.payment?.status || bookingData.paymentStatus || "awaiting_payment";
        const isAwaitingPayment = !isCompleted && !isCancelled && (currentPaymentStatus === "awaiting_payment" || currentPaymentStatus === "rejected" || currentPaymentStatus === "unpaid") && sessionAmount > 0;
        const isSubmitted = currentPaymentStatus === "payment_submitted" || currentPaymentStatus === "pending_verification";
        const isConfirmed = currentPaymentStatus === "confirmed" || currentPaymentStatus === "verified";
        const isRejected = currentPaymentStatus === "rejected" || currentPaymentStatus === "declined";

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
                        {bookingData.payment?.utr && (
                            <div className="receipt-detail-item">
                                <span className="item-label">Submitted UTR</span>
                                <code className="item-code">{bookingData.payment.utr}</code>
                            </div>
                        )}
                        {isRejected && bookingData.payment?.rejectReason && (
                            <div className="receipt-detail-item" style={{ color: "#dc2626" }}>
                                <span className="item-label">Rejection Reason</span>
                                <strong>{bookingData.payment.rejectReason}</strong>
                            </div>
                        )}
                    </div>

                    {/* TERMINAL STATUS BADGES (WHEN COMPLETED OR CANCELLED, NO QR SHOWN) */}
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

                    {/* QR CODE & SUBMISSION FLOW FOR LEARNER (ONLY ON awaiting_payment OR rejected, AND NOT COMPLETED/CANCELLED) */}
                    {isAwaitingPayment && (
                        <div className="receipt-payment-unlock-box" style={{ marginTop: "16px" }}>
                            <div className="unlock-header">
                                <span className="unlock-badge">📱 Platform UPI QR</span>
                                <h4>Pay via Paytm Business UPI</h4>
                                <div style={{
                                    background: "#fef3c7",
                                    color: "#92400e",
                                    border: "1px solid #f59e0b",
                                    padding: "8px 12px",
                                    borderRadius: "6px",
                                    fontSize: "13px",
                                    fontWeight: "600",
                                    marginTop: "6px"
                                }}>
                                    ⚠️ Pay only to this platform QR. Never pay a mentor directly.
                                </div>
                            </div>

                            {loadingQr ? (
                                <p style={{ padding: "16px", textAlign: "center" }}>Generating secure QR code…</p>
                            ) : qrData ? (
                                <div className="unlock-qr-section" style={{ textAlign: "center", maxWidth: "100%", overflow: "hidden" }}>
                                    <div style={{
                                        display: "inline-flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        background: "#ffffff",
                                        padding: "10px",
                                        borderRadius: "12px",
                                        border: "1px solid #e2e8f0",
                                        margin: "10px auto",
                                        maxWidth: "100%",
                                        boxSizing: "border-box",
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
                                    }}>
                                        <img
                                            src={qrData.qrCodeDataUrl}
                                            alt="Skill Exchange Platform Payment QR"
                                            style={{
                                                width: "100%",
                                                maxWidth: "180px",
                                                height: "auto",
                                                aspectRatio: "1/1",
                                                objectFit: "contain",
                                                display: "block"
                                            }}
                                        />
                                    </div>
                                    <p className="qr-hint" style={{ fontSize: "14px", margin: "4px 0" }}>
                                        Scan with Paytm, GPay, PhonePe or any UPI app.
                                    </p>
                                    <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "16px" }}>
                                        Platform VPA: <strong>{qrData.platformUpiId}</strong> | Amount: <strong>{formatCurrency(sessionAmount)}</strong>
                                    </p>

                                    {/* UTR + Screenshot Submission Form */}
                                    <form onSubmit={handleSubmitPayment} style={{ textAlign: "left", marginTop: "12px" }}>
                                        <div style={{ marginBottom: "12px" }}>
                                            <label className="unlock-label" style={{ display: "block", marginBottom: "4px", fontWeight: "600" }}>
                                                12-Digit Transaction UTR / Ref No. <span style={{ color: "#dc2626" }}>*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="unlock-input"
                                                value={utr}
                                                maxLength={12}
                                                required
                                                disabled={busy}
                                                onChange={(e) => setUtr(e.target.value.replace(/\D/g, "").slice(0, 12))}
                                                placeholder="e.g. 423156789012 (12 digits)"
                                                style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                            />
                                        </div>

                                        <div style={{ marginBottom: "16px" }}>
                                            <label className="unlock-label" style={{ display: "block", marginBottom: "4px", fontWeight: "600" }}>
                                                Payment Screenshot (Max 1MB) <span style={{ color: "#dc2626" }}>*</span>
                                            </label>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                required={!screenshot}
                                                disabled={busy}
                                                onChange={handleFileChange}
                                                style={{ display: "block", width: "100%", fontSize: "13px" }}
                                            />
                                            {screenshotName && <span style={{ fontSize: "12px", color: "#059669" }}>✓ Selected: {screenshotName}</span>}
                                            {screenshotPreview && (
                                                <div style={{ marginTop: "8px" }}>
                                                    <img
                                                        src={screenshotPreview}
                                                        alt="Payment Proof Preview"
                                                        style={{ maxWidth: "160px", maxHeight: "160px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            type="submit"
                                            className="unlock-confirm-btn"
                                            disabled={busy || utr.length !== 12 || !screenshot}
                                            style={{ width: "100%", padding: "10px", fontWeight: "600", cursor: "pointer" }}
                                        >
                                            {busy ? "Submitting Payment…" : "Submit Payment Proof & Confirm"}
                                        </button>
                                    </form>
                                </div>
                            ) : (
                                <p style={{ color: "#dc2626" }}>{error || "Unable to display QR code"}</p>
                            )}
                        </div>
                    )}

                    {/* CONFIRMATION / PENDING NOTICES */}
                    {isSubmitted && (
                        <div style={{ background: "#eff6ff", border: "1px solid #93c5fd", color: "#1e40af", padding: "12px", borderRadius: "8px", marginTop: "16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "600" }}>
                                <Clock size={16} /> Payment Submitted for Verification
                            </div>
                            <p style={{ margin: "4px 0 0 0", fontSize: "13px" }}>
                                Your 12-digit UTR <strong>{bookingData.payment?.utr}</strong> and screenshot are currently being verified against our Paytm Business records by an administrator. Once verified, your session will be unlocked!
                            </p>
                        </div>
                    )}

                    {isConfirmed && (
                        <div style={{ background: "#ecfdf5", border: "1px solid #6ee7b7", color: "#065f46", padding: "12px", borderRadius: "8px", marginTop: "16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "600" }}>
                                <CheckCircle2 size={16} /> Payment Verified & Session Confirmed
                            </div>
                            <p style={{ margin: "4px 0 0 0", fontSize: "13px" }}>
                                Your session booking is fully confirmed. You can join the session meeting once the mentor shares the link.
                            </p>
                        </div>
                    )}

                    {error && <p className="receipt-error-alert" role="alert" style={{ marginTop: "12px" }}>{error}</p>}
                    {successMsg && <p style={{ color: "#059669", fontSize: "13px", marginTop: "8px" }}>{successMsg}</p>}
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
                            <div className="receipt-detail-item">
                                <span className="item-label">Platform Fee ({bookingData.payment?.platformFeePercent || 10}%)</span>
                                <strong className="item-val fee-deduct">-{formatCurrency(platformFee)}</strong>
                            </div>
                            <div className="receipt-detail-item item-total-row">
                                <span className="item-label">Net Mentor Payout</span>
                                <strong className="item-val total-amount net-earnings">{formatCurrency(mentorPayout)}</strong>
                            </div>
                        </>
                    )}
                    <div className="receipt-detail-item">
                        <span className="item-label">Payment Status</span>
                        <div className="item-val">{renderStatusBadge(status)}</div>
                    </div>
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

                <p className="mentor-fee-policy-footnote" style={{ marginTop: "12px" }}>
                    * Payments are collected securely via the Platform Paytm Business UPI and disbursed directly to you upon session completion.
                </p>

                {error && <p className="receipt-error-alert" role="alert">{error}</p>}
            </section>
        </div>
    );
}
