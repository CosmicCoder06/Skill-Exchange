import { useEffect, useState } from "react";
import "./BookingPage.css";

function BookingPage({
    token,
    mentorId,
    mentorName,
    onBack,
    onBookingCreated
}) {
    const [mentor, setMentor] = useState(null);
    const [mentorLoading, setMentorLoading] = useState(true);
    const [mentorError, setMentorError] = useState("");

    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [duration, setDuration] = useState(60);
    const [message, setMessage] = useState("");
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [availability, setAvailability] = useState({
        checking: false,
        available: null,
        message: ""
    });

    // Always fetch fresh mentor details by mentorId to get accurate hourlyRate
    useEffect(() => {
        let active = true;
        if (!mentorId) {
            setMentorLoading(false);
            setMentorError("No mentor selected.");
            return;
        }

        setMentorLoading(true);
        setMentorError("");

        async function fetchMentorDetails() {
            try {
                // 1. Try primary /mentors/:id endpoint
                const res = await fetch(`${import.meta.env.VITE_API_URL}/mentors/${mentorId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const text = await res.text();
                let data = null;
                try {
                    data = text ? JSON.parse(text) : null;
                } catch {
                    // Non-JSON response (e.g. 404 HTML during rolling deployment)
                }

                if (res.ok && data?.mentor) {
                    if (active) {
                        setMentor(data.mentor);
                        setMentorLoading(false);
                    }
                    return;
                }

                // 2. Fallback to /profile/:id
                const profRes = await fetch(`${import.meta.env.VITE_API_URL}/profile/${mentorId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const profText = await profRes.text();
                let profData = null;
                try {
                    profData = profText ? JSON.parse(profText) : null;
                } catch {}

                if (profRes.ok && (profData?.profile || profData?.user)) {
                    if (active) {
                        setMentor(profData.profile || profData.user);
                        setMentorLoading(false);
                    }
                    return;
                }

                // 3. Fallback to /mentors directory listing
                const listRes = await fetch(`${import.meta.env.VITE_API_URL}/mentors`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const listText = await listRes.text();
                let listData = null;
                try {
                    listData = listText ? JSON.parse(listText) : null;
                } catch {}

                const match = listData?.mentors?.find((m) => String(m._id || m.id) === String(mentorId));
                if (match && active) {
                    setMentor(match);
                    setMentorLoading(false);
                    return;
                }

                if (active) {
                    const cleanErr = data?.message && !data.message.includes("<")
                        ? data.message
                        : "Unable to load mentor profile details";
                    setMentorError(cleanErr);
                    setMentorLoading(false);
                }
            } catch (err) {
                if (active) {
                    setMentorError(err.message || "Unable to fetch mentor details");
                    setMentorLoading(false);
                }
            }
        }

        fetchMentorDetails();

        return () => {
            active = false;
        };
    }, [mentorId, token]);

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

    // Rate validation: must be a defined, non-negative finite number
    const rawRate = mentor?.hourlyRate;
    const isRateConfigured =
        rawRate !== undefined &&
        rawRate !== null &&
        rawRate !== "" &&
        Number.isFinite(Number(rawRate)) &&
        Number(rawRate) >= 0;

    const hourlyRate = isRateConfigured ? Number(rawRate) : null;
    const isExplicitlyFree = isRateConfigured && hourlyRate === 0;

    // Fee formula: Math.round(hourlyRate * durationMinutes / 60)
    const calculatedFee = isRateConfigured
        ? Math.round((hourlyRate * duration) / 60)
        : null;

    let rateDisplay;
    let feeDisplay;

    if (mentorLoading) {
        rateDisplay = "Loading…";
        feeDisplay = "Calculating…";
    } else if (!isRateConfigured) {
        rateDisplay = "Rate not set";
        feeDisplay = "Rate not set";
    } else if (isExplicitlyFree) {
        rateDisplay = "Free";
        feeDisplay = "Free Session";
    } else {
        rateDisplay = `₹${hourlyRate.toLocaleString("en-IN")}/hr`;
        feeDisplay = calculatedFee === 0 ? "Free Session" : `₹${calculatedFee.toLocaleString("en-IN")}`;
    }

    const canSubmit =
        !loading &&
        !mentorLoading &&
        isRateConfigured &&
        Boolean(date) &&
        Boolean(time) &&
        !availability.checking &&
        availability.available !== false;

    async function createBooking() {
        if (!date || !time) {
            alert("Please select date and time.");
            return;
        }

        if (!isRateConfigured) {
            alert("This mentor has not configured an hourly rate yet. Bookings cannot be requested.");
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

    const displayName = mentor?.name || mentorName || "Mentor";

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
                        <strong>{displayName}</strong> for <strong>{duration} minutes</strong> has been sent.
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
                    With {displayName}
                </p>

                {mentorError && (
                    <div
                        role="alert"
                        style={{
                            padding: "10px 14px",
                            marginBottom: "16px",
                            borderRadius: "6px",
                            background: "#fef3f2",
                            border: "1px solid #fee4e2",
                            color: "#b42318",
                            fontSize: "13px"
                        }}
                    >
                        ⚠️ {mentorError}
                    </div>
                )}

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
                            disabled={loading || mentorLoading}
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
                    disabled={loading || mentorLoading}
                />

                <label>Select Time</label>
                <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    disabled={loading || mentorLoading}
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
                    disabled={loading || mentorLoading}
                />

                <div className="pricing-calculation-card">
                    <div className="pricing-calc-row">
                        <span>Mentor Rate:</span>
                        <strong>{rateDisplay}</strong>
                    </div>
                    <div className="pricing-calc-row">
                        <span>Selected Duration:</span>
                        <strong>{duration} minutes</strong>
                    </div>
                    <div className="pricing-calc-divider" />
                    <div className="pricing-calc-total">
                        <span>Calculated Fee:</span>
                        <strong className="calc-amount">
                            {feeDisplay}
                        </strong>
                    </div>

                    {!mentorLoading && !isRateConfigured && (
                        <div
                            role="alert"
                            style={{
                                padding: "8px 12px",
                                marginTop: "12px",
                                borderRadius: "6px",
                                background: "#fef3f2",
                                border: "1px solid #fee4e2",
                                color: "#b42318",
                                fontSize: "12px",
                                lineHeight: 1.4
                            }}
                        >
                            ⚠️ <strong>Rate not set:</strong> This mentor has not configured their hourly rate. Bookings cannot be requested until a rate is set in their profile.
                        </div>
                    )}

                    <p className="pricing-payment-note">
                        💡 <em>Payment is unlocked after the mentor approves this time slot.</em>
                    </p>
                </div>

                <button
                    className="confirm-booking"
                    onClick={createBooking}
                    disabled={!canSubmit}
                >
                    {loading
                        ? "Sending Request..."
                        : mentorLoading
                        ? "Loading Mentor..."
                        : !isRateConfigured
                        ? "Rate Not Configured — Cannot Book"
                        : "Request Time Slot for Approval"}
                </button>
            </section>
        </main>
    );
}

export default BookingPage;
// @teamcosmiccoders
