import {
    useCallback,
    useEffect,
    useState
} from "react";

import BookingCalendar from "../Components/booking/BookingCalendar";
import GoogleMeetLink from '../Components/booking/GoogleMeetLink';
import PaymentReceipt from '../Components/booking/PaymentReceipt';
import SuggestSlotsModal from '../Components/booking/SuggestSlotsModal';
import Modal from "../Components/common/Modal";
import SessionStatusCard from "../Components/booking/SessionStatusCard";
import {
    FileText,
    MessageSquare,
    Check,
    Star,
    Calendar,
    CheckCircle2,
    Clock,
    AlertTriangle,
    CreditCard,
    Sparkles,
    Layers
} from "lucide-react";

import "./MyBookings.css";

const getUserIdFromToken = (token) => {
    try {
        if (!token) return null;

        const payload = JSON.parse(
            atob(token.split(".")[1])
        );

        return (
            payload._id ||
            payload.id ||
            payload.userId ||
            payload.sub ||
            null
        );
    } catch {
        return null;
    }
};

const getBookingPerson = (
    booking,
    currentUserId
) => {
    const mentorId =
        booking?.mentor?._id ||
        booking?.mentor?.id;

    const learnerId =
        booking?.learner?._id ||
        booking?.learner?.id;

    if (!currentUserId) {
        return {
            person: null,
            role: ""
        };
    }

    if (
        String(currentUserId) ===
        String(mentorId)
    ) {
        return {
            person: booking.learner,
            role: "Learner"
        };
    }

    if (
        String(currentUserId) ===
        String(learnerId)
    ) {
        return {
            person: booking.mentor,
            role: "Mentor"
        };
    }

    return {
        person: null,
        role: ""
    };
};

const parseSessionDateTime = (dateStr, timeStr) => {
    if (!dateStr) return null;
    let d = new Date(`${dateStr}T${timeStr || "00:00"}`);
    if (!Number.isNaN(d.getTime())) return d;
    d = new Date(`${dateStr} ${timeStr || "00:00"}`);
    if (!Number.isNaN(d.getTime())) return d;
    d = new Date(dateStr);
    if (!Number.isNaN(d.getTime())) return d;
    return null;
};

const getSessionStartDate = (booking) => {
    const d = parseSessionDateTime(booking?.date, booking?.time);
    return d ? d.getTime() : Number.MAX_SAFE_INTEGER;
};

const getSessionEndDate = (booking) => {
    const d = parseSessionDateTime(booking?.date, booking?.time);
    if (!d) return Number.MAX_SAFE_INTEGER;
    const durationMinutes = Number(booking?.duration) || 60;
    return d.getTime() + durationMinutes * 60 * 1000;
};

const isMissedSession = (booking) => {
    if (!booking) return false;
    if (["completed", "rejected", "cancelled"].includes(booking?.status)) {
        return false;
    }
    const endMs = getSessionEndDate(booking);
    return endMs !== Number.MAX_SAFE_INTEGER && endMs < Date.now();
};

const getCreatedDate = (booking) => {
    const date = new Date(
        booking?.createdAt
    );

    return Number.isNaN(date.getTime())
        ? 0
        : date.getTime();
};

const getSessionTimestamp = (booking) => {
    const d = parseSessionDateTime(booking?.date, booking?.time);
    return d ? d.getTime() : 0;
};

const sortBookings = (bookings) => {
    return [...bookings].sort((a, b) => {
        const timeA = getSessionTimestamp(a);
        const timeB = getSessionTimestamp(b);

        if (timeA > 0 && timeB > 0 && timeA !== timeB) {
            return timeB - timeA;
        }
        if (timeA > 0 && (!timeB || timeB === 0)) {
            return -1;
        }
        if (timeB > 0 && (!timeA || timeA === 0)) {
            return 1;
        }

        return getCreatedDate(b) - getCreatedDate(a);
    });
};

