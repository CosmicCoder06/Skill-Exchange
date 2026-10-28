import { useEffect, useMemo, useState } from "react";
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
    const [showCustomDate, setShowCustomDate] = useState(false);
    const [showCustomTime, setShowCustomTime] = useState(false);

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
                    // Non-JSON response
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

    // Generate upcoming 14 days list for the interactive date selector
    const upcomingDays = useMemo(() => {
        const days = [];
        const today = new Date();
        for (let i = 0; i < 14; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

            let dayLabel;
            if (i === 0) dayLabel = "Today";
            else if (i === 1) dayLabel = "Tomorrow";
            else dayLabel = d.toLocaleDateString("en-US", { weekday: "short" });

            const dayNumber = d.getDate();
            const monthLabel = d.toLocaleDateString("en-US", { month: "short" });

            days.push({
                iso,
                dayLabel,
                dayNumber,
                monthLabel
            });
        }
        return days;
    }, []);

    // Time slot options grouped by time of day
    const timeSlotGroups = [
        {
            groupName: "Morning",
            icon: "🌅",
            slots: [
                { label: "09:00 AM", value: "09:00" },
                { label: "10:00 AM", value: "10:00" },
                { label: "11:00 AM", value: "11:00" }
            ]
        },
        {
            groupName: "Afternoon",
            icon: "☀️",
            slots: [
                { label: "12:00 PM", value: "12:00" },
                { label: "01:00 PM", value: "13:00" },
                { label: "02:00 PM", value: "14:00" },
                { label: "03:00 PM", value: "15:00" },
                { label: "04:00 PM", value: "16:00" }
            ]
        },
        {
            groupName: "Evening",
            icon: "🌆",
            slots: [
                { label: "05:00 PM", value: "17:00" },
                { label: "06:00 PM", value: "18:00" },
                { label: "07:00 PM", value: "19:00" },
                { label: "08:00 PM", value: "20:00" },
                { label: "09:00 PM", value: "21:00" }
            ]
        }
    ];

    // Helper to format chosen time for display
    function formatTimeDisplay(timeStr) {
        if (!timeStr) return "";
        const [h, m] = timeStr.split(":").map(Number);
        if (Number.isNaN(h)) return timeStr;
        const period = h >= 12 ? "PM" : "AM";
        const standardHour = h % 12 === 0 ? 12 : h % 12;
        return `${String(standardHour).padStart(2, "0")}:${String(m || 0).padStart(2, "0")} ${period}`;
    }

    // Helper to check if a slot on today's date has already passed
    function isSlotInPast(slotValue) {
        const todayIso = new Date().toISOString().split("T")[0];
        if (date !== todayIso) return false;
        const [slotH, slotM] = slotValue.split(":").map(Number);
        const now = new Date();
        const currentH = now.getHours();
        const currentM = now.getMinutes();
        return slotH < currentH || (slotH === currentH && slotM <= currentM);
    }

    async function createBooking() {
        if (!date || !time) {
            alert("Please select a date and a time slot.");
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
    const avatarInitial = displayName.charAt(0).toUpperCase();

    const skillsList = Array.isArray(mentor?.skillsToTeach)
        ? mentor.skillsToTeach
        : typeof mentor?.skillsToTeach === "string"
        ? mentor.skillsToTeach.split(",").map((s) => s.trim()).filter(Boolean)
        : Array.isArray(mentor?.skills)
        ? mentor.skills
        : [];

    const ratingVal = typeof mentor?.averageRating === "number" && mentor.averageRating > 0
        ? mentor.averageRating.toFixed(1)
        : null;

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

                    <p className="success-eyebrow">TIME SLOT REQUESTED</p>
                    <h1>Request submitted</h1>

                    <p className="success-main-text">
                        Your session request with <strong>{displayName}</strong> for <strong>{duration} minutes</strong> on{" "}
                        <strong>{date}</strong> at <strong>{formatTimeDisplay(time)}</strong> has been sent.
                    </p>

                    <div className="pending-notice">
                        <span className="pending-dot"></span>
                        <div>
                            <strong>Step 1 Complete: Waiting for mentor approval</strong>
                            <p>
                                Once your mentor approves this time slot, payment options will become available in My Sessions to confirm your booking.
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
            <header className="booking-top-bar">
                {onBack && (
                    <button
                        type="button"
                        className="booking-back-btn"
                        onClick={onBack}
                        disabled={loading}
                    >
                        ← Back
                    </button>
                )}
                <div className="booking-breadcrumbs">
                    <span>Mentors</span>
                    <span className="crumb-sep">/</span>
                    <span className="crumb-active">{displayName}</span>
                    <span className="crumb-sep">/</span>
                    <span className="crumb-step">Schedule 1-on-1</span>
                </div>
            </header>

            <div className="booking-container">
                {/* LEFT SIDEBAR: MENTOR INFO & ESCROW SUMMARY */}
                <aside className="booking-sidebar">
                    <div className="mentor-profile-card">
                        <div className="mentor-avatar-badge">
                            <div className="mentor-avatar">{avatarInitial}</div>
                            <span className="mentor-online-dot" title="Active Mentor"></span>
                        </div>

                        <div className="mentor-info">
                            <h2>{displayName}</h2>
                            <p className="mentor-role-headline">
                                {mentor?.headline || mentor?.title || "Skill Exchange Verified Mentor"}
                            </p>

                            <div className="mentor-badges-row">
                                <span className="rate-badge-pill">{rateDisplay}</span>
                                {ratingVal ? (
                                    <span className="rating-pill">★ {ratingVal}</span>
                                ) : (
                                    <span className="rating-pill new-badge">★ New Mentor</span>
                                )}
                            </div>
                        </div>

                        {skillsList.length > 0 && (
                            <div className="mentor-skills-section">
                                <label>Teaches:</label>
                                <div className="skills-pill-group">
                                    {skillsList.slice(0, 5).map((skill, idx) => (
                                        <span key={idx} className="skill-mini-pill">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {mentor?.bio && (
                            <p className="mentor-bio-preview">
                                {mentor.bio.length > 140
                                    ? `${mentor.bio.substring(0, 140)}...`
                                    : mentor.bio}
                            </p>
                        )}
                    </div>

                    {/* ESCROW GUARANTEE CARD */}
                    <div className="escrow-guarantee-card">
                        <div className="escrow-header">
                            <span className="escrow-icon">🛡️</span>
                            <strong>100% Escrow Protection</strong>
                        </div>
                        <p>
                            Learner payments are held safely in escrow and disbursed to the mentor only after the session completes. Full refund guaranteed if cancelled.
                        </p>
                    </div>

                    {/* LIVE PRICING CALCULATION */}
                    <div className="pricing-calculation-card">
                        <div className="pricing-calc-row">
                            <span>Base Hourly Rate:</span>
                            <strong>{rateDisplay}</strong>
                        </div>
                        <div className="pricing-calc-row">
                            <span>Selected Length:</span>
                            <strong>{duration} minutes</strong>
                        </div>
                        <div className="pricing-calc-divider" />
                        <div className="pricing-calc-total">
                            <span>Total Fee:</span>
                            <strong className="calc-amount">{feeDisplay}</strong>
                        </div>

                        {!mentorLoading && !isRateConfigured && (
                            <div className="pricing-warning-alert" role="alert">
                                ⚠️ <strong>Rate not set:</strong> This mentor has not configured their hourly rate. Bookings cannot be requested until a rate is set in their profile.
                            </div>
                        )}

                        <p className="pricing-payment-note">
                            💡 <em>No payment required right now. Payment unlocks only after mentor approval.</em>
                        </p>
                    </div>

                    {/* 3-STEP PROCESS CARD */}
                    <div className="booking-steps-card">
                        <div className="step-item step-active">
                            <span className="step-number">1</span>
                            <div>
                                <strong>Request Time Slot</strong>
                                <small>Pick date, time &amp; agenda</small>
                            </div>
                        </div>
                        <div className="step-item">
                            <span className="step-number">2</span>
                            <div>
                                <strong>Mentor Reviews</strong>
                                <small>Slot is confirmed or adjusted</small>
                            </div>
                        </div>
                        <div className="step-item">
                            <span className="step-number">3</span>
                            <div>
                                <strong>Pay &amp; Join</strong>
                                <small>Secure payment &amp; meet link</small>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* RIGHT MAIN WORKSPACE: INTERACTIVE DATE & TIME SELECTOR */}
                <section className="booking-main-panel">
                    <div className="booking-main-header">
                        <p className="booking-eyebrow">STEP 1 OF 3</p>
                        <h1>Select Date &amp; Time Slot</h1>
                        <p className="booking-panel-subtitle">
                            Choose your preferred session duration, day, and time to connect with <strong>{displayName}</strong>.
                        </p>
                    </div>

                    {mentorError && (
                        <div className="mentor-error-banner" role="alert">
                            ⚠️ {mentorError}
                        </div>
                    )}

                    {/* 1. DURATION SELECTOR */}
                    <div className="booking-form-section">
                        <div className="section-label-row">
                            <label className="section-heading">
                                1. Session Duration
                            </label>
                            <span className="section-selected-value">{duration} minutes selected</span>
                        </div>

                        <div className="duration-pill-group">
                            {[30, 45, 60, 90, 120].map((mins) => (
                                <button
                                    key={mins}
                                    type="button"
                                    className={`duration-pill-card ${duration === mins ? "active" : ""}`}
                                    onClick={() => setDuration(mins)}
                                    disabled={loading || mentorLoading}
                                >
                                    <span className="pill-mins">
                                        {mins >= 60 ? (mins === 60 ? "1 hr" : `${mins / 60} hrs`) : `${mins} mins`}
                                    </span>
                                    <span className="pill-sub">
                                        {mins === 30 ? "Quick intro" : mins === 60 ? "Standard deep-dive" : "Comprehensive"}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 2. INTERACTIVE DATE SELECTOR */}
                    <div className="booking-form-section">
                        <div className="section-label-row">
                            <label className="section-heading">
                                2. Select Date
                            </label>
                            {date ? (
                                <span className="section-selected-value date-highlight">
                                    🗓️ {date}
                                </span>
                            ) : (
                                <span className="section-hint">Choose an upcoming date</span>
                            )}
                        </div>

                        {/* Quick 14-day interactive selector */}
                        <div className="date-chips-grid">
                            {upcomingDays.map((d) => (
                                <button
                                    key={d.iso}
                                    type="button"
                                    className={`date-chip ${date === d.iso ? "active" : ""}`}
                                    onClick={() => {
                                        setDate(d.iso);
                                        setShowCustomDate(false);
                                    }}
                                    disabled={loading || mentorLoading}
                                >
                                    <span className="date-chip-day">{d.dayLabel}</span>
                                    <span className="date-chip-num">{d.dayNumber}</span>
                                    <span className="date-chip-month">{d.monthLabel}</span>
                                </button>
                            ))}
                        </div>

                        <div className="custom-toggle-row">
                            <button
                                type="button"
                                className="custom-toggle-btn"
                                onClick={() => setShowCustomDate(!showCustomDate)}
                            >
                                {showCustomDate ? "▲ Hide calendar picker" : "▼ Pick a custom future date"}
                            </button>
                        </div>

                        {showCustomDate && (
                            <div className="custom-date-container">
                                <label htmlFor="custom-date-input">Calendar Date:</label>
                                <input
                                    id="custom-date-input"
                                    type="date"
                                    value={date}
                                    min={new Date().toISOString().split("T")[0]}
                                    onChange={(e) => setDate(e.target.value)}
                                    disabled={loading || mentorLoading}
                                />
                            </div>
                        )}
                    </div>

                    {/* 3. INTERACTIVE TIME SLOT SELECTOR */}
                    <div className="booking-form-section">
                        <div className="section-label-row">
                            <label className="section-heading">
                                3. Select Time Slot
                            </label>
                            {time ? (
                                <span className="section-selected-value time-highlight">
                                    ⏰ {formatTimeDisplay(time)} (IST)
                                </span>
                            ) : (
                                <span className="section-hint">Select a time period below</span>
                            )}
                        </div>

                        <div className="time-groups-wrapper">
                            {timeSlotGroups.map((group) => (
                                <div key={group.groupName} className="time-group-block">
                                    <div className="time-group-header">
                                        <span className="time-group-icon">{group.icon}</span>
                                        <span className="time-group-title">{group.groupName}</span>
                                    </div>

                                    <div className="time-slots-grid">
                                        {group.slots.map((s) => {
                                            const isSelected = time === s.value;
                                            const isPast = isSlotInPast(s.value);

                                            return (
                                                <button
                                                    key={s.value}
                                                    type="button"
                                                    className={`time-slot-pill ${isSelected ? "active" : ""} ${isPast ? "slot-past" : ""}`}
                                                    onClick={() => {
                                                        setTime(s.value);
                                                        setShowCustomTime(false);
                                                    }}
                                                    disabled={loading || mentorLoading || isPast}
                                                    title={isPast ? "This slot has already passed today" : s.label}
                                                >
                                                    <span className="time-slot-text">{s.label}</span>
                                                    {isPast && <span className="past-tag">Passed</span>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="custom-toggle-row">
                            <button
                                type="button"
                                className="custom-toggle-btn"
                                onClick={() => setShowCustomTime(!showCustomTime)}
                            >
                                {showCustomTime ? "▲ Hide custom time input" : "▼ Enter custom time"}
                            </button>
                        </div>

                        {showCustomTime && (
                            <div className="custom-time-container">
                                <label htmlFor="custom-time-input">Specify exact time:</label>
                                <input
                                    id="custom-time-input"
                                    type="time"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    disabled={loading || mentorLoading}
                                />
                            </div>
                        )}

                        {/* LIVE AVAILABILITY FEEDBACK */}
                        {date && time && (
                            <div
                                className={`slot-availability-banner ${
                                    availability.checking
                                        ? "checking"
                                        : availability.available
                                        ? "available"
                                        : "unavailable"
                                }`}
                            >
                                {availability.checking ? (
                                    <span>⏳ Checking schedule availability with mentor...</span>
                                ) : availability.available ? (
                                    <span>✓ Slot is available! <strong>{date}</strong> at <strong>{formatTimeDisplay(time)}</strong> for {duration} mins.</span>
                                ) : (
                                    <span>⚠️ {availability.message || "Slot conflict: This time is already booked. Please pick another slot."}</span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* 4. DISCUSSION TOPICS / MESSAGE */}
                    <div className="booking-form-section">
                        <label className="section-heading" htmlFor="booking-message-input">
                            4. Topics &amp; Goals (Optional)
                        </label>
                        <p className="field-subtext">
                            Help your mentor prepare by describing what you want to learn or discuss.
                        </p>
                        <textarea
                            id="booking-message-input"
                            className="booking-textarea"
                            placeholder="e.g. I would like help troubleshooting a React state issue and learning best practices for system architecture."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            disabled={loading || mentorLoading}
                        />
                    </div>

                    {/* 5. SUBMIT ACTION */}
                    <div className="booking-action-footer">
                        <button
                            className="request-booking-btn"
                            onClick={createBooking}
                            disabled={!canSubmit}
                        >
                            {loading
                                ? "Submitting Request..."
                                : mentorLoading
                                ? "Loading Mentor Profile..."
                                : !isRateConfigured
                                ? "Rate Not Configured — Cannot Book"
                                : !date
                                ? "Select a Date to Continue"
                                : !time
                                ? "Select a Time Slot to Continue"
                                : availability.available === false
                                ? "Select an Available Time Slot"
                                : "Request Time Slot for Approval →"}
                        </button>

                        <p className="booking-submit-disclaimer">
                            🔒 <strong>No payment charged today.</strong> You only pay after your mentor confirms and approves this request.
                        </p>
                    </div>
                </section>
            </div>
        </main>
    );
}

export default BookingPage;
// @teamcosmiccoders
