import {
    useCallback,
    useEffect,
    useState
} from "react";

import BookingCalendar from "../Components/booking/BookingCalendar";

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

const getSessionDate = (booking) => {
    if (!booking?.date) {
        return Number.MAX_SAFE_INTEGER;
    }

    const dateTime = new Date(
        `${booking.date}T${
            booking.time || "00:00"
        }`
    );

    return Number.isNaN(
        dateTime.getTime()
    )
        ? Number.MAX_SAFE_INTEGER
        : dateTime.getTime();
};

const isMissedSession = (booking) =>
    ["accepted", "pending"].includes(booking?.status) &&
    getSessionDate(booking) < Date.now();

const getCreatedDate = (booking) => {
    const date = new Date(
        booking?.createdAt
    );

    return Number.isNaN(date.getTime())
        ? 0
        : date.getTime();
};

const sortBookings = (bookings) => {
    const priority = {
        accepted: 1,
        pending: 2,
        completed: 3,
        rejected: 4,
        cancelled: 5
    };

    return [...bookings].sort(
        (a, b) => {
            const priorityA =
                priority[a.status] || 99;

            const priorityB =
                priority[b.status] || 99;

            if (
                priorityA !==
                priorityB
            ) {
                return (
                    priorityA -
                    priorityB
                );
            }

            if (
                a.status ===
                "accepted"
            ) {
                return (
                    getSessionDate(a) -
                    getSessionDate(b)
                );
            }

            return (
                getCreatedDate(b) -
                getCreatedDate(a)
            );
        }
    );
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

    async function cancelBooking(
        bookingId
    ) {
        if (
            !window.confirm(
                "Cancel this booking?"
            )
        ) {
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

            setSelectedCalendarBooking(
                null
            );

            await fetchBookings();
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

    function renderBookingRecord(
        booking
    ) {
        const {
            person,
            role
        } =
            getBookingPerson(
                booking,
                currentUserId
            );

        const name =
            person?.name ||
            "Skill Exchange member";

        const initial =
            name
                .charAt(0)
                .toUpperCase();

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

        return (
            <article className="booking-record">
                <div className="booking-record-top">
                    <div className="booking-person-avatar">
                        {initial}
                    </div>

                    <div className="booking-person-info">
                        <h3>
                            {name}
                        </h3>

                        {role && (
                            <span className="booking-person-role">
                                {role}
                            </span>
                        )}

                        <p>
                            Skill Exchange
                            session
                        </p>
                    </div>
                </div>

                <div className="booking-info">
                    <div>
                        <span>
                            Date
                        </span>

                        <strong>
                            {booking.date}
                        </strong>
                    </div>

                    <div>
                        <span>
                            Time
                        </span>

                        <strong>
                            {booking.time}
                        </strong>
                    </div>
                </div>

                {booking.message && (
                    <div className="booking-message">
                        <span>
                            Message
                        </span>

                        <p>
                            {booking.message}
                        </p>
                    </div>
                )}

                <div className="booking-status-row">
                    <span
                        className={`booking-status ${isMissed ? "missed" : booking.status}`}
                    >
                        {isMissed ? "Session missed" : booking.status}
                    </span>
                </div>

                {isMissed ? (
                    <div className="booking-message missed-session">
                        <span>Session status</span>
                        <p>This session date has passed and is marked as missed.</p>
                    </div>
                ) : isAccepted && (
                    <div className="booking-message">
                        <span>
                            Session status
                        </span>

                        <p>
                            Your session is
                            confirmed and
                            ready to attend.
                        </p>
                    </div>
                )}

                {isPending && (
                    <div className="booking-message">
                        <span>
                            Request status
                        </span>

                        <p>
                            Waiting for
                            mentor approval.
                            Your session
                            request has been
                            sent successfully.
                        </p>
                    </div>
                )}

                {booking.status ===
                    "rejected" && (
                    <div className="booking-message">
                        <span>
                            Request status
                        </span>

                        <p>
                            The mentor
                            declined this
                            session request.
                        </p>
                    </div>
                )}

                {booking.status ===
                    "cancelled" && (
                    <div className="booking-message">
                        <span>
                            Session status
                        </span>

                        <p>
                            This booking has
                            been cancelled.
                        </p>
                    </div>
                )}

                {isCompleted && (
                    <div className="booking-message">
                        <span>
                            Session status
                        </span>

                        <p>
                            Successful
                            session completed.
                        </p>
                    </div>
                )}

                {isAccepted && !isMissed && (
                    <button
                        className="join-session-button"
                        onClick={() => {
                            if (
                                onJoinSession
                            ) {
                                onJoinSession(
                                    booking
                                );
                            }
                        }}
                    >
                        Join Session →
                    </button>
                )}

                {isAccepted && !isMissed && (
                    <button
                        className="complete-session-button"
                        onClick={() =>
                            updateBooking(
                                booking._id,
                                "completed"
                            )
                        }
                    >
                        ✓ Mark Session
                        Complete
                    </button>
                )}

                {isCompleted &&
                    !alreadyReviewed && (
                        <button
                            className="review-session-button"
                            onClick={() =>
                                openReview(
                                    booking
                                )
                            }
                        >
                            ⭐ Leave Review
                        </button>
                    )}

                {isCompleted &&
                    alreadyReviewed && (
                        <div className="review-completed-box">
                            <strong>
                                ⭐ Review
                                submitted
                            </strong>

                            <span>
                                Thanks for
                                sharing your
                                experience.
                            </span>
                        </div>
                    )}

                {(isPending ||
                    isAccepted) && (
                    <button
                        className="booking-cancel"
                        onClick={() =>
                            cancelBooking(
                                booking._id
                            )
                        }
                    >
                        Cancel Booking
                    </button>
                )}
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

            {/* SELECTED CALENDAR BOOKING */}

            {selectedCalendarBooking && (
                <section className="booking-section">
                    <div className="section-heading">
                        <div>
                            <h2>
                                Selected Session
                            </h2>

                            <p>
                                {
                                    selectedCalendarBooking.date
                                }{" "}
                                at{" "}
                                {
                                    selectedCalendarBooking.time
                                }
                            </p>
                        </div>

                        <button
                            className="refresh-bookings"
                            onClick={() =>
                                setSelectedCalendarBooking(
                                    null
                                )
                            }
                        >
                            Close
                        </button>
                    </div>

                    <div className="booking-grid">
                        {renderBookingRecord(
                            selectedCalendarBooking
                        )}
                    </div>
                </section>
            )}

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
                        {requests.map(
                            (booking) => (
                                <article
                                    className="booking-record"
                                    key={
                                        booking._id
                                    }
                                >
                                    <div className="booking-record-top">
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
                                                wants
                                                to
                                                learn
                                                from
                                                you
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
                                    </div>

                                    <div className="booking-status-row">
                                        <span className="booking-status pending">
                                            Pending
                                        </span>
                                    </div>

                                    <div className="booking-message">
                                        <span>
                                            Request
                                            status
                                        </span>

                                        <p>
                                            Waiting
                                            for your
                                            approval.
                                        </p>
                                    </div>

                                    <div className="booking-actions">
                                        <button
                                            className="booking-accept"
                                            onClick={() =>
                                                updateBooking(
                                                    booking._id,
                                                    "accepted"
                                                )
                                            }
                                        >
                                            ✓ Accept
                                        </button>

                                        <button
                                            className="booking-reject"
                                            onClick={() =>
                                                updateBooking(
                                                    booking._id,
                                                    "rejected"
                                                )
                                            }
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </article>
                            )
                        )}
                    </div>
                )}
            </section>

            {/* MY SESSIONS */}

            <section className="booking-section">
                <div className="section-heading">
                    <h2>
                        My Sessions
                    </h2>

                    <span className="booking-count">
                        {mySessions.length}
                    </span>
                </div>

                {mySessions.length ===
                0 ? (
                    <div className="empty-bookings">
                        <div className="empty-icon">
                            📅
                        </div>

                        <h3>
                            No sessions yet
                        </h3>

                        <p>
                            Book a mentor to
                            start your
                            learning
                            journey.
                        </p>
                    </div>
                ) : (
                    <div className="booking-grid">
                        {mySessions.map(
                            (booking) => (
                                <div
                                    key={
                                        booking._id
                                    }
                                >
                                    {renderBookingRecord(
                                        booking
                                    )}
                                </div>
                            )
                        )}
                    </div>
                )}
            </section>

            {/* REVIEW MODAL */}

            {reviewBooking && (
                <div
                    className="review-modal-overlay"
                    onClick={() =>
                        setReviewBooking(
                            null
                        )
                    }
                >
                    <div
                        className="review-modal"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >
                        <button
                            className="review-close"
                            onClick={() =>
                                setReviewBooking(
                                    null
                                )
                            }
                        >
                            ×
                        </button>

                        <p className="bookings-eyebrow">
                            SESSION REVIEW
                        </p>

                        <h2>
                            How was your
                            session?
                        </h2>

                        <p className="review-person">
                            Share your
                            experience with
                            the other
                            member.
                        </p>

                        <div className="rating-stars">
                            {[1, 2, 3, 4, 5].map(
                                (star) => (
                                    <button
                                        key={
                                            star
                                        }
                                        type="button"
                                        className={
                                            star <=
                                            rating
                                                ? "star active"
                                                : "star"
                                        }
                                        onClick={() =>
                                            setRating(
                                                star
                                            )
                                        }
                                    >
                                        ★
                                    </button>
                                )
                            )}
                        </div>

                        <p className="rating-label">
                            {rating}/5
                        </p>

                        <textarea
                            className="review-textarea"
                            placeholder="Tell them what you liked about the session..."
                            value={
                                comment
                            }
                            onChange={(
                                event
                            ) =>
                                setComment(
                                    event
                                        .target
                                        .value
                                )
                            }
                            maxLength={1000}
                        />

                        <button
                            className="submit-review-button"
                            disabled={
                                submittingReview
                            }
                            onClick={
                                submitReview
                            }
                        >
                            {submittingReview
                                ? "Submitting..."
                                : "Submit Review ⭐"}
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}

export default MyBookings;
// @teamcosmiccoders