function MyBookings({
    token,
    onJoinSession
}) {
    const [bookings, setBookings] =
        useState([]);

    const [requests, setRequests] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] = useState(false);

    const [error, setError] =
        useState("");

    const [reviewBooking, setReviewBooking] =
        useState(null);

    const [rating, setRating] =
        useState(5);

    const [comment, setComment] =
        useState("");

    const [submittingReview, setSubmittingReview] =
        useState(false);

    const [
        reviewedBookings,
        setReviewedBookings
    ] = useState({});

    const [
        selectedCalendarBooking,
        setSelectedCalendarBooking
    ] = useState(null);

    const [suggestSlotsBooking, setSuggestSlotsBooking] = useState(null);
    const [detailsBooking, setDetailsBooking] = useState(null);
    const [sessionTab, setSessionTab] = useState("active");
    const [detailsReviews, setDetailsReviews] = useState({
        loading: false,
        learnerReview: null,
        mentorReview: null
    });

    const API =
        import.meta.env.VITE_API_URL;

    const currentUserId =
        getUserIdFromToken(token);

    const fetchBookings =
        useCallback(async () => {
            try {
                setLoading(true);
                setError("");

                const response =
                    await fetch(
                        `${API}/bookings`,
                        {
                            headers: {
                                Authorization:
                                    `Bearer ${token}`
                            }
                        }
                    );

                if (!response.ok) {
                    throw new Error(
                        "Unable to load bookings"
                    );
                }

                const data =
                    await response.json();

                setBookings(
                    Array.isArray(data)
                        ? data
                        : []
                );

                // Populate reviewed bookings map
                try {
                    const revRes = await fetch(`${API}/reviews`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (revRes.ok) {
                        const revData = await revRes.json();
                        if (Array.isArray(revData)) {
                            const revMap = {};
                            revData.forEach((r) => {
                                const bId = r.booking?._id || r.booking;
                                if (bId) revMap[bId] = true;
                            });
                            setReviewedBookings((prev) => ({ ...prev, ...revMap }));
                        }
                    }
                } catch {
                    // Non-fatal
                }
            } catch (error) {
                console.error(
                    "Bookings fetch error:",
                    error
                );

                setError(error.message);
            } finally {
                setLoading(false);
            }
        }, [API, token]);

    const handleMeetingUrlUpdated = (bookingId, meetingUrl) => {
        setBookings((prev) =>
            prev.map((b) => (b._id === bookingId ? { ...b, meetingUrl } : b))
        );
        setRequests((prev) =>
            prev.map((r) => (r._id === bookingId ? { ...r, meetingUrl } : r))
        );
        setDetailsBooking((prev) =>
            prev && prev._id === bookingId ? { ...prev, meetingUrl } : prev
        );
    };

    useEffect(() => {
        if (!detailsBooking?._id) {
            setDetailsReviews({ loading: false, learnerReview: null, mentorReview: null });
            return;
        }

        let isMounted = true;
        setDetailsReviews({ loading: true, learnerReview: null, mentorReview: null });

        fetch(`${API}/reviews/booking/${detailsBooking._id}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (isMounted && data) {
                    setDetailsReviews({
                        loading: false,
                        learnerReview: data.learnerReview || null,
                        mentorReview: data.mentorReview || null
                    });
                }
            })
            .catch((err) => {
                console.error("Error fetching session details reviews:", err);
                if (isMounted) {
                    setDetailsReviews({ loading: false, learnerReview: null, mentorReview: null });
                }
            });

        return () => {
            isMounted = false;
        };
    }, [detailsBooking?._id, API, token]);

    const fetchRequests =
        useCallback(async () => {
            try {
                const response =
                    await fetch(
                        `${API}/bookings/requests`,
                        {
                            headers: {
                                Authorization:
                                    `Bearer ${token}`
                            }
                        }
                    );

                if (!response.ok) {
                    return;
                }

                const data =
                    await response.json();

                setRequests(
                    Array.isArray(data)
                        ? data
                        : []
                );
            } catch (error) {
                console.error(
                    "Requests fetch error:",
                    error
                );
            }
        }, [API, token]);

    const refreshSessions = async () => {
        setRefreshing(true);
        await Promise.all([fetchBookings(), fetchRequests()]);
        setRefreshing(false);
    };

    useEffect(() => {
        if (!token) return;

        const timer = setTimeout(() => {
            fetchBookings();
            fetchRequests();
        }, 0);

        return () => {
            clearTimeout(timer);
        };
    }, [
        token,
        fetchBookings,
        fetchRequests
    ]);

    const checkReviewStatus =
        useCallback(
            async (bookingId) => {
                try {
                    const response =
                        await fetch(
                            `${API}/reviews/booking/${bookingId}`,
                            {
                                headers: {
                                    Authorization:
                                        `Bearer ${token}`
                                }
                            }
                        );

                    if (!response.ok) {
                        return;
                    }

                    const data =
                        await response.json();

                    setReviewedBookings(
                        (previous) => ({
                            ...previous,
                            [bookingId]:
                                Boolean(
                                    data.review
                                )
                        })
                    );
                } catch (error) {
                    console.error(
                        "Review status error:",
                        error
                    );
                }
            },
            [API, token]
        );

    useEffect(() => {
        const completedBookings =
            bookings.filter(
                (booking) =>
                    booking.status ===
                    "completed"
            );

        completedBookings.forEach(
            (booking) => {
                checkReviewStatus(
                    booking._id
                );
            }
        );
    }, [
        bookings,
        checkReviewStatus
    ]);

    async function updateBooking(
        bookingId,
        status
    ) {
        try {
            const response =
                await fetch(
                    `${API}/bookings/${bookingId}`,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type":
                                "application/json",
                            Authorization:
                                `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            status
                        })
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Unable to update booking"
                );
            }

            await Promise.all([
                fetchBookings(),
                fetchRequests()
            ]);

            setSelectedCalendarBooking(
                null
            );
        } catch (error) {
            console.error(
                "Booking update error:",
                error
            );

            window.alert(
                error.message
            );
        }
    }

    async function chooseSlot(bookingId, date, time) {
        try {
            const response = await fetch(`${API}/bookings/${bookingId}/choose-slot`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ date, time })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Failed to select slot");
            }

            // Update local state directly so the status flips to approved and payment unlocks immediately
            setBookings((prev) =>
                prev.map((b) => (b._id === bookingId ? { ...b, ...data.booking } : b))
            );

            await Promise.all([fetchBookings(), fetchRequests()]);
        } catch (error) {
            console.error("Choose slot error:", error);
            window.alert(error.message);
        }
    }

    function formatTimeRemaining(expiresAt) {
        if (!expiresAt) return null;
        const diffMs = new Date(expiresAt).getTime() - Date.now();
        if (diffMs <= 0) return "Action window expired";
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        if (hours === 0) return `${mins}m left`;
        return `${hours}h ${mins}m left`;
    }

    async function cancelBooking(
        bookingId
    ) {
        const targetBooking =
            bookings.find((b) => b._id === bookingId) ||
            requests.find((r) => r._id === bookingId);

        const mentorId =
            targetBooking?.mentor?._id ||
            targetBooking?.mentor?.id ||
            targetBooking?.mentor;
        const isMentor = String(mentorId) === String(currentUserId);
        const wasAccepted = targetBooking?.status === "accepted";
        const hasPayment =
            Number(targetBooking?.paymentAmount) > 0 &&
            targetBooking?.paymentMethod !== "free";

        let confirmPrompt = "Cancel this booking?";
        if (isMentor && wasAccepted && hasPayment) {
            confirmPrompt = `⚠️ Cancellation Policy Warning:\n\nIf you cancel this confirmed session, the learner's payment of ₹${Number(targetBooking.paymentAmount).toLocaleString("en-IN")} will be refunded — and you will be responsible for covering that refund under the platform cancellation policy.\n\nAre you sure you want to proceed with cancellation?`;
        }

        if (!window.confirm(confirmPrompt)) {
            return;
        }

        try {
            const response =
                await fetch(
                    `${API}/bookings/${bookingId}`,
                    {
                        method: "DELETE",
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Unable to cancel booking"
                );
            }

            if (data.learnerRefundDue) {
                window.alert(
                    "Session cancelled. Under platform policy, you are responsible for covering the learner's refund."
                );
            }

            setSelectedCalendarBooking(
                null
            );

            await Promise.all([fetchBookings(), fetchRequests()]);
        } catch (error) {
            console.error(
                "Cancel booking error:",
                error
            );

            window.alert(
                error.message
            );
        }
    }

    function openReview(booking) {
        setReviewBooking(booking);
        setRating(5);
        setComment("");
    }

    async function submitReview() {
        if (!reviewBooking) return;

        try {
            setSubmittingReview(true);

            const response =
                await fetch(
                    `${API}/reviews`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json",
                            Authorization:
                                `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            bookingId:
                                reviewBooking._id,
                            rating,
                            comment
                        })
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Unable to submit review"
                );
            }

            setReviewedBookings(
                (previous) => ({
                    ...previous,
                    [reviewBooking._id]:
                        true
                })
            );

            if (detailsBooking && detailsBooking._id === reviewBooking._id) {
                fetch(`${API}/reviews/booking/${reviewBooking._id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                    .then((res) => (res.ok ? res.json() : null))
                    .then((d) => {
                        if (d) {
                            setDetailsReviews({
                                loading: false,
                                learnerReview: d.learnerReview || null,
                                mentorReview: d.mentorReview || null
                            });
                        }
                    })
                    .catch(() => {});
            }

            setReviewBooking(null);
            setRating(5);
            setComment("");

            window.alert(
                "Review submitted successfully ⭐"
            );
        } catch (error) {
            console.error(
                "Review submit error:",
                error
            );

            window.alert(
                error.message
            );
        } finally {
            setSubmittingReview(false);
        }
    }

    const mySessions =
        sortBookings(
            bookings.filter(
                (booking) => {
                    const mentorId =
                        booking.mentor?._id ||
                        booking.mentor?.id;

                    const isMentor =
                        String(
                            mentorId
                        ) ===
                        String(
                            currentUserId
                        );

                    if (
                        booking.status ===
                            "pending" &&
                        isMentor
                    ) {
                        return false;
                    }

                    return true;
                }
            )
        );

    const isSessionBooker = (b) => {
        const mentorId = b.mentor?._id || b.mentor?.id || b.mentor;
        return String(mentorId) !== String(currentUserId);
    };

    // 1. Payment Pending: Time slot approved awaiting payment, or alternate slots offered to booker
    const paymentPendingSessions = mySessions.filter((b) => {
        if (b.status === "approved") return true;
        if (b.status === "slots_offered" && isSessionBooker(b)) return true;
        return false;
    });

    // 2. Upcoming / Active: Confirmed & accepted sessions (not missed, not completed)
    const upcomingSessions = mySessions.filter((b) => {
        if (b.status === "accepted" && !isMissedSession(b)) return true;
        if (b.status === "slots_offered" && !isSessionBooker(b)) return true;
        return false;
    });

    // 3. Pending Approval: Requests awaiting mentor's decision
    const pendingApprovalSessions = mySessions.filter((b) => {
        return b.status === "pending" && isSessionBooker(b);
    });

    // 4. Completed Sessions
    const completedSessions = mySessions.filter((b) => {
        return b.status === "completed";
    });

    // 5. Cancelled / Declined / Missed Sessions
    const cancelledSessions = mySessions.filter((b) => {
        return b.status === "cancelled" || b.status === "rejected" || isMissedSession(b);
    });

    // Combined Active view (Payment Pending + Upcoming + Pending Approval)
    const activeSessions = [
        ...paymentPendingSessions,
        ...upcomingSessions,
        ...pendingApprovalSessions
    ];

    function renderSessionGroupSection({
        id,
        title,
        subtitle,
        icon: Icon,
        count,
        items,
        emptyMessage,
        isUrgent = false
    }) {
        if (items.length === 0 && emptyMessage) {
            return (
                <div className="tab-empty-state" key={id}>
                    <div className="tab-empty-icon">
                        <Icon size={32} />
                    </div>
                    <h4>{emptyMessage.title}</h4>
                    <p>{emptyMessage.description}</p>
                </div>
            );
        }

        if (items.length === 0) return null;

        return (
            <div className={`session-group-section ${isUrgent ? "is-urgent-group" : ""}`} key={id}>
                <div className="session-group-header">
                    <div className="session-group-title-wrap">
                        <div className={`session-group-icon-bubble ${isUrgent ? "urgent-bubble" : ""}`}>
                            <Icon size={18} />
                        </div>
                        <div>
                            <div className="session-group-heading-line">
                                <h3>{title}</h3>
                                <span className={`session-group-badge ${isUrgent ? "urgent" : ""}`}>
                                    {count}
                                </span>
                            </div>
                            {subtitle && <p className="session-group-subtext">{subtitle}</p>}
                        </div>
                    </div>
                </div>

                <div className="booking-grid">
                    {items.map((booking) => renderBookingCard(booking))}
                </div>
            </div>
        );
    }

    function renderBookingCard(
        booking
    ) {
        const isCompleted =
            booking.status ===
            "completed";

        const isPending =
            booking.status ===
            "pending";

        const isAccepted =
            booking.status ===
            "accepted";

        const isMissed = isMissedSession(booking);

        const alreadyReviewed =
            reviewedBookings[
                booking._id
            ] === true;

        const isBooker =
            String(booking.learner?._id || booking.learner?.id || booking.learner) ===
            String(currentUserId);

        const isMentor =
            String(booking.mentor?._id || booking.mentor?.id || booking.mentor) ===
            String(currentUserId);

        const duration = Number(booking.duration) || 60;
        const sessionEnded = getSessionEndDate(booking) <= Date.now();
        const canLeaveReview = isCompleted && !alreadyReviewed && sessionEnded && !isMissed;

        // Mentor's special rule: only until the mentor adds the link on accepted sessions
        const showMentorAddMeetingLink = isMentor && isAccepted && !booking.meetingUrl && !isMissed;

        return (
            <article className="booking-card modern-session-card" key={booking._id}>
                {/* 1. CARD TOP HEADER */}
                <div className="card-top-bar">
                    <div className="card-identity-group">
                        <span className={`card-role-badge ${isBooker ? "is-booker" : "is-mentor"}`}>
                            {isBooker ? "Booker Receipt" : "Host Invoice"}
                        </span>
                        <span className="card-invoice-number">#{booking._id.slice(-6).toUpperCase()}</span>
                    </div>
                    <span className="card-duration-badge">⏱ {duration} mins</span>
                </div>

                {/* 2. PAYMENT SUMMARY BOX */}
                <PaymentReceipt
                    key={`${booking._id}-${booking.paymentStatus}-${booking.status}`}
                    booking={booking}
                    token={token}
                    currentUserId={currentUserId}
                    onBookingUpdated={(updated) => {
                        setBookings((prev) =>
                            prev.map((b) => (b._id === updated._id ? { ...b, ...updated } : b))
                        );
                    }}
                />

                {/* 3. SESSION STATUS BANNER */}
                <SessionStatusCard
                    booking={booking}
                    isBooker={isBooker}
                    isMissed={isMissed}
                    alreadyReviewed={alreadyReviewed}
                    onLeaveReview={canLeaveReview ? () => openReview(booking) : null}
                    formatTimeRemaining={formatTimeRemaining}
                />

                {/* 4. SLOTS OFFERED FLOW */}
                {booking.status === "slots_offered" && isBooker && (
                    <div className="slots-offered-box booker-view">
                        <div className="slots-offered-header">
                            <div>
                                <span className="slots-kicker">ALTERNATE SLOTS PROPOSED</span>
                                <h4>Choose an Available Slot</h4>
                                <p>The mentor offered the following available slots matching your <strong>{duration} min</strong> session. Select any slot to proceed directly to payment.</p>
                            </div>
                            {booking.actionExpiresAt && (
                                <span className="expiry-pill-badge">
                                    ⏱ {formatTimeRemaining(booking.actionExpiresAt)}
                                </span>
                            )}
                        </div>

                        <div className="slots-selection-list">
                            {Array.isArray(booking.suggestedSlots) && booking.suggestedSlots.map((slot, idx) => (
                                <div
                                    key={idx}
                                    className={`slot-option-card ${slot.isPreferred ? "highlighted-preferred-slot" : ""}`}
                                >
                                    <div className="slot-option-details">
                                        {slot.isPreferred && (
                                            <span className="recommended-slot-tag">
                                                ★ Mentor's Recommended Slot
                                            </span>
                                        )}
                                        <div className="slot-datetime-line">
                                            <strong>📅 {slot.date}</strong>
                                            <span>⏰ {slot.time} ({duration} mins)</span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="select-and-pay-btn"
                                        onClick={() => chooseSlot(booking._id, slot.date, slot.time)}
                                    >
                                        Select Slot & Pay →
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {booking.status === "slots_offered" && !isBooker && (
                    <div className="slots-offered-box mentor-view">
                        <div className="slots-offered-header">
                            <div>
                                <span className="slots-kicker">SLOTS SHARED</span>
                                <h4>Available Slots Shared with Learner</h4>
                                <p>You shared {booking.suggestedSlots?.length || 0} alternate slots. The learner can pick any slot and proceed directly to payment without further confirmation from you.</p>
                            </div>
                            {booking.actionExpiresAt && (
                                <span className="expiry-pill-badge">
                                    ⏱ {formatTimeRemaining(booking.actionExpiresAt)}
                                </span>
                            )}
                        </div>
                        <div className="mentor-shared-slots-summary">
                            {booking.suggestedSlots?.map((slot, idx) => (
                                <span
                                    key={idx}
                                    className={`shared-slot-chip ${slot.isPreferred ? "is-favored" : ""}`}
                                >
                                    {slot.isPreferred ? "★ " : ""}{slot.date} at {slot.time}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* 5. MENTOR'S ADD MEETING LINK (Special Visibility: only until mentor adds the link) */}
                {showMentorAddMeetingLink && (
                    <div className="mentor-main-add-meet-box">
                        <GoogleMeetLink
                            key={`main-${booking._id}-${booking.meetingUrl || ''}`}
                            booking={booking}
                            token={token}
                            currentUserId={currentUserId}
                            onLinkSaved={(newUrl) => handleMeetingUrlUpdated(booking._id, newUrl)}
                        />
                    </div>
                )}

                {/* 6. MINIMAL MAIN CARD ACTIONS */}
                <div className="card-actions-wrapper">
                    {/* View Session Details button on ALL cards */}
                    <button
                        type="button"
                        className="btn-view-session-details"
                        onClick={() => setDetailsBooking(booking)}
                    >
                        <FileText size={15} />
                        <span>View Session Details</span>
                    </button>

                    {/* Leave Review on Completed Sessions (only after session duration has ended) */}
                    {canLeaveReview && (
                        <button
                            type="button"
                            className="btn-leave-review-action"
                            onClick={() => openReview(booking)}
                        >
                            <Star size={15} />
                            <span>Leave Session Review ⭐</span>
                        </button>
                    )}
                </div>
            </article>
        );
    }

    function handleCalendarBooking(
        booking
    ) {
        setSelectedCalendarBooking(
            booking
        );
    }

    if (loading) {
        return (
            <main className="bookings-loading">
                <h2>
                    Loading your bookings...
                </h2>

                <p>
                    Please wait a moment.
                </p>
            </main>
        );
    }

    return (
        <main className="bookings-page">
            <header className="bookings-header">
                <div>
                    <p className="bookings-eyebrow">
                        SESSIONS
                    </p>

                    <h1>
                        My Sessions
                    </h1>

                    <p className="bookings-subtitle">
                        Track upcoming
                        sessions, requests
                        and completed
                        skill exchanges.
                    </p>
                </div>

                <button
                    className="refresh-bookings"
                    onClick={refreshSessions}
                    disabled={refreshing}
                >
                    {refreshing ? "Refreshing…" : "↻ Refresh"}
                </button>
            </header>

            {error && (
                <div className="booking-error">
                    {error}
                </div>
            )}

            {/* BOOKING CALENDAR */}

            <section className="booking-calendar-section">
                <BookingCalendar
                    bookings={mySessions}
                    onSelectBooking={
                        handleCalendarBooking
                    }
                />
            </section>

            {/* SELECTED CALENDAR BOOKING MODAL */}
            <Modal
                isOpen={Boolean(selectedCalendarBooking)}
                onClose={() => setSelectedCalendarBooking(null)}
                title="Session Details"
                eyebrow="CALENDAR SESSION"
                subtitle={
                    selectedCalendarBooking
                        ? `${selectedCalendarBooking.date} at ${selectedCalendarBooking.time}`
                        : ""
                }
                maxWidth="md"
            >
                <div className="calendar-modal-booking-wrapper">
                    {selectedCalendarBooking && renderBookingCard(selectedCalendarBooking)}
                </div>
            </Modal>

            {/* INCOMING REQUESTS */}

            <section className="booking-section">
                <div className="section-heading">
                    <h2>
                        Incoming Requests
                    </h2>

                    <span className="booking-count">
                        {requests.length}
                    </span>
                </div>

                {requests.length ===
                0 ? (
                    <div className="empty-bookings">
                        <div className="empty-icon">
                            📭
                        </div>

                        <h3>
                            No pending
                            requests
                        </h3>

                        <p>
                            New learners will
                            appear here when
                            they book a
                            session.
                        </p>
                    </div>
                ) : (
                    <div className="booking-grid">
                        {sortBookings(requests).map(
                            (booking) => (
                                <article
                                    className="booking-card"
                                    key={
                                        booking._id
                                    }
                                >
                                    <div className="booking-card-header">
                                        <span className="booking-card-kicker">SESSION REQUEST</span>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            {booking.actionExpiresAt && (
                                                <span className="action-expiry-chip" title="4-hour response window">
                                                    ⏱ {formatTimeRemaining(booking.actionExpiresAt)}
                                                </span>
                                            )}
                                            <span className="booking-status pending">Pending</span>
                                        </div>
                                    </div>

                                    <div className="booking-card-top">
                                        <div className="booking-person-avatar">
                                            {booking
                                                .learner
                                                ?.name
                                                ?.charAt(
                                                    0
                                                )
                                                ?.toUpperCase() ||
                                                "L"}
                                        </div>

                                        <div className="booking-person-info">
                                            <h3>
                                                {booking
                                                    .learner
                                                    ?.name ||
                                                    "Learner"}
                                            </h3>

                                            <span className="booking-person-role">
                                                Learner
                                            </span>

                                            <p>
                                                wants to learn from you
                                            </p>
                                        </div>
                                    </div>

                                    <div className="booking-info">
                                        <div>
                                            <span>
                                                Date
                                            </span>

                                            <strong>
                                                {
                                                    booking.date
                                                }
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                Time
                                            </span>

                                            <strong>
                                                {
                                                    booking.time
                                                }
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                Duration
                                            </span>

                                            <strong>
                                                {booking.duration || 60} mins
                                            </strong>
                                        </div>

                                        <div>
                                            <span>
                                                Fee
                                            </span>

                                            <strong>
                                                {Number(booking.paymentAmount) === 0 ? "Free" : `₹${(Number(booking.paymentAmount) || 0).toLocaleString("en-IN")}`}
                                            </strong>
                                        </div>
                                    </div>

                                    <div className="booking-message">
                                        <span>
                                            Time Slot Request
                                        </span>

                                        <p>
                                            {booking.message || "Awaiting your approval for this requested time slot."}
                                        </p>
                                    </div>

                                    <div className="booking-actions">
                                        <button
                                            className="booking-accept"
                                            onClick={() =>
                                                updateBooking(
                                                    booking._id,
                                                    "approved"
                                                )
                                            }
                                        >
                                            ✓ Approve Time Slot
                                        </button>

                                        <button
                                            className="booking-reject"
                                            onClick={() =>
                                                setSuggestSlotsBooking(booking)
                                            }
                                        >
                                            Decline / Suggest Slots
                                        </button>
                                    </div>
                                </article>
                            )
                        )}
                    </div>
                )}
            </section>

            {/* MY SESSIONS */}

            <section className="booking-section sessions-grouped-section">
                <div className="section-heading">
                    <div>
                        <h2>My Sessions</h2>
                        <p className="section-subtext">Manage, attend, and review your skill exchange sessions</p>
                    </div>

                    <span className="booking-count">
                        {mySessions.length}
                    </span>
                </div>

                {/* SESSIONS FILTER TABS */}
                <div className="sessions-tab-bar" role="tablist">
                    <button
                        type="button"
                        className={`session-tab-pill ${sessionTab === "active" ? "active" : ""}`}
                        onClick={() => setSessionTab("active")}
                        role="tab"
                        aria-selected={sessionTab === "active"}
                    >
                        <Sparkles size={14} />
                        <span>Active</span>
                        <span className="tab-count-badge">{activeSessions.length}</span>
                    </button>

                    <button
                        type="button"
                        className={`session-tab-pill ${sessionTab === "payment_pending" ? "active" : ""} ${paymentPendingSessions.length > 0 ? "has-urgent" : ""}`}
                        onClick={() => setSessionTab("payment_pending")}
                        role="tab"
                        aria-selected={sessionTab === "payment_pending"}
                    >
                        <CreditCard size={14} />
                        <span>Payment Pending</span>
                        <span className={`tab-count-badge ${paymentPendingSessions.length > 0 ? "urgent-badge" : ""}`}>
                            {paymentPendingSessions.length}
                        </span>
                    </button>

                    <button
                        type="button"
                        className={`session-tab-pill ${sessionTab === "upcoming" ? "active" : ""}`}
                        onClick={() => setSessionTab("upcoming")}
                        role="tab"
                        aria-selected={sessionTab === "upcoming"}
                    >
                        <Calendar size={14} />
                        <span>Upcoming</span>
                        <span className="tab-count-badge">{upcomingSessions.length}</span>
                    </button>

                    <button
                        type="button"
                        className={`session-tab-pill ${sessionTab === "completed" ? "active" : ""}`}
                        onClick={() => setSessionTab("completed")}
                        role="tab"
                        aria-selected={sessionTab === "completed"}
                    >
                        <CheckCircle2 size={14} />
                        <span>Completed</span>
                        <span className="tab-count-badge">{completedSessions.length}</span>
                    </button>

                    <button
                        type="button"
                        className={`session-tab-pill ${sessionTab === "cancelled" ? "active" : ""}`}
                        onClick={() => setSessionTab("cancelled")}
                        role="tab"
                        aria-selected={sessionTab === "cancelled"}
                    >
                        <AlertTriangle size={14} />
                        <span>Cancelled / Declined</span>
                        <span className="tab-count-badge">{cancelledSessions.length}</span>
                    </button>

                    <button
                        type="button"
                        className={`session-tab-pill ${sessionTab === "all" ? "active" : ""}`}
                        onClick={() => setSessionTab("all")}
                        role="tab"
                        aria-selected={sessionTab === "all"}
                    >
                        <Layers size={14} />
                        <span>All</span>
                        <span className="tab-count-badge">{mySessions.length}</span>
                    </button>
                </div>

                {/* SESSIONS CONTENT BY TAB */}
                <div className="sessions-tab-content">
                    {sessionTab === "active" && (
                        activeSessions.length === 0 ? (
                            <div className="tab-empty-state">
                                <div className="tab-empty-icon">✨</div>
                                <h4>No active sessions right now</h4>
                                <p>When you book sessions or have pending payments, they will appear right here.</p>
                            </div>
                        ) : (
                            <>
                                {renderSessionGroupSection({
                                    id: "active-payment-pending",
                                    title: "Action Required: Payment Pending",
                                    subtitle: "Your mentor approved this time slot. Choose your payment method to finalize the booking.",
                                    icon: CreditCard,
                                    count: paymentPendingSessions.length,
                                    items: paymentPendingSessions,
                                    isUrgent: true
                                })}

                                {renderSessionGroupSection({
                                    id: "active-upcoming",
                                    title: "Confirmed & Upcoming Sessions",
                                    subtitle: "Confirmed sessions ready to attend. Access your meeting link and chat room below.",
                                    icon: Calendar,
                                    count: upcomingSessions.length,
                                    items: upcomingSessions
                                })}

                                {renderSessionGroupSection({
                                    id: "active-pending-approval",
                                    title: "Pending Mentor Approval",
                                    subtitle: "Session requests sent to mentors awaiting approval or suggested alternative times.",
                                    icon: Clock,
                                    count: pendingApprovalSessions.length,
                                    items: pendingApprovalSessions
                                })}
                            </>
                        )
                    )}

                    {sessionTab === "payment_pending" && (
                        renderSessionGroupSection({
                            id: "tab-payment-pending",
                            title: "Payment Pending",
                            subtitle: "Sessions approved by mentors awaiting your payment confirmation.",
                            icon: CreditCard,
                            count: paymentPendingSessions.length,
                            items: paymentPendingSessions,
                            isUrgent: true,
                            emptyMessage: {
                                title: "No pending payments",
                                description: "You are all caught up! No sessions are awaiting payment."
                            }
                        })
                    )}

                    {sessionTab === "upcoming" && (
                        renderSessionGroupSection({
                            id: "tab-upcoming",
                            title: "Confirmed & Upcoming Sessions",
                            subtitle: "Active sessions scheduled on your calendar.",
                            icon: Calendar,
                            count: upcomingSessions.length,
                            items: upcomingSessions,
                            emptyMessage: {
                                title: "No upcoming sessions",
                                description: "You have no scheduled sessions coming up. Explore mentors to start learning!"
                            }
                        })
                    )}

                    {sessionTab === "completed" && (
                        renderSessionGroupSection({
                            id: "tab-completed",
                            title: "Completed Sessions",
                            subtitle: "Past sessions successfully concluded. Share feedback and review your session history.",
                            icon: CheckCircle2,
                            count: completedSessions.length,
                            items: completedSessions,
                            emptyMessage: {
                                title: "No completed sessions yet",
                                description: "Once your sessions are completed, they will appear here so you can leave reviews and view receipts."
                            }
                        })
                    )}

                    {sessionTab === "cancelled" && (
                        renderSessionGroupSection({
                            id: "tab-cancelled",
                            title: "Cancelled & Declined Sessions",
                            subtitle: "Sessions that were declined by mentors, cancelled, or expired.",
                            icon: AlertTriangle,
                            count: cancelledSessions.length,
                            items: cancelledSessions,
                            emptyMessage: {
                                title: "No cancelled sessions",
                                description: "None of your sessions have been cancelled or declined."
                            }
                        })
                    )}

                    {sessionTab === "all" && (
                        mySessions.length === 0 ? (
                            <div className="tab-empty-state">
                                <div className="tab-empty-icon">📅</div>
                                <h4>No sessions yet</h4>
                                <p>Book a mentor to begin your skill exchange journey.</p>
                            </div>
                        ) : (
                            <>
                                {renderSessionGroupSection({
                                    id: "all-payment-pending",
                                    title: "Payment Pending",
                                    subtitle: "Approved slots awaiting payment",
                                    icon: CreditCard,
                                    count: paymentPendingSessions.length,
                                    items: paymentPendingSessions,
                                    isUrgent: true
                                })}

                                {renderSessionGroupSection({
                                    id: "all-upcoming",
                                    title: "Confirmed & Upcoming",
                                    subtitle: "Confirmed sessions ready to attend",
                                    icon: Calendar,
                                    count: upcomingSessions.length,
                                    items: upcomingSessions
                                })}

                                {renderSessionGroupSection({
                                    id: "all-pending-approval",
                                    title: "Pending Approval",
                                    subtitle: "Awaiting mentor approval",
                                    icon: Clock,
                                    count: pendingApprovalSessions.length,
                                    items: pendingApprovalSessions
                                })}

                                {renderSessionGroupSection({
                                    id: "all-completed",
                                    title: "Completed Sessions",
                                    subtitle: "Successfully concluded sessions",
                                    icon: CheckCircle2,
                                    count: completedSessions.length,
                                    items: completedSessions
                                })}

                                {renderSessionGroupSection({
                                    id: "all-cancelled",
                                    title: "Cancelled & Declined",
                                    subtitle: "Cancelled, declined, or expired sessions",
                                    icon: AlertTriangle,
                                    count: cancelledSessions.length,
                                    items: cancelledSessions
                                })}
                            </>
                        )
                    )}
                </div>
            </section>

            {/* SESSION REVIEW MODAL */}
            <Modal
                isOpen={Boolean(reviewBooking)}
                onClose={() => setReviewBooking(null)}
                title="How was your session?"
                eyebrow="SESSION REVIEW"
                subtitle={
                    reviewBooking
                        ? `Share your experience with ${getBookingPerson(reviewBooking, currentUserId).person?.name || "the other member"}.`
                        : ""
                }
                maxWidth="sm"
            >
                <div className="se-review-modal-content">
                    <div className="se-review-rating-block">
                        <span className="se-review-rating-caption">Tap to Rate</span>
                        <div className="rating-stars">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    className={star <= rating ? "star active" : "star"}
                                    onClick={() => setRating(star)}
                                    aria-label={`${star} star`}
                                >
                                    ★
                                </button>
                            ))}
                        </div>
                        <span className="rating-label">
                            {{
                                1: "1 / 5 — Needs Improvement",
                                2: "2 / 5 — Fair",
                                3: "3 / 5 — Good",
                                4: "4 / 5 — Very Good",
                                5: "5 / 5 — Excellent"
                            }[rating] || `${rating} / 5`}
                        </span>
                    </div>

                    <div className="se-review-input-group">
                        <label htmlFor="session-review-text" className="se-review-textarea-label">
                            Your Feedback & Comments
                        </label>
                        <textarea
                            id="session-review-text"
                            className="review-textarea"
                            placeholder="Tell them what you liked about the session or areas to explore..."
                            value={comment}
                            onChange={(event) => setComment(event.target.value)}
                            maxLength={1000}
                            rows={4}
                        />
                        <span className="se-review-char-count">{comment.length} / 1000 characters</span>
                    </div>

                    <button
                        className="submit-review-button"
                        disabled={submittingReview}
                        onClick={submitReview}
                        type="button"
                    >
                        {submittingReview ? "Submitting…" : "Submit Review ⭐"}
                    </button>
                </div>
            </Modal>

            {suggestSlotsBooking && (
                <SuggestSlotsModal
                    booking={suggestSlotsBooking}
                    token={token}
                    onClose={() => setSuggestSlotsBooking(null)}
                    onSuccess={async () => {
                        setSuggestSlotsBooking(null);
                        await Promise.all([fetchBookings(), fetchRequests()]);
                    }}
                    onDirectDecline={(bookingId) => {
                        setSuggestSlotsBooking(null);
                        updateBooking(bookingId, "rejected");
                    }}
                />
            )}

            {/* VIEW SESSION DETAILS & PARTY MODAL */}
            <Modal
                isOpen={Boolean(detailsBooking)}
                onClose={() => setDetailsBooking(null)}
                title="Session Details"
                eyebrow="SESSION OVERVIEW & PARTICIPANTS"
                subtitle={
                    detailsBooking
                        ? `Booking ID: #${detailsBooking._id.slice(-8).toUpperCase()}`
                        : ""
                }
                maxWidth="md"
            >
                {detailsBooking && (() => {
                    const { person, role } = getBookingPerson(detailsBooking, currentUserId);
                    const partnerName = person?.name || "Skill Exchange Member";
                    const partnerInitial = partnerName.charAt(0).toUpperCase();
                    const isBooker = String(detailsBooking.learner?._id || detailsBooking.learner?.id || detailsBooking.learner) === String(currentUserId);
                    const duration = Number(detailsBooking.duration) || 60;
                    const sessionAmount = Number(detailsBooking.baseSessionAmount !== undefined ? detailsBooking.baseSessionAmount : detailsBooking.paymentAmount) || 0;
                    const isDetailsMissed = isMissedSession(detailsBooking);
                    const detailsSessionEnded = getSessionEndDate(detailsBooking) <= Date.now();
                    const canDetailsReview = detailsBooking.status === "completed" && !reviewedBookings[detailsBooking._id] && detailsSessionEnded && !isDetailsMissed;

                    return (
                        <div className="session-details-modal-content">
                            {/* Session Party Profile */}
                            <div className="details-partner-card">
                                <div className="details-partner-avatar">
                                    {partnerInitial}
                                </div>
                                <div className="details-partner-info">
                                    <span className="details-role-kicker">{role ? `${role.toUpperCase()} PROFILE` : "SESSION PARTNER"}</span>
                                    <h3 className="details-partner-name">{partnerName}</h3>
                                    <p className="details-partner-sub">
                                        {isBooker
                                            ? "Your Mentor for this Skill Exchange session"
                                            : "Learner attending this Skill Exchange session"}
                                    </p>
                                    {person?.email && (
                                        <span className="details-partner-email">✉ {person.email}</span>
                                    )}
                                </div>
                            </div>

                            {/* Schedule & Timing Grid */}
                            <div className="details-schedule-section">
                                <h4 className="details-section-title">Schedule & Booking Information</h4>
                                <div className="details-info-grid">
                                    <div className="details-info-card">
                                        <span className="details-info-label">📅 Date</span>
                                        <strong className="details-info-value">{detailsBooking.date || "Not set"}</strong>
                                    </div>
                                    <div className="details-info-card">
                                        <span className="details-info-label">⏰ Time</span>
                                        <strong className="details-info-value">{detailsBooking.time || "Not set"}</strong>
                                    </div>
                                    <div className="details-info-card">
                                        <span className="details-info-label">⏱ Duration</span>
                                        <strong className="details-info-value">{duration} minutes</strong>
                                    </div>
                                    <div className="details-info-card">
                                        <span className="details-info-label">💳 Session Rate</span>
                                        <strong className="details-info-value">{sessionAmount === 0 ? "Free" : `₹${sessionAmount.toLocaleString("en-IN")}`}</strong>
                                    </div>
                                </div>
                            </div>

                            {/* Session Note / Message if provided */}
                            {detailsBooking.message && (
                                <div className="details-message-section">
                                    <h4 className="details-section-title">Session Message / Request Agenda</h4>
                                    <div className="details-message-box">
                                        <p>{detailsBooking.message}</p>
                                    </div>
                                </div>
                            )}

                            {/* Video Session Section (inside popup) */}
                            {detailsBooking.status === "accepted" && (
                                <div className="details-video-wrapper">
                                    <h4 className="details-section-title">Video Session & Meeting Link</h4>
                                    <GoogleMeetLink
                                        key={`modal-meet-${detailsBooking._id}-${detailsBooking.meetingUrl || ''}`}
                                        booking={detailsBooking}
                                        token={token}
                                        currentUserId={currentUserId}
                                        onLinkSaved={(newUrl) => handleMeetingUrlUpdated(detailsBooking._id, newUrl)}
                                    />
                                </div>
                            )}

                            {/* Rating & Feedback / Session Reviews Section */}
                            {(detailsBooking.status === "completed" || detailsReviews.learnerReview || detailsReviews.mentorReview) && (
                                <div className="details-reviews-section">
                                    <h4 className="details-section-title">Session Reviews & Ratings</h4>
                                    {detailsReviews.loading ? (
                                        <div className="details-reviews-loading">
                                            <span>Loading reviews…</span>
                                        </div>
                                    ) : !detailsReviews.learnerReview && !detailsReviews.mentorReview ? (
                                        <div className="details-no-reviews-box">
                                            <span className="no-review-icon">⭐</span>
                                            <p>No reviews submitted yet for this session.</p>
                                        </div>
                                    ) : (
                                        <div className="details-reviews-container">
                                            {/* Learner's Review Block */}
                                            {detailsReviews.learnerReview && (
                                                <div className="details-review-card learner-review-card">
                                                    <div className="review-card-header">
                                                        <div className="reviewer-meta">
                                                            <span className="review-role-badge learner">Learner's Review</span>
                                                            <strong className="reviewer-name">
                                                                {detailsReviews.learnerReview.reviewer?.name || "Learner"}
                                                            </strong>
                                                        </div>
                                                        <div className="review-rating-score">
                                                            <span className="review-stars-visual">
                                                                {"★".repeat(detailsReviews.learnerReview.rating)}
                                                                {"☆".repeat(5 - detailsReviews.learnerReview.rating)}
                                                            </span>
                                                            <span className="review-numeric-score">{detailsReviews.learnerReview.rating}/5</span>
                                                        </div>
                                                    </div>
                                                    <div className="review-card-body">
                                                        <p className="review-comment-text">
                                                            {detailsReviews.learnerReview.comment
                                                                ? `“${detailsReviews.learnerReview.comment}”`
                                                                : <em className="review-empty-note">No written feedback provided.</em>}
                                                        </p>
                                                    </div>
                                                    {detailsReviews.learnerReview.createdAt && (
                                                        <div className="review-card-footer">
                                                            <span className="review-timestamp">
                                                                Reviewed on {new Date(detailsReviews.learnerReview.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Mentor's Review Block */}
                                            {detailsReviews.mentorReview && (
                                                <div className="details-review-card mentor-review-card">
                                                    <div className="review-card-header">
                                                        <div className="reviewer-meta">
                                                            <span className="review-role-badge mentor">Mentor's Review</span>
                                                            <strong className="reviewer-name">
                                                                {detailsReviews.mentorReview.reviewer?.name || "Mentor"}
                                                            </strong>
                                                        </div>
                                                        <div className="review-rating-score">
                                                            <span className="review-stars-visual">
                                                                {"★".repeat(detailsReviews.mentorReview.rating)}
                                                                {"☆".repeat(5 - detailsReviews.mentorReview.rating)}
                                                            </span>
                                                            <span className="review-numeric-score">{detailsReviews.mentorReview.rating}/5</span>
                                                        </div>
                                                    </div>
                                                    <div className="review-card-body">
                                                        <p className="review-comment-text">
                                                            {detailsReviews.mentorReview.comment
                                                                ? `“${detailsReviews.mentorReview.comment}”`
                                                                : <em className="review-empty-note">No written feedback provided.</em>}
                                                        </p>
                                                    </div>
                                                    {detailsReviews.mentorReview.createdAt && (
                                                        <div className="review-card-footer">
                                                            <span className="review-timestamp">
                                                                Reviewed on {new Date(detailsReviews.mentorReview.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Session Action Buttons (inside popup) */}
                            <div className="details-session-actions-section">
                                <h4 className="details-section-title">Session Actions</h4>
                                <div className="details-actions-buttons-row">
                                    {/* Open Session Chat on Accepted Sessions */}
                                    {detailsBooking.status === "accepted" && !isDetailsMissed && (
                                        <button
                                            type="button"
                                            className="modal-action-chat-btn"
                                            onClick={() => {
                                                const b = detailsBooking;
                                                setDetailsBooking(null);
                                                if (onJoinSession) onJoinSession(b);
                                            }}
                                        >
                                            <MessageSquare size={16} />
                                            <span>Open Session Chat</span>
                                        </button>
                                    )}

                                    {/* Mark Complete on Accepted Sessions */}
                                    {detailsBooking.status === "accepted" && !isDetailsMissed && (
                                        <button
                                            type="button"
                                            className="modal-action-complete-btn"
                                            onClick={async () => {
                                                const bId = detailsBooking._id;
                                                setDetailsBooking(null);
                                                await updateBooking(bId, "completed");
                                            }}
                                        >
                                            <Check size={16} />
                                            <span>Mark Session Complete</span>
                                        </button>
                                    )}

                                    {/* Leave Review on Completed Sessions */}
                                    {canDetailsReview && (
                                        <button
                                            type="button"
                                            className="modal-action-review-btn"
                                            onClick={() => {
                                                const b = detailsBooking;
                                                setDetailsBooking(null);
                                                openReview(b);
                                            }}
                                        >
                                            <Star size={16} />
                                            <span>Leave Session Review ⭐</span>
                                        </button>
                                    )}

                                    {/* Cancel Booking option */}
                                    {["pending", "accepted"].includes(detailsBooking.status) && (
                                        <button
                                            type="button"
                                            className="modal-action-cancel-btn"
                                            onClick={async () => {
                                                const bId = detailsBooking._id;
                                                setDetailsBooking(null);
                                                await cancelBooking(bId);
                                            }}
                                        >
                                            Cancel Booking
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Close / Done button */}
                            <div className="details-modal-actions">
                                <button
                                    type="button"
                                    className="details-close-action-btn"
                                    onClick={() => setDetailsBooking(null)}
                                >
                                    Close Details
                                </button>
                            </div>
                        </div>
                    );
                })()}
            </Modal>
        </main>
    );
}

export default MyBookings;
// @teamcosmiccoders
