import { useMemo, useState } from "react";
import "./BookingCalendar.css";

function getDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getTodayKey() {
    return getDateKey(new Date());
}

function getMonthDays(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days = [];

    for (let i = 0; i < firstDay.getDay(); i += 1) {
        days.push(null);
    }

    for (
        let day = 1;
        day <= lastDay.getDate();
        day += 1
    ) {
        days.push(new Date(year, month, day));
    }

    return days;
}

function formatMonth(year, month) {
    return new Intl.DateTimeFormat(undefined, {
        month: "long",
        year: "numeric"
    }).format(new Date(year, month, 1));
}

function formatSelectedDate(dateKey) {
    if (!dateKey) return "";

    const date = new Date(`${dateKey}T00:00:00`);

    return new Intl.DateTimeFormat(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
    }).format(date);
}

function getPersonName(person) {
    if (!person) return "Member";

    if (typeof person === "string") {
        return "Member";
    }

    return person.name || "Member";
}

function BookingCalendar({
    bookings = [],
    onSelectBooking
}) {
    const today = new Date();

    const [currentMonth, setCurrentMonth] = useState(
        new Date(
            today.getFullYear(),
            today.getMonth(),
            1
        )
    );

    const [selectedDate, setSelectedDate] =
        useState("");

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const days = useMemo(
        () => getMonthDays(year, month),
        [year, month]
    );

    const bookingsByDate = useMemo(() => {
        const grouped = {};

        bookings.forEach((booking) => {
            if (!booking?.date) return;

            if (!grouped[booking.date]) {
                grouped[booking.date] = [];
            }

            grouped[booking.date].push(booking);
        });

        return grouped;
    }, [bookings]);

    const selectedBookings =
        selectedDate &&
        bookingsByDate[selectedDate]
            ? bookingsByDate[selectedDate]
            : [];

    function goToPreviousMonth() {
        setCurrentMonth(
            new Date(year, month - 1, 1)
        );
    }

    function goToNextMonth() {
        setCurrentMonth(
            new Date(year, month + 1, 1)
        );
    }

    function goToToday() {
        setCurrentMonth(
            new Date(
                today.getFullYear(),
                today.getMonth(),
                1
            )
        );

        setSelectedDate(getTodayKey());
    }

    function handleDateClick(date) {
        if (!date) return;

        setSelectedDate(getDateKey(date));
    }

    function handleBookingClick(booking, event) {
        event.stopPropagation();

        if (onSelectBooking) {
            onSelectBooking(booking);
        }
    }

    return (
        <section className="booking-calendar">
            <div className="calendar-header">
                <div>
                    <p className="calendar-eyebrow">
                        BOOKING CALENDAR
                    </p>

                    <h2>
                        {formatMonth(year, month)}
                    </h2>
                </div>

                <div className="calendar-controls">
                    <button
                        type="button"
                        onClick={goToPreviousMonth}
                        aria-label="Previous month"
                    >
                        ←
                    </button>

                    <button
                        type="button"
                        className="calendar-today"
                        onClick={goToToday}
                    >
                        Today
                    </button>

                    <button
                        type="button"
                        onClick={goToNextMonth}
                        aria-label="Next month"
                    >
                        →
                    </button>
                </div>
            </div>

            <div className="calendar-weekdays">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
            </div>

            <div className="calendar-grid">
                {days.map((date, index) => {
                    if (!date) {
                        return (
                            <div
                                className="calendar-day empty"
                                key={`empty-${index}`}
                            />
                        );
                    }

                    const dateKey = getDateKey(date);

                    const dayBookings =
                        bookingsByDate[dateKey] || [];

                    const isToday =
                        dateKey === getTodayKey();

                    const isSelected =
                        dateKey === selectedDate;

                    return (
                        <button
                            type="button"
                            className={`calendar-day ${
                                isToday
                                    ? "today"
                                    : ""
                            } ${
                                isSelected
                                    ? "selected"
                                    : ""
                            } ${
                                dayBookings.length > 0
                                    ? "has-bookings"
                                    : ""
                            }`}
                            key={dateKey}
                            onClick={() =>
                                handleDateClick(date)
                            }
                        >
                            <span className="calendar-date-number">
                                {date.getDate()}
                            </span>

                            {dayBookings.length > 0 ? (
                                <div className="calendar-bookings">
                                    {dayBookings
                                        .slice(0, 2)
                                        .map(
                                            (booking) => (
                                                <span
                                                    className={`calendar-booking ${
                                                        booking.status ||
                                                        ""
                                                    }`}
                                                    key={
                                                        booking._id
                                                    }
                                                    onClick={(
                                                        event
                                                    ) =>
                                                        handleBookingClick(
                                                            booking,
                                                            event
                                                        )
                                                    }
                                                >
                                                    {booking.time ||
                                                        "Session"}
                                                </span>
                                            )
                                        )}

                                    {dayBookings.length >
                                        2 && (
                                        <span className="calendar-more">
                                            +
                                            {dayBookings.length -
                                                2}{" "}
                                            more
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <span className="calendar-no-booking">
                                    Available
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {selectedDate && (
                <div className="calendar-details">
                    <div className="calendar-details-header">
                        <div>
                            <p className="calendar-eyebrow">
                                SELECTED DATE
                            </p>

                            <h3>
                                {formatSelectedDate(
                                    selectedDate
                                )}
                            </h3>
                        </div>
                    </div>

                    {selectedBookings.length ===
                    0 ? (
                        <div className="calendar-empty-details">
                            <span>📅</span>

                            <p>
                                No bookings on this
                                date.
                            </p>
                        </div>
                    ) : (
                        <div className="calendar-selected-list">
                            {selectedBookings.map(
                                (booking) => {
                                    const mentorName =
                                        getPersonName(
                                            booking.mentor
                                        );

                                    const learnerName =
                                        getPersonName(
                                            booking.learner
                                        );

                                    return (
                                        <button
                                            type="button"
                                            className="calendar-selected-booking"
                                            key={
                                                booking._id
                                            }
                                            onClick={() =>
                                                onSelectBooking &&
                                                onSelectBooking(
                                                    booking
                                                )
                                            }
                                        >
                                            <div>
                                                <strong>
                                                    {booking.time ||
                                                        "Time not set"}
                                                </strong>

                                                <span>
                                                    {mentorName}{" "}
                                                    ↔{" "}
                                                    {learnerName}
                                                </span>
                                            </div>

                                            <span
                                                className={`calendar-status ${
                                                    booking.status ||
                                                    ""
                                                }`}
                                            >
                                                {
                                                    booking.status
                                                }
                                            </span>
                                        </button>
                                    );
                                }
                            )}
                        </div>
                    )}
                </div>
            )}

            <div className="calendar-legend">
                <span>
                    <i className="legend-dot booked"></i>
                    Booked
                </span>

                <span>
                    <i className="legend-dot available"></i>
                    No booking
                </span>

                <span>
                    <i className="legend-dot today-dot"></i>
                    Today
                </span>
            </div>
        </section>
    );
}

export default BookingCalendar;