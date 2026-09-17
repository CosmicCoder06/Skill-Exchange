import {
    CheckCircle2,
    Clock,
    XCircle,
    AlertTriangle,
    CalendarClock,
    Star,
    ShieldAlert,
    FileText,
    Info,
    CalendarCheck
} from "lucide-react";
import "./SessionStatusCard.css";

export default function SessionStatusCard({
    booking,
    isBooker,
    isMissed,
    alreadyReviewed,
    onLeaveReview,
    formatTimeRemaining
}) {
    if (!booking) return null;

    const status = isMissed ? "missed" : booking.status || "pending";
    const expiresAt = ["pending", "approved", "slots_offered"].includes(booking.status)
        ? booking.actionExpiresAt
        : null;
    const timeRemaining = expiresAt && formatTimeRemaining ? formatTimeRemaining(expiresAt) : null;

    // Config map for consistent status visual hierarchy
    const config = {
        accepted: {
            theme: "theme-accepted",
            label: "Session Confirmed",
            icon: <CheckCircle2 size={16} />,
            heading: "Session Confirmed & Active",
            description: "Your session is fully confirmed and ready to attend. Use the meeting link or chat to connect at the scheduled time."
        },
        approved: {
            theme: "theme-approved",
            label: "Time Slot Approved",
            icon: <CalendarCheck size={16} />,
            heading: isBooker ? "Time Slot Approved — Payment Pending" : "Time Slot Approved",
            description: isBooker
                ? "The mentor approved your requested time slot. Complete payment above to confirm and lock in your session."
                : "You approved this time slot. Waiting for the learner to complete payment and finalize the booking."
        },
        pending: {
            theme: "theme-pending",
            label: "Pending Approval",
            icon: <Clock size={16} />,
            heading: "Awaiting Mentor Approval",
            description: isBooker
                ? "Your booking request has been sent. The mentor has 4 hours to approve or propose alternative time slots."
                : "A learner requested this session. Please approve the slot or offer alternative times before the timer expires."
        },
        slots_offered: {
            theme: "theme-slots-offered",
            label: "Alternate Slots Proposed",
            icon: <CalendarClock size={16} />,
            heading: isBooker ? "Choose an Alternate Slot" : "Alternate Slots Shared",
            description: isBooker
                ? "The mentor suggested alternative available slots. Pick any slot below to proceed directly to payment."
                : `You shared ${booking.suggestedSlots?.length || 0} alternate slots. The learner can pick any slot and pay directly.`
        },
        rejected: {
            theme: "theme-rejected",
            label: "Request Declined",
            icon: <XCircle size={16} />,
            heading: "Session Request Declined",
            description: "The mentor was unable to accommodate this session request. You can explore other available mentors."
        },
        cancelled: {
            theme: "theme-cancelled",
            label: "Booking Cancelled",
            icon: <AlertTriangle size={16} />,
            heading: "Session Cancelled",
            description: "This session has been cancelled and will not take place."
        },
        completed: {
            theme: "theme-completed",
            label: "Session Completed",
            icon: <CheckCircle2 size={16} />,
            heading: "Successful Session Completed",
            description: "This skill exchange session has concluded successfully. We hope it was a valuable learning experience!"
        },
        missed: {
            theme: "theme-missed",
            label: "Session Missed",
            icon: <Clock size={16} />,
            heading: "Session Time Expired",
            description: "The scheduled time for this session has passed without completion."
        }
    }[status] || {
        theme: "theme-pending",
        label: status,
        icon: <Info size={16} />,
        heading: `Status: ${status}`,
        description: "Booking status updated."
    };

    return (
        <div className={`session-status-card ${config.theme}`}>
            {/* Top Bar: Pill Badge & Optional Countdown Timer */}
            <div className="status-card-top-bar">
                <span className="status-card-pill">
                    {config.icon}
                    <span>{config.label}</span>
                </span>

                {timeRemaining && (
                    <span className="status-card-timer-chip" title="Remaining action window">
                        <Clock size={13} />
                        <span>{timeRemaining}</span>
                    </span>
                )}
            </div>

            {/* Typography Hierarchy: Heading & Description */}
            <div className="status-card-text-block">
                <h4 className="status-card-heading">{config.heading}</h4>
                <p className="status-card-desc">{config.description}</p>
            </div>

            {/* Inline Callout Box: Platform Policy (e.g. mentor cancellation refund) */}
            {status === "cancelled" && booking.cancelledBy === "mentor" && (
                <div className="status-inline-callout callout-policy" role="alert">
                    <div className="callout-icon-box">
                        <ShieldAlert size={18} />
                    </div>
                    <div className="callout-content">
                        <strong className="callout-title">Platform Cancellation Policy</strong>
                        <p className="callout-message">
                            This session was cancelled by the mentor. Under platform policy, the learner&apos;s payment
                            will be refunded in full and covered by the mentor.
                        </p>
                    </div>
                </div>
            )}

            {/* Inline Callout Box: Cancellation Reason */}
            {status === "cancelled" && booking.cancellationReason && (
                <div className="status-inline-callout callout-reason">
                    <div className="callout-icon-box">
                        <FileText size={18} />
                    </div>
                    <div className="callout-content">
                        <strong className="callout-title">Cancellation Reason</strong>
                        <p className="callout-message">{booking.cancellationReason}</p>
                    </div>
                </div>
            )}

            {/* Review Section for Completed Sessions */}
            {status === "completed" && (
                <div className="status-card-review-section">
                    {!alreadyReviewed && onLeaveReview ? (
                        <button
                            type="button"
                            className="status-card-review-btn"
                            onClick={onLeaveReview}
                        >
                            <Star size={15} />
                            <span>Leave Session Review</span>
                        </button>
                    ) : alreadyReviewed ? (
                        <div className="status-card-reviewed-indicator">
                            <Star size={14} className="star-filled-icon" />
                            <span>Review submitted — Thank you for your feedback!</span>
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
}
