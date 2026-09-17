import { useState } from "react";
import Modal from "../common/Modal";
import "./SuggestSlotsModal.css";

export default function SuggestSlotsModal({
    booking,
    token,
    onClose,
    onSuccess,
    onDirectDecline
}) {
    const duration = booking?.duration || 60;
    const learnerName = booking?.learner?.name || "the learner";

    // Initial state with at least one slot
    const [slots, setSlots] = useState([
        { id: 1, date: "", time: "", isPreferred: true }
    ]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleAddSlot = () => {
        const nextId = Date.now();
        setSlots((prev) => [
            ...prev,
            { id: nextId, date: "", time: "", isPreferred: prev.length === 0 }
        ]);
    };

    const handleRemoveSlot = (idToRemove) => {
        if (slots.length <= 1) {
            setError("You must provide at least one available slot to share.");
            return;
        }
        setError("");
        setSlots((prev) => {
            const filtered = prev.filter((s) => s.id !== idToRemove);
            // If the preferred slot was removed, make the first remaining slot preferred
            if (!filtered.some((s) => s.isPreferred) && filtered.length > 0) {
                filtered[0].isPreferred = true;
            }
            return filtered;
        });
    };

    const handleSlotChange = (id, field, value) => {
        setError("");
        setSlots((prev) =>
            prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
        );
    };

    const handleSetPreferred = (id) => {
        setSlots((prev) =>
            prev.map((s) => ({
                ...s,
                isPreferred: s.id === id
            }))
        );
    };

    const handleSubmitSlots = async () => {
        setError("");

        // Validate all slots
        for (const slot of slots) {
            if (!slot.date || !slot.time) {
                setError("Please fill in both date and time for all suggested slots.");
                return;
            }
            const slotTime = new Date(`${slot.date}T${slot.time}`).getTime();
            if (Number.isNaN(slotTime) || slotTime <= Date.now()) {
                setError(`The slot on ${slot.date} at ${slot.time} must be in the future.`);
                return;
            }
        }

        try {
            setSubmitting(true);
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/bookings/${booking._id}/suggest-slots`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        slots: slots.map(({ date, time, isPreferred }) => ({
                            date,
                            time,
                            isPreferred
                        }))
                    })
                }
            );

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Failed to share alternate slots");
            }

            if (onSuccess) {
                onSuccess(data.booking);
            }
            onClose();
        } catch (err) {
            console.error("Suggest slots error:", err);
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Suggest Available Slots"
            eyebrow="SLOT SUGGESTION"
            subtitle={
                <>
                    Offer alternate slots for <strong>{learnerName}</strong> matching their requested <strong>{duration}-minute</strong> duration.
                </>
            }
            maxWidth="lg"
            footer={
                <div className="suggest-slots-footer-content">
                    <button
                        type="button"
                        className="btn-decline-direct"
                        onClick={() => {
                            if (window.confirm("Decline this booking request outright without suggesting alternate slots?")) {
                                onDirectDecline(booking._id);
                                onClose();
                            }
                        }}
                    >
                        Decline Without Slots
                    </button>

                    <div className="footer-action-group">
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={onClose}
                            disabled={submitting}
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            className="btn-primary-confirm"
                            onClick={handleSubmitSlots}
                            disabled={submitting}
                        >
                            {submitting ? "Sharing Slots..." : "Share Available Slots →"}
                        </button>
                    </div>
                </div>
            }
        >
            <div className="modal-body">
                    {error && <div className="modal-error-banner">{error}</div>}

                    <div className="slots-editor-section">
                        <div className="slots-section-title-row">
                            <h3>Available Time Slots ({duration} mins each)</h3>
                            <button
                                type="button"
                                className="add-slot-chip-btn"
                                onClick={handleAddSlot}
                            >
                                + Add Another Slot
                            </button>
                        </div>

                        <div className="slots-list-builder">
                            {slots.map((slot, index) => (
                                <div
                                    key={slot.id}
                                    className={`slot-input-card ${slot.isPreferred ? "is-preferred-slot" : ""}`}
                                >
                                    <div className="slot-card-top-bar">
                                        <label className="preferred-radio-label">
                                            <input
                                                type="radio"
                                                name="preferred_slot"
                                                checked={slot.isPreferred}
                                                onChange={() => handleSetPreferred(slot.id)}
                                            />
                                            <span className="preferred-pill">
                                                {slot.isPreferred ? "★ Most Favorable (Recommended)" : "Mark as Preferred"}
                                            </span>
                                        </label>

                                        {slots.length > 1 && (
                                            <button
                                                type="button"
                                                className="remove-slot-btn"
                                                onClick={() => handleRemoveSlot(slot.id)}
                                                title="Remove this slot"
                                            >
                                                ✕ Remove
                                            </button>
                                        )}
                                    </div>

                                    <div className="slot-inputs-row">
                                        <div className="slot-field">
                                            <label>Date</label>
                                            <input
                                                type="date"
                                                min={new Date().toISOString().split("T")[0]}
                                                value={slot.date}
                                                onChange={(e) => handleSlotChange(slot.id, "date", e.target.value)}
                                            />
                                        </div>

                                        <div className="slot-field">
                                            <label>Start Time</label>
                                            <input
                                                type="time"
                                                value={slot.time}
                                                onChange={(e) => handleSlotChange(slot.id, "time", e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* MANDATORY WARNING / POLICY NOTICE TO MENTOR */}
                    <div className="mentor-policy-warning-card">
                        <div className="warning-icon-box">⚠️</div>
                        <div className="warning-text-content">
                            <strong>Notice to Mentor Before Submitting:</strong>
                            <p>
                                Once you share your available time slots, the learner can pick any slot and go directly to payment without requiring your further approval. Please choose your slots carefully. If you cancel a confirmed slot afterward, the learner's payment will be refunded — and you will be responsible for covering that refund.
                            </p>
                        </div>
                    </div>
                </div>

        </Modal>
    );
}
