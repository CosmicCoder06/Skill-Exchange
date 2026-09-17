import { useEffect, useState } from "react";
import "./BookingPage.css";

function BookingPage({
    token,
    mentorId,
    mentorName,
    onBack,
    onBookingCreated
}) {
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [message, setMessage] = useState("");
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [payment, setPayment] = useState(null);
    const [paymentError, setPaymentError] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("pay_later");
    const [paymentReference, setPaymentReference] = useState("");

    useEffect(() => {
        let active = true;
        if (!mentorId) return;

        fetch(`${import.meta.env.VITE_API_URL}/mentors/${mentorId}/payment`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(async (r) => {
                const data = await r.json();
                if (!r.ok) throw new Error(data.message);
                return data;
            })
            .then((data) => {
                if (active) {
                    setPayment(data);
                    setPaymentError("");
                }
            })
            .catch(() => {
                if (active) {
                    // Fallback to free session if payment info is unavailable
                    setPayment({
                        name: mentorName,
                        amount: 0,
                        qr: "",
                        currency: "INR"
                    });
                }
            });

        return () => {
            active = false;
        };
    }, [mentorId, mentorName, token]);

    async function createBooking() {
        const paymentData = payment || {
            name: mentorName,
            amount: 0,
            qr: "",
            currency: "INR"
        };

        if (
            paymentData.amount > 0 &&
            paymentMethod === "qr" &&
            !/^[A-Za-z0-9-]{6,64}$/.test(paymentReference.trim())
        ) {
            setPaymentError("Enter the transaction reference after paying.");
            return;
        }

        if (!date || !time) {
            alert("Please select date and time.");
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/bookings`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        mentor: mentorId,
                        date,
                        time,
                        message,
                        quotedAmount: paymentData.amount,
                        paymentMethod: paymentData.amount === 0 ? "free" : paymentMethod,
                        paymentReference: paymentData.amount === 0 ? "" : paymentReference
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || "Booking failed");
                setLoading(false);
                return;
            }

            setSuccess(true);

            setTimeout(() => {
                if (onBookingCreated) {
                    onBookingCreated(data.booking);
                }
            }, 2500);
        } catch (error) {
            console.error("Booking error:", error);
            alert("Booking failed. Please try again.");
            setLoading(false);
        }
    }

    if (success) {
        return (
            <main className="booking-page booking-success-page">
                <section className="booking-success-card">
                    <div className="receipt-animation">
                        <div className="receipt-icon">✓</div>
                        <div className="receipt-line line-one"></div>
                        <div className="receipt-line line-two"></div>
                        <div className="receipt-line line-three"></div>
                    </div>

                    <p className="success-eyebrow">
                        SESSION REQUEST SENT
                    </p>

                    <h1>Request submitted</h1>

                    <p className="success-main-text">
                        Your session request with{" "}
                        <strong>{mentorName}</strong> has been sent
                        successfully.
                    </p>

                    <div className="pending-notice">
                        <span className="pending-dot"></span>

                        <div>
                            <strong>Waiting for mentor approval</strong>

                            <p>
                                Your request is pending. You'll be able
                                to track its status from My Sessions.
                            </p>
                        </div>
                    </div>

                    <div className="redirect-message">
                        Taking you to My Sessions...
                    </div>
                </section>
            </main>
        );
    }

    return (
        <main className="booking-page">
            {onBack && (
                <button
                    type="button"
                    className="booking-back"
                    onClick={onBack}
                    disabled={loading}
                >
                    ← Back
                </button>
            )}

            <section className="booking-card">
                <p className="booking-eyebrow">
                    SESSION REQUEST
                </p>

                <h1>Book Session</h1>

                <p className="booking-with">
                    With {payment?.name || mentorName}
                </p>

                <label>Select Date</label>

                <input
                    type="date"
                    value={date}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setDate(e.target.value)}
                    disabled={loading}
                />

                <label>Select Time</label>

                <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    disabled={loading}
                />

                <label>Message</label>

                <textarea
                    placeholder="Tell mentor about your requirement"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={loading}
                />

                <section className="manual-payment">
                    <h2>Payment</h2>
                    {!payment && !paymentError && <p>Loading mentor payment details…</p>}
                    {payment && <>
                        <p><strong>{payment.amount === 0 ? 'Free session' : `₹${payment.amount.toLocaleString('en-IN')} · 1-hour session`}</strong></p>
                        {payment.amount > 0 && <>
                            <label htmlFor="payment-method">Payment option</label>
                            <select id="payment-method" value={paymentMethod} disabled={loading} onChange={e => { setPaymentMethod(e.target.value); setPaymentError(''); }}>
                                <option value="pay_later">Pay later / arrange with mentor</option>
                                {payment.qr && <option value="qr">Pay using mentor’s QR</option>}
                            </select>
                            {!payment.qr && <p>This mentor has not added a payment QR yet.</p>}
                            {paymentMethod === 'qr' && <>
                                <img className="payment-qr" src={payment.qr} alt={`Payment QR for ${payment.name}`} />
                                <p>Check the recipient and amount in your payment app. After paying, enter the transaction reference. Your mentor will verify the transfer.</p>
                                <label htmlFor="payment-reference">Transaction reference / UTR</label>
                                <input id="payment-reference" value={paymentReference} maxLength={64} disabled={loading} onChange={e => setPaymentReference(e.target.value)} placeholder="Enter your payment reference" />
                            </>}
                        </>}
                    </>}
                    {paymentError && <p role="alert">{paymentError}</p>}
                </section>
                <button
                    className="confirm-booking"
                    onClick={createBooking}
                    disabled={loading || !date || !time}
                >
                    {loading ? "Sending Request..." : "Confirm Booking"}
                </button>
            </section>
        </main>
    );
}

export default BookingPage;
// @teamcosmiccoders
