import { useEffect, useState } from "react";
import { Wallet, ShieldCheck, QrCode, ArrowUpRight, PlusCircle } from "lucide-react";
import WalletModal from "../wallet/WalletModal";

function roundToTwo(num) {
    return Math.round((Number(num) + Number.EPSILON) * 100) / 100;
}

export function formatCurrency(num) {
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
    const [status, setStatus] = useState(booking.paymentStatus);
    const [bookingStatus, setBookingStatus] = useState(booking.status);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    // Synchronize local state whenever booking prop updates
    useEffect(() => {
        setStatus(booking.paymentStatus);
        setBookingStatus(booking.status);
    }, [booking.paymentStatus, booking.status]);

    // Payment completion states for booker on approved bookings
    const [paymentMode, setPaymentMode] = useState("wallet"); // 'wallet' or 'direct'
    const [paymentReference, setPaymentReference] = useState("");
    const [mentorQr, setMentorQr] = useState("");
    const [loadingQr, setLoadingQr] = useState(false);

    // Wallet balance state for learner
    const [walletBalance, setWalletBalance] = useState(0);
    const [walletLoading, setWalletLoading] = useState(true);
    const [showWalletModal, setShowWalletModal] = useState(false);

    const isMentor =
        String(booking.mentor?._id || booking.mentor?.id || booking.mentor) === String(currentUserId);
    const isLearner =
        String(booking.learner?._id || booking.learner?.id || booking.learner) === String(currentUserId);

    const duration = Number(booking.duration) || 60;
    const mentorId = booking.mentor?._id || booking.mentor?.id || booking.mentor;
    const mentorName = booking.mentor?.name || "Mentor";

    // Standardized financial calculations with resilient fallbacks
    const baseAmount = (() => {
        if (Number(booking.baseSessionAmount) > 0) return Number(booking.baseSessionAmount);
        if (Number(booking.paymentAmount) > 0) return Number(booking.paymentAmount);
        if (Number(booking.grossAmountWithGst) > 0) return roundToTwo(Number(booking.grossAmountWithGst) / 1.18);
        if (Number(booking.mentorEarnings) > 0) return roundToTwo(Number(booking.mentorEarnings) / (1.18 * 0.97));
        if (Number(booking.mentor?.hourlyRate) > 0) return roundToTwo((Number(booking.mentor.hourlyRate) * duration) / 60);
        return 0;
    })();

    const gstAmount = Number(booking.gstAmount) > 0
        ? Number(booking.gstAmount)
        : roundToTwo(baseAmount * 0.18);
    const grossAmountWithGst = Number(booking.grossAmountWithGst) > 0
        ? Number(booking.grossAmountWithGst)
        : roundToTwo(baseAmount + gstAmount);
    const mentorPlatformFee = Number(booking.mentorPlatformFee) > 0
        ? Number(booking.mentorPlatformFee)
        : roundToTwo(grossAmountWithGst * 0.03);
    const mentorEarnings = Number(booking.mentorEarnings) > 0
        ? Number(booking.mentorEarnings)
        : roundToTwo(grossAmountWithGst - mentorPlatformFee);

    // Is UPI / Card method used?
    const isUpiOrCard = ["upi", "card", "upi_card", "qr"].includes(String(booking.paymentMethod || "").toLowerCase());
    const learnerFeeApplied = (Number(booking.learnerConvenienceFee) > 0) || (isUpiOrCard && baseAmount > 0);
    const learnerConvenienceFee = Number(booking.learnerConvenienceFee) > 0
        ? Number(booking.learnerConvenienceFee)
        : (learnerFeeApplied ? roundToTwo(grossAmountWithGst * 0.03) : 0);
    const totalCharged = Number(booking.totalAmountPaid) > 0
        ? Number(booking.totalAmountPaid)
        : roundToTwo(grossAmountWithGst + (learnerFeeApplied ? learnerConvenienceFee : 0));
    const upiTotalAmount = roundToTwo(grossAmountWithGst + roundToTwo(grossAmountWithGst * 0.03));

    // Derive effective payment status based on booking status
    const effectivePaymentStatus = (() => {
        const sessStatus = bookingStatus || booking.status;
        const payStatus = status || booking.paymentStatus;

        if (sessStatus === "rejected") {
            return "declined";
        }
        if (sessStatus === "cancelled") {
            if (payStatus === "verified") {
                return "refunded";
            }
            return "cancelled";
        }
        if (sessStatus === "approved" && (!payStatus || payStatus === "awaiting_approval")) {
            return "unpaid";
        }
        if (baseAmount > 0 && (payStatus === "not_required" || !payStatus)) {
            if (sessStatus === "accepted" || sessStatus === "completed") {
                return "verified";
            }
            if (sessStatus === "approved") {
                return "unpaid";
            }
            return "awaiting_approval";
        }
        return payStatus || "unpaid";
    })();

    // Fetch learner's wallet balance reliably
    useEffect(() => {
        const activeToken = token || localStorage.getItem("token");
        if (bookingStatus === "approved" && isLearner && activeToken) {
            let active = true;
            setWalletLoading(true);
            fetch(`${import.meta.env.VITE_API_URL}/wallet`, {
                headers: { Authorization: `Bearer ${activeToken}` }
            })
                .then((res) => {
                    if (!res.ok) throw new Error("Wallet fetch failed");
                    return res.json();
                })
                .then((data) => {
                    if (active && data?.wallet) {
                        setWalletBalance(Number(data.wallet.balance) || 0);
                    }
                })
                .catch(() => {
                    if (active) setWalletBalance(0);
                })
                .finally(() => {
                    if (active) setWalletLoading(false);
                });

            return () => {
                active = false;
            };
        } else {
            setWalletLoading(false);
        }
    }, [bookingStatus, isLearner, token]);

    // Load mentor QR code if booking is approved and payment is pending
    useEffect(() => {
        const activeToken = token || localStorage.getItem("token");
        if (bookingStatus === "approved" && isLearner && baseAmount > 0 && mentorId && activeToken) {
            let active = true;
            setLoadingQr(true);
            fetch(`${import.meta.env.VITE_API_URL}/mentors/${mentorId}/payment`, {
                headers: { Authorization: `Bearer ${activeToken}` }
            })
                .then(async (res) => {
                    const data = await res.json();
                    if (active && data.qr) {
                        setMentorQr(data.qr);
                    }
                })
                .catch(() => {})
                .finally(() => {
                    if (active) setLoadingQr(false);
                });

            return () => {
                active = false;
            };
        }
    }, [bookingStatus, isLearner, baseAmount, mentorId, token]);

    async function handleVerifyPayment() {
        setBusy(true);
        setError("");
        try {
            const activeToken = token || localStorage.getItem("token");
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/bookings/${booking._id}/payment/verify`,
                {
                    method: "PUT",
                    headers: { Authorization: `Bearer ${activeToken}` }
                }
            );
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Unable to verify payment");
            }
            setStatus("verified");
            if (onBookingUpdated) {
                onBookingUpdated({ ...booking, paymentStatus: "verified" });
            }
        } catch (e) {
            setError(e.message);
        } finally {
            setBusy(false);
        }
    }

    function formatPaymentMode(method) {
        if (!method) return "—";
        const m = String(method).toLowerCase();
        if (m === "wallet") return "Wallet";
        if (m === "upi" || m === "card" || m === "upi_card" || m === "qr") return "UPI/Card";
        if (m === "free") return "Free";
        if (m === "pay_later") return "Pay Later";
        return method;
    }

    async function handleCompletePayment() {
        if (baseAmount > 0) {
            if (paymentMode === "wallet") {
                if (walletBalance < grossAmountWithGst) {
                    setError(`Insufficient wallet balance (${formatCurrency(walletBalance)}). Required: ${formatCurrency(grossAmountWithGst)}. Please top up your wallet or choose UPI/Card.`);
                    return;
                }
            } else if (paymentMode === "direct") {
                if (mentorQr && paymentReference.trim() && !/^[A-Za-z0-9-]{6,64}$/.test(paymentReference.trim())) {
                    setError("Enter a valid transaction reference (6–64 letters or numbers).");
                    return;
                }
            }
        }

        setBusy(true);
        setError("");
        try {
            const activeToken = token || localStorage.getItem("token");
            const chosenMethod = baseAmount === 0
                ? "free"
                : (paymentMode === "wallet" ? "wallet" : "upi");
            const reference = chosenMethod === "wallet"
                ? `WALLET-${Date.now().toString().slice(-6)}`
                : (paymentReference.trim() || `UPI-${Date.now().toString().slice(-6)}`);

            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/bookings/${booking._id}/pay`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${activeToken}`
                    },
                    body: JSON.stringify({
                        quotedAmount: baseAmount,
                        paymentMethod: chosenMethod,
                        paymentReference: reference
                    })
                }
            );

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || "Payment completion failed");
            }

            setBookingStatus("accepted");
            setStatus(data.booking?.paymentStatus || "verified");

            if (onBookingUpdated) {
                onBookingUpdated(data.booking);
            }
        } catch (e) {
            setError(e.message);
        } finally {
            setBusy(false);
        }
    }

    function renderStatusBadge(st) {
        const key = st || effectivePaymentStatus;
        const config = {
            not_required: { label: "Free Session", cls: "badge-status-free" },
            awaiting_approval: { label: "Awaiting Mentor", cls: "badge-status-pending" },
            unpaid: { label: "Unpaid", cls: "badge-status-unpaid" },
            pending_verification: { label: "Needs Verification", cls: "badge-status-verify" },
            verified: { label: "Paid", cls: "badge-status-verified" },
            declined: { label: "Declined", cls: "badge-status-declined" },
            cancelled: { label: "Cancelled — No Payment", cls: "badge-status-cancelled" },
            refunded: { label: "Refund Processed", cls: "badge-status-refunded" }
        }[key] || {
            label: key === "rejected" ? "Declined" : key.replace(/_/g, " ").toUpperCase(),
            cls: key === "rejected" ? "badge-status-declined" : "badge-status-default"
        };

        return <span className={`payment-pill ${config.cls}`}>{config.label}</span>;
    }

    // ==========================================
    // 1. BOOKER RECEIPT (Viewed by the Booker)
    // Purely financial/payment-related details
    // ==========================================
    if (isLearner) {
        return (
            <div className="payment-receipt-container">
                <section className="receipt-role-card booker-receipt-card">
                    <div className="receipt-role-header">
                        <span className="receipt-card-title">Payment Summary</span>
                        <span className="receipt-duration-chip">⏱ {duration} MINS</span>
                    </div>

                    <div className="receipt-details-list">
                        <div className="receipt-detail-item">
                            <span className="item-label">Session Rate</span>
                            <strong className="item-val">{baseAmount === 0 ? "Free" : formatCurrency(baseAmount)}</strong>
                        </div>
                        {baseAmount > 0 && (
                            <>
                                <div className="receipt-detail-item">
                                    <span className="item-label">GST (18%)</span>
                                    <strong className="item-val font-accent">+{formatCurrency(gstAmount)}</strong>
                                </div>
                                {learnerFeeApplied ? (
                                    <>
                                        <div className="receipt-detail-item">
                                            <span className="item-label">Subtotal (with GST)</span>
                                            <strong className="item-val">{formatCurrency(grossAmountWithGst)}</strong>
                                        </div>
                                        <div className="receipt-detail-item">
                                            <span className="item-label">Platform Convenience Fee (3%)</span>
                                            <strong className="item-val font-accent">+{formatCurrency(learnerConvenienceFee)}</strong>
                                        </div>
                                        <div className="receipt-detail-item item-total-row">
                                            <span className="item-label">Total Amount Paid</span>
                                            <strong className="item-val total-amount">{formatCurrency(totalCharged)}</strong>
                                        </div>
                                    </>
                                ) : (
                                    <div className="receipt-detail-item item-total-row">
                                        <span className="item-label">Total Session Fee (with GST)</span>
                                        <strong className="item-val total-amount">{formatCurrency(grossAmountWithGst)}</strong>
                                    </div>
                                )}
                            </>
                        )}
                        <div className="receipt-detail-item">
                            <span className="item-label">Payment Status</span>
                            <div className="item-val">{renderStatusBadge(effectivePaymentStatus)}</div>
                        </div>
                        {booking.paymentMethod && (
                            <div className="receipt-detail-item">
                                <span className="item-label">Payment Mode</span>
                                <strong className="item-val">
                                    {formatPaymentMode(booking.paymentMethod)}
                                </strong>
                            </div>
                        )}
                        {booking.paymentReference && (
                            <div className="receipt-detail-item">
                                <span className="item-label">Reference</span>
                                <code className="item-code">{booking.paymentReference}</code>
                            </div>
                        )}
                    </div>
                </section>

                {/* APPROVAL UNLOCKED PAYMENT FORM */}
                {bookingStatus === "approved" && (
                    <div className="receipt-payment-unlock-box">
                        <div className="unlock-header">
                            <span className="unlock-badge">✓ Time Slot Approved</span>
                            <h4>Choose Your Payment Mode</h4>
                            <p>Your mentor approved this slot. Select your payment option to finalize the session.</p>
                        </div>

                        {baseAmount > 0 ? (
                            <div className="payment-modes-wrapper">
                                {/* MODE 1: WALLET */}
                                <div
                                    className={`payment-mode-choice-card ${paymentMode === "wallet" ? "selected" : ""}`}
                                    onClick={() => {
                                        setPaymentMode("wallet");
                                        setError("");
                                    }}
                                >
                                    <div className="mode-top-bar">
                                        <div className="mode-radio-group">
                                            <input
                                                type="radio"
                                                name="payment_choice"
                                                checked={paymentMode === "wallet"}
                                                onChange={() => setPaymentMode("wallet")}
                                            />
                                            <strong>Pay via Skill Exchange Wallet</strong>
                                        </div>
                                        <span className="save-fee-badge">★ Save 3% — Pay via Wallet</span>
                                    </div>

                                    <div className="mode-pricing-line">
                                        <span className="mode-amount">{formatCurrency(grossAmountWithGst)}</span>
                                        <span className="no-extra-tag">No extra charges (0% platform convenience fee)</span>
                                    </div>

                                    <div className="wallet-balance-indicator">
                                        <div className="wallet-bal-text">
                                            <Wallet size={14} />
                                            <span>Your Balance:</span>
                                            <strong>{walletLoading ? "Fetching…" : formatCurrency(walletBalance)}</strong>
                                            {!walletLoading && walletBalance < grossAmountWithGst && (
                                                <span className="balance-shortage-badge">Insufficient</span>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            className="quick-topup-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowWalletModal(true);
                                            }}
                                        >
                                            <PlusCircle size={13} /> + Top Up Wallet
                                        </button>
                                    </div>
                                </div>

                                {/* MODE 2: DIRECT / UPI */}
                                <div
                                    className={`payment-mode-choice-card ${paymentMode === "direct" ? "selected" : ""}`}
                                    onClick={() => {
                                        setPaymentMode("direct");
                                        setError("");
                                    }}
                                >
                                    <div className="mode-top-bar">
                                        <div className="mode-radio-group">
                                            <input
                                                type="radio"
                                                name="payment_choice"
                                                checked={paymentMode === "direct"}
                                                onChange={() => setPaymentMode("direct")}
                                            />
                                            <strong>Pay via UPI / Card / QR</strong>
                                        </div>
                                        <span className="convenience-badge">+3% Platform Fee</span>
                                    </div>

                                    <div className="mode-pricing-line">
                                        <span className="mode-amount">{formatCurrency(upiTotalAmount)}</span>
                                        <span className="convenience-breakdown">
                                            ({formatCurrency(grossAmountWithGst)} session fee + 3% convenience fee {formatCurrency(learnerConvenienceFee)})
                                        </span>
                                    </div>

                                    {paymentMode === "direct" && mentorQr && (
                                        <div className="unlock-qr-section" onClick={(e) => e.stopPropagation()}>
                                            <img
                                                src={mentorQr}
                                                alt={`Payment QR for ${mentorName}`}
                                                className="receipt-payment-qr"
                                            />
                                            <p className="qr-hint">Scan and pay {formatCurrency(upiTotalAmount)}, then enter your transaction reference below.</p>
                                            <label className="unlock-label">Transaction Reference / UTR</label>
                                            <input
                                                type="text"
                                                className="unlock-input"
                                                value={paymentReference}
                                                maxLength={64}
                                                disabled={busy}
                                                onChange={(e) => setPaymentReference(e.target.value)}
                                                placeholder="Enter 6-64 alphanumeric reference"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <p className="free-note">This is a free session. Click below to confirm your booking.</p>
                        )}

                        <button
                            type="button"
                            className="unlock-confirm-btn"
                            disabled={busy || loadingQr}
                            onClick={handleCompletePayment}
                        >
                            {busy
                                ? "Processing…"
                                : baseAmount === 0
                                ? "Confirm Free Booking"
                                : paymentMode === "wallet"
                                ? `Pay ${formatCurrency(grossAmountWithGst)} from Wallet & Confirm`
                                : `Pay ${formatCurrency(upiTotalAmount)} & Confirm`}
                        </button>
                    </div>
                )}

                {error && <p className="receipt-error-alert" role="alert">{error}</p>}

                {showWalletModal && (
                    <WalletModal
                        token={token}
                        onClose={() => setShowWalletModal(false)}
                        onBalanceUpdated={(newBal) => {
                            setWalletBalance(newBal);
                            setError("");
                        }}
                    />
                )}
            </div>
        );
    }

    // ==========================================
    // 2. MENTOR INVOICE (Viewed by the Mentor/Host)
    // Purely financial/payment-related details
    // ==========================================
    return (
        <div className="payment-receipt-container">
            <section className="receipt-role-card mentor-invoice-card">
                <div className="receipt-role-header">
                    <span className="receipt-card-title">Host Earning Invoice</span>
                    <span className="receipt-duration-chip">⏱ {duration} MINS</span>
                </div>

                <div className="receipt-details-list">
                    <div className="receipt-detail-item">
                        <span className="item-label">Gross Session Fee</span>
                        <strong className="item-val">{baseAmount === 0 ? "Free session" : formatCurrency(baseAmount)}</strong>
                    </div>
                    {baseAmount > 0 && (
                        <>
                            <div className="receipt-detail-item">
                                <span className="item-label">GST (18%)</span>
                                <strong className="item-val font-accent">+{formatCurrency(gstAmount)}</strong>
                            </div>
                            <div className="receipt-detail-item">
                                <span className="item-label">Total Gross with GST</span>
                                <strong className="item-val">{formatCurrency(grossAmountWithGst)}</strong>
                            </div>
                            <div className="receipt-detail-item">
                                <span className="item-label">Mentor Platform Fee (3%)</span>
                                <strong className="item-val fee-deduct">-{formatCurrency(mentorPlatformFee)}</strong>
                            </div>
                            <div className="receipt-detail-item item-total-row">
                                <span className="item-label">Net Payout / Credited</span>
                                <strong className="item-val total-amount net-earnings">{formatCurrency(mentorEarnings)}</strong>
                            </div>
                        </>
                    )}
                    <div className="receipt-detail-item">
                        <span className="item-label">Payment Status</span>
                        <div className="item-val">{renderStatusBadge(effectivePaymentStatus)}</div>
                    </div>
                    {booking.paymentMethod && (
                        <div className="receipt-detail-item">
                            <span className="item-label">Payment Mode</span>
                            <strong className="item-val">
                                {formatPaymentMode(booking.paymentMethod)}
                            </strong>
                        </div>
                    )}
                    {booking.paymentReference && (
                        <div className="receipt-detail-item">
                            <span className="item-label">Learner Reference</span>
                            <code className="item-code">{booking.paymentReference}</code>
                        </div>
                    )}
                </div>

                {baseAmount > 0 && (
                    <p className="mentor-fee-policy-footnote">
                        * Learner convenience fees (if paid via direct UPI/Card) belong solely to the platform and do not impact your host payout.
                    </p>
                )}

                {isMentor && status === "pending_verification" && (
                    <div className="receipt-verify-action-box">
                        <p>Learner submitted a direct payment. Confirming will verify the session and credit {formatCurrency(mentorEarnings)} to your mentor wallet.</p>
                        <button
                            type="button"
                            className="receipt-verify-btn"
                            disabled={busy}
                            onClick={handleVerifyPayment}
                        >
                            {busy ? "Saving…" : `✓ Confirm Payment & Credit ${formatCurrency(mentorEarnings)}`}
                        </button>
                    </div>
                )}

                {error && <p className="receipt-error-alert" role="alert">{error}</p>}
            </section>
        </div>
    );
}

