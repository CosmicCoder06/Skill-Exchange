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
                <section className="booking-success-content">
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
            <div className="booking-canvas">
                {/* TOP BREADCRUMB & CONTEXT */}
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
                        <span className="crumb-step">Schedule Session</span>
                    </div>
                </header>

                <div className="booking-layout-grid">
                    {/* LEFT OPEN COLUMN: MENTOR & DETAILS (NON-BOXY, SEAMLESS) */}
                    <aside className="booking-aside-column">
                        <div className="mentor-identity-block">
                            <div className="mentor-avatar-badge">
                                {mentor?.avatarUrl ? (
                                    <img src={mentor.avatarUrl} alt={displayName} className="mentor-avatar-img" />
                                ) : (
                                    <div className="mentor-avatar">{avatarInitial}</div>
                                )}
                                <span className="mentor-online-dot" title="Verified Mentor"></span>
                            </div>

                            <div className="mentor-identity-text">
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
                        </div>

                        {mentor?.bio && (
                            <p className="mentor-bio-text">
                                {mentor.bio.length > 160
                                    ? `${mentor.bio.substring(0, 160)}...`
                                    : mentor.bio}
                            </p>
                        )}

                        {skillsList.length > 0 && (
                            <div className="mentor-skills-block">
                                <span className="aside-subheading">AREAS OF EXPERTISE</span>
                                <div className="skills-pill-group">
                                    {skillsList.slice(0, 6).map((skill, idx) => (
                                        <span key={idx} className="skill-mini-pill">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="aside-divider" />

                        {/* MINIMAL INVOICE-STYLE PRICING SUMMARY (NON-BOXY) */}
                        <div className="pricing-summary-block">
                            <span className="aside-subheading">SESSION ESTIMATE</span>
                            <div className="pricing-calc-row">
                                <span>Mentor hourly rate</span>
                                <strong>{rateDisplay}</strong>
                            </div>
                            <div className="pricing-calc-row">
                                <span>Session duration</span>
                                <strong>{duration} minutes</strong>
                            </div>
                            <div className="pricing-total-row">
                                <span>Total payable</span>
                                <span className="calc-amount">{feeDisplay}</span>
                            </div>

                            {!mentorLoading && !isRateConfigured && (
                                <div className="pricing-warning-inline" role="alert">
                                    ⚠️ <strong>Rate not set:</strong> This mentor has not configured an hourly rate yet.
                                </div>
                            )}

                            <p className="pricing-subnote">
                                🔒 <strong>Zero advance charge:</strong> Payment unlocks only after your mentor reviews and approves this time slot.
                            </p>
                        </div>

                        <div className="aside-divider" />

                        {/* ESCROW GUARANTEE CALLOUT */}
                        <div className="escrow-inline-callout">
                            <span className="escrow-badge-icon">🛡️</span>
                            <div>
                                <strong>100% Escrow Protection</strong>
                                <p>
                                    Your money remains in escrow until your 1-on-1 session is successfully held.
                                </p>
                            </div>
                        </div>
                    </aside>

                    {/* RIGHT OPEN CANVAS: SCHEDULING WORKSPACE (NON-BOXY) */}
                    <section className="booking-main-canvas">
                        <div className="booking-canvas-header">
                            <span className="canvas-step-badge">STEP 1 OF 3 • SCHEDULE</span>
                            <h1>Select date &amp; time slot</h1>
                            <p className="canvas-lead">
                                Choose duration, pick an open date, and choose your preferred time to connect.
                            </p>
                        </div>

                        {mentorError && (
                            <div className="mentor-error-inline" role="alert">
                                ⚠️ {mentorError}
                            </div>
                        )}

                        {/* 1. DURATION SELECTOR (NON-BOXY PILLS) */}
                        <div className="booking-section-open">
                            <div className="section-title-row">
                                <label className="section-title">
                                    1. Session Duration
                                </label>
                                <span className="section-current-value">{duration} minutes selected</span>
                            </div>

                            <div className="duration-pill-group">
                                {[30, 45, 60, 90, 120].map((mins) => (
                                    <button
                                        key={mins}
                                        type="button"
                                        className={`duration-pill-clean ${duration === mins ? "active" : ""}`}
                                        onClick={() => setDuration(mins)}
                                        disabled={loading || mentorLoading}
                                    >
                                        <span className="pill-mins">
                                            {mins >= 60 ? (mins === 60 ? "1 hr" : `${mins / 60} hrs`) : `${mins} mins`}
                                        </span>
                                        <span className="pill-sub">
                                            {mins === 30 ? "Intro" : mins === 60 ? "Standard" : "Deep-dive"}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 2. UPCOMING DATES CHIPS (NON-BOXY) */}
                        <div className="booking-section-open">
                            <div className="section-title-row">
                                <label className="section-title">
                                    2. Select Date
                                </label>
                                {date ? (
                                    <span className="section-current-value highlight">
                                        🗓️ {date}
                                    </span>
                                ) : (
                                    <span className="section-hint">Select an upcoming day</span>
                                )}
                            </div>

                            <div className="date-chips-scroller">
                                {upcomingDays.map((d) => (
                                    <button
                                        key={d.iso}
                                        type="button"
                                        className={`date-pill-clean ${date === d.iso ? "active" : ""}`}
                                        onClick={() => {
                                            setDate(d.iso);
                                            setShowCustomDate(false);
                                        }}
                                        disabled={loading || mentorLoading}
                                    >
                                        <span className="date-pill-day">{d.dayLabel}</span>
                                        <span className="date-pill-num">{d.dayNumber}</span>
                                        <span className="date-pill-month">{d.monthLabel}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="custom-link-row">
                                <button
                                    type="button"
                                    className="custom-link-btn"
                                    onClick={() => setShowCustomDate(!showCustomDate)}
                                >
                                    {showCustomDate ? "▲ Hide calendar picker" : "▼ Pick a specific date from calendar"}
                                </button>
                            </div>

                            {showCustomDate && (
                                <div className="custom-input-box">
                                    <label htmlFor="custom-date-field">Choose date:</label>
                                    <input
                                        id="custom-date-field"
                                        type="date"
                                        value={date}
                                        min={new Date().toISOString().split("T")[0]}
                                        onChange={(e) => setDate(e.target.value)}
                                        disabled={loading || mentorLoading}
                                    />
                                </div>
                            )}
                        </div>

                        {/* 3. TIME SLOTS (OPEN PRESENTATION, NO BOXES) */}
                        <div className="booking-section-open">
                            <div className="section-title-row">
                                <label className="section-title">
                                    3. Select Time Slot
                                </label>
                                {time ? (
                                    <span className="section-current-value highlight">
                                        ⏰ {formatTimeDisplay(time)} (IST)
                                    </span>
                                ) : (
                                    <span className="section-hint">Choose morning, afternoon, or evening</span>
                                )}
                            </div>

                            <div className="time-periods-list">
                                {timeSlotGroups.map((group) => (
                                    <div key={group.groupName} className="time-period-row">
                                        <div className="period-label">
                                            <span>{group.icon}</span>
                                            <span>{group.groupName}</span>
                                        </div>

                                        <div className="period-slots-list">
                                            {group.slots.map((s) => {
                                                const isSelected = time === s.value;
                                                const isPast = isSlotInPast(s.value);

                                                return (
                                                    <button
                                                        key={s.value}
                                                        type="button"
                                                        className={`time-pill-clean ${isSelected ? "active" : ""} ${isPast ? "is-past" : ""}`}
                                                        onClick={() => {
                                                            setTime(s.value);
                                                            setShowCustomTime(false);
                                                        }}
                                                        disabled={loading || mentorLoading || isPast}
                                                        title={isPast ? "Slot passed today" : s.label}
                                                    >
                                                        <span>{s.label}</span>
                                                        {isPast && <small className="past-indicator">Passed</small>}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="custom-link-row">
                                <button
                                    type="button"
                                    className="custom-link-btn"
                                    onClick={() => setShowCustomTime(!showCustomTime)}
                                >
                                    {showCustomTime ? "▲ Hide custom time input" : "▼ Enter custom specific time"}
                                </button>
                            </div>

                            {showCustomTime && (
                                <div className="custom-input-box">
                                    <label htmlFor="custom-time-field">Enter time:</label>
                                    <input
                                        id="custom-time-field"
                                        type="time"
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                        disabled={loading || mentorLoading}
                                    />
                                </div>
                            )}

                            {/* AVAILABILITY FEEDBACK */}
                            {date && time && (
                                <div
                                    className={`slot-status-inline ${
                                        availability.checking
                                            ? "checking"
                                            : availability.available
                                            ? "available"
                                            : "unavailable"
                                    }`}
                                >
                                    {availability.checking ? (
                                        <span>⏳ Checking slot availability with mentor...</span>
                                    ) : availability.available ? (
                                        <span>✓ <strong>{date}</strong> at <strong>{formatTimeDisplay(time)}</strong> is open &amp; available!</span>
                                    ) : (
                                        <span>⚠️ {availability.message || "This slot is already booked. Please choose another slot."}</span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* 4. AGENDA / GOALS (MINIMAL PROSE FIELD) */}
                        <div className="booking-section-open">
                            <label className="section-title" htmlFor="session-agenda-textarea">
                                4. Topics or Goals (Optional)
                            </label>
                            <p className="agenda-subtext">
                                What would you like to focus on during this 1-on-1 session?
                            </p>
                            <textarea
                                id="session-agenda-textarea"
                                className="agenda-textarea-clean"
                                placeholder="e.g. Code review for my project, system design architecture, and career guidance."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                disabled={loading || mentorLoading}
                            />
                        </div>

                        {/* 5. PRIMARY CTA */}
                        <div className="booking-submit-area">
                            <button
                                className="booking-primary-btn"
                                onClick={createBooking}
                                disabled={!canSubmit}
                            >
                                {loading
                                    ? "Submitting Request..."
                                    : mentorLoading
                                    ? "Loading Mentor..."
                                    : !isRateConfigured
                                    ? "Rate Not Configured — Cannot Book"
                                    : !date
                                    ? "Select Date to Continue"
                                    : !time
                                    ? "Select Time Slot to Continue"
                                    : availability.available === false
                                    ? "Choose an Available Slot"
                                    : "Request Time Slot for Approval →"}
                            </button>

                            <p className="booking-footnote">
                                🔒 <strong>No immediate payment required.</strong> Payment is unlocked only after {displayName} confirms this slot.
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}

export default BookingPage;
// @teamcosmiccoders
