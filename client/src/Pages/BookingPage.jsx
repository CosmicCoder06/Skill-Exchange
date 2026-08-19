import { useState } from "react";
import "./BookingPage.css";

function BookingPage({
    token,
    mentorId,
    mentorName,
    onBookingCreated
}) {
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [message, setMessage] = useState("");
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    async function createBooking() {
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
                        message
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

                    <h1>Booking confirmed</h1>

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
            <section className="booking-card">
                <p className="booking-eyebrow">
                    SESSION REQUEST
                </p>

                <h1>Book Session</h1>

                <p className="booking-with">
                    With {mentorName}
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

                <button
                    className="confirm-booking"
                    onClick={createBooking}
                    disabled={loading}
                >
                    {loading ? "Sending Request..." : "Confirm Booking"}
                </button>
            </section>
        </main>
    );
}

export default BookingPage;
// @teamcosmiccoders
