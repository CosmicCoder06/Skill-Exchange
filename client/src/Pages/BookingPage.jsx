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
    const [duration, setDuration] = useState(60);
    const [message, setMessage] = useState("");
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [payment, setPayment] = useState(null);
    const [availability, setAvailability] = useState({
        checking: false,
        available: null,
        message: ""
    });

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
                }
            })
            .catch(() => {
                if (active) {
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

    // Live slot availability check
    useEffect(() => {
        let active = true;
        if (!mentorId || !date || !time) {
            setAvailability({ checking: false, available: null, message: "" });
            return;
        }

        const timer = setTimeout(() => {
            setAvailability({ checking: true, available: null, message: "" });
            fetch(
                `${import.meta.env.VITE_API_URL}/bookings/check-availability?mentor=${mentorId}&date=${date}&time=${time}&duration=${duration}`,
                { headers: { Authorization: `Bearer ${token}` } }
            )
                .then(async (res) => {
                    const data = await res.json();
                    if (!active) return;
                    setAvailability({
                        checking: false,
                        available: data.available === true,
                        message: data.message || ""
                    });
                })
                .catch(() => {
                    if (!active) return;
                    setAvailability({
                        checking: false,
                        available: true,
                        message: "Slot ready"
                    });
                });
        }, 350);

        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [mentorId, date, time, duration, token]);

    const baseHourlyRate = payment?.amount || 0;
    const calculatedAmount = Math.round((baseHourlyRate * duration) / 60);

    async function createBooking() {
        if (!date || !time) {
            alert("Please select date and time.");
            return;
        }

        if (availability.available === false) {
            alert(availability.message || "This time slot is unavailable. Please choose another slot.");
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
                        duration,
                        message
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || "Booking request failed");
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
            alert("Booking request failed. Please try again.");
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
                        TIME SLOT REQUESTED
                    </p>

                    <h1>Request submitted</h1>

                    <p className="success-main-text">
                        Your session request with{" "}
                        <strong>{mentorName}</strong> for <strong>{duration} minutes</strong> has been sent.
                    </p>

                    <div className="pending-notice">
                        <span className="pending-dot"></span>

                        <div>
                            <strong>Step 1 Complete: Waiting for mentor approval</strong>
                            <p>
                                Once your mentor approves the time slot, payment options will become available in My Sessions to confirm your booking.
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
                    SESSION BOOKING
                </p>

                <h1>Book Session</h1>

                <p className="booking-with">
                    With {payment?.name || mentorName}
                </p>

                <div className="booking-approval-steps-card">
                    <div className="approval-step-item">
                        <span className="step-num active">1</span>
                        <div>
                            <strong>Pick Time & Duration</strong>
                            <small>Check slot availability</small>
                        </div>
                    </div>
                    <div className="approval-step-item">
                        <span className="step-num">2</span>
                        <div>
                            <strong>Mentor Approval</strong>
                            <small>Mentor approves slot</small>
                        </div>
                    </div>
                    <div className="approval-step-item">
                        <span className="step-num">3</span>
                        <div>
                            <strong>Pay & Confirm</strong>
                            <small>Confirm with payment</small>
                        </div>
                    </div>
                </div>

                <label>Session Duration</label>
                <div className="duration-pill-group">
                    {[30, 45, 60, 90, 120].map((mins) => (
                        <button
                            key={mins}
                            type="button"
                            className={`duration-pill ${duration === mins ? "active" : ""}`}
                            onClick={() => setDuration(mins)}
                            disabled={loading}
                        >
                            {mins >= 60 ? (mins === 60 ? "1 hr" : `${mins / 60} hrs`) : `${mins} mins`}
                        </button>
                    ))}
                </div>

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

                {date && time && (
                    <div className={`slot-availability-badge ${availability.checking ? "checking" : availability.available ? "available" : "unavailable"}`}>
                        {availability.checking ? (
                            <span>⏳ Checking slot availability…</span>
                        ) : availability.available ? (
                            <span>✓ Time slot is available for {duration} mins</span>
                        ) : (
                            <span>⚠️ {availability.message || "Time slot is unavailable. Please choose another time."}</span>
                        )}
                    </div>
                )}

                <label>Message (Optional)</label>
                <textarea
                    placeholder="Tell mentor about your goals or topics you want to cover"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={loading}
                />

                <div className="pricing-calculation-card">
                    <div className="pricing-calc-row">
                        <span>Mentor Rate:</span>
                        <strong>{baseHourlyRate === 0 ? "Free" : `₹${baseHourlyRate.toLocaleString("en-IN")}/hr`}</strong>
                    </div>
                    <div className="pricing-calc-row">
                        <span>Selected Duration:</span>
                        <strong>{duration} minutes</strong>
                    </div>
                    <div className="pricing-calc-divider" />
                    <div className="pricing-calc-total">
                        <span>Calculated Fee:</span>
                        <strong className="calc-amount">
                            {calculatedAmount === 0 ? "Free Session" : `₹${calculatedAmount.toLocaleString("en-IN")}`}
                        </strong>
                    </div>
                    <p className="pricing-payment-note">
                        💡 <em>Payment is unlocked after the mentor approves this time slot.</em>
                    </p>
                </div>

                <button
                    className="confirm-booking"
                    onClick={createBooking}
                    disabled={loading || !date || !time || availability.checking || availability.available === false}
                >
                    {loading ? "Sending Request..." : "Request Time Slot for Approval"}
                </button>
            </section>
        </main>
    );
}

export default BookingPage;
// @teamcosmiccoders
