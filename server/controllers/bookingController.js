// const Booking = require("../models/Booking");

// const createBooking = async (req, res) => {
//     try {
//         const userId = req.user._id || req.user.id;

//         const booking = await Booking.create({
//             mentor: req.body.mentor,
//             learner: userId,
//             date: req.body.date,
//             time: req.body.time,
//             message: req.body.message || ""
//         });

//         res.status(201).json({
//             message: "Booking created successfully",
//             booking
//         });
//     } catch (error) {
//         console.error("Create booking error:", error);
//         res.status(500).json({
//             message: error.message
//         });
//     }
// };

// const getBookings = async (req, res) => {
//     try {
//         const userId = req.user._id || req.user.id;

//         const bookings = await Booking.find({
//             $or: [
//                 { learner: userId },
//                 { mentor: userId }
//             ]
//         })
//             .populate("mentor learner", "name email")
//             .sort({ createdAt: -1 });

//         res.json(bookings);
//     } catch (error) {
//         console.error("Get bookings error:", error);
//         res.status(500).json({
//             message: error.message
//         });
//     }
// };

// const getMentorRequests = async (req, res) => {
//     try {
//         const userId = req.user._id || req.user.id;

//         const requests = await Booking.find({
//             mentor: userId,
//             status: "pending"
//         })
//             .populate("learner", "name email")
//             .sort({ createdAt: -1 });

//         res.json(requests);
//     } catch (error) {
//         console.error("Get mentor requests error:", error);
//         res.status(500).json({
//             message: error.message
//         });
//     }
// };

// const updateBookingStatus = async (req, res) => {
//     try {
//         const userId = req.user._id || req.user.id;

//         const booking = await Booking.findById(req.params.id);

//         if (!booking) {
//             return res.status(404).json({
//                 message: "Booking not found"
//             });
//         }

//         const mentorId = booking.mentor.toString();
//         const learnerId = booking.learner.toString();
//         const requestedStatus = req.body.status;

//         if (
//             requestedStatus === "accepted" ||
//             requestedStatus === "rejected"
//         ) {
//             if (mentorId !== userId.toString()) {
//                 return res.status(403).json({
//                     message: "Only the mentor can accept or reject this booking"
//                 });
//             }
//         }

//         if (requestedStatus === "completed") {
//             if (
//                 mentorId !== userId.toString() &&
//                 learnerId !== userId.toString()
//             ) {
//                 return res.status(403).json({
//                     message: "You are not part of this booking"
//                 });
//             }

//             if (booking.status !== "accepted") {
//                 return res.status(400).json({
//                     message: "Only an accepted session can be completed"
//                 });
//             }
//         }

//         const allowedStatuses = [
//             "pending",
//             "accepted",
//             "rejected",
//             "completed",
//             "cancelled"
//         ];

//         if (!allowedStatuses.includes(requestedStatus)) {
//             return res.status(400).json({
//                 message: "Invalid booking status"
//             });
//         }

//         booking.status = requestedStatus;
//         await booking.save();

//         res.json({
//             message: "Booking updated successfully",
//             booking
//         });
//     } catch (error) {
//         console.error("Update booking error:", error);
//         res.status(500).json({
//             message: error.message
//         });
//     }
// };

// const cancelBooking = async (req, res) => {
//     try {
//         const userId = req.user._id || req.user.id;

//         const booking = await Booking.findById(req.params.id);

//         if (!booking) {
//             return res.status(404).json({
//                 message: "Booking not found"
//             });
//         }

//         if (
//             booking.mentor.toString() !== userId.toString() &&
//             booking.learner.toString() !== userId.toString()
//         ) {
//             return res.status(403).json({
//                 message: "You are not part of this booking"
//             });
//         }

//         booking.status = "cancelled";
//         await booking.save();

//         res.json({
//             message: "Booking cancelled",
//             booking
//         });
//     } catch (error) {
//         console.error("Cancel booking error:", error);
//         res.status(500).json({
//             message: error.message
//         });
//     }
// };

// module.exports = {
//     createBooking,
//     getBookings,
//     getMentorRequests,
//     updateBookingStatus,
//     cancelBooking
// };


const Booking = require("../models/Booking");
const Wallet = require("../models/Wallet");
const WalletTransaction = require("../models/WalletTransaction");
const { getOrCreateReconciledWallet } = require("../Utils/walletHelper");
const { withMeeting, normalizeMeetUrl } = require('../Utils/bookingMeeting');
const { paymentDetails } = require('../Utils/manualPayment');
const { recordActivity } = require("../Utils/activityLogger");
const User = require(
    "../Backend Configuration/Models/UserSchema/user"
);

const getCurrentUserId = (req) => {
    return String(req.user._id || req.user.id);
};

// =====================================================
function getSessionWindow(date, time, duration = 60) {
    const start = new Date(`${date}T${time}`);
    const startMs = start.getTime();
    if (Number.isNaN(startMs)) return null;
    const endMs = startMs + (Number(duration) || 60) * 60 * 1000;
    return { start: startMs, end: endMs };
}

function doSlotsOverlap(slotA, slotB) {
    return slotA.start < slotB.end && slotB.start < slotA.end;
}

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;

const expireStaleBookings = async () => {
    try {
        const now = new Date();
        await Booking.updateMany(
            {
                status: { $in: ["pending", "approved", "slots_offered"] },
                actionExpiresAt: { $lte: now }
            },
            {
                $set: {
                    status: "cancelled",
                    paymentStatus: "cancelled",
                    cancellationReason: "Auto-cancelled: 4-hour action window expired",
                    cancelledBy: "system",
                    actionExpiresAt: null
                }
            }
        );
    } catch (err) {
        console.error("Error expiring stale bookings:", err);
    }
};

// =====================================================
// CHECK AVAILABILITY
// =====================================================

const checkAvailability = async (req, res) => {
    try {
        const { mentor, date, time, duration = 60 } = req.query;

        if (!mentor || !date || !time) {
            return res.status(400).json({
                available: false,
                message: "Mentor, date, and time are required"
            });
        }

        const requestedSlot = getSessionWindow(date, time, duration);
        if (!requestedSlot || requestedSlot.start <= Date.now()) {
            return res.status(400).json({
                available: false,
                message: "Please select a valid future date and time"
            });
        }

        const learnerId = getCurrentUserId(req);

        // Check mentor bookings on that date
        const mentorBookings = await Booking.find({
            mentor,
            date,
            status: { $in: ["pending", "approved", "accepted"] }
        });

        for (const b of mentorBookings) {
            const existingSlot = getSessionWindow(b.date, b.time, b.duration || 60);
            if (existingSlot && doSlotsOverlap(requestedSlot, existingSlot)) {
                return res.json({
                    available: false,
                    message: "Mentor already has a session booked during this time slot."
                });
            }
        }

        // Check learner bookings on that date
        const learnerBookings = await Booking.find({
            $or: [{ learner: learnerId }, { mentor: learnerId }],
            date,
            status: { $in: ["pending", "approved", "accepted"] }
        });

        for (const b of learnerBookings) {
            const existingSlot = getSessionWindow(b.date, b.time, b.duration || 60);
            if (existingSlot && doSlotsOverlap(requestedSlot, existingSlot)) {
                return res.json({
                    available: false,
                    message: "You already have another session scheduled during this time slot."
                });
            }
        }

        return res.json({
            available: true,
            message: "Time slot is available"
        });
    } catch (error) {
        console.error("Check availability error:", error);
        return res.status(500).json({
            available: false,
            message: "Unable to check slot availability"
        });
    }
};

// =====================================================
// CREATE BOOKING
// =====================================================

const createBooking = async (req, res) => {
    try {
        const learnerId = getCurrentUserId(req);

        const {
            mentor,
            date,
            time,
            duration = 60,
            message
        } = req.body;

        const durationMins = Math.max(15, Math.min(480, Number(duration) || 60));

        if (!mentor || !date || !time) {
            return res.status(400).json({
                message: "Mentor, date and time are required"
            });
        }

        // Prevent booking yourself
        if (String(mentor) === learnerId) {
            return res.status(400).json({
                message: "You cannot book yourself"
            });
        }

        // Verify mentor/peer exists
        const mentorUser = await User.findById(mentor)
            .select("_id name role isActive hourlyRate +paymentQr");

        if (!mentorUser) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (mentorUser.role === "admin") {
            return res.status(400).json({
                message: "Cannot book a session with an administrator"
            });
        }

        if (mentorUser.isActive === false) {
            return res.status(400).json({
                message: "This user is currently unavailable"
            });
        }

        if (mentorUser.role !== "mentor") {
            mentorUser.hourlyRate = 0;
            mentorUser.paymentQr = "";
        }

        // Prevent booking a past date
        const requestedSlot = getSessionWindow(date, time, durationMins);
        if (
            !requestedSlot ||
            requestedSlot.start <= Date.now()
        ) {
            return res.status(400).json({
                message: "Please select a valid future date and time"
            });
        }

        // Prevent double booking of overlapping mentor slot
        const mentorBookings = await Booking.find({
            mentor,
            date,
            status: { $in: ["pending", "approved", "accepted"] }
        });

        for (const b of mentorBookings) {
            const existingSlot = getSessionWindow(b.date, b.time, b.duration || 60);
            if (existingSlot && doSlotsOverlap(requestedSlot, existingSlot)) {
                return res.status(409).json({
                    message: "This time slot is already booked or awaiting approval"
                });
            }
        }

        // Prevent learner from overlapping their own sessions
        const learnerBookings = await Booking.find({
            $or: [{ learner: learnerId }, { mentor: learnerId }],
            date,
            status: { $in: ["pending", "approved", "accepted"] }
        });

        for (const b of learnerBookings) {
            const existingSlot = getSessionWindow(b.date, b.time, b.duration || 60);
            if (existingSlot && doSlotsOverlap(requestedSlot, existingSlot)) {
                return res.status(409).json({
                    message: "You already have a session scheduled during this time slot"
                });
            }
        }

        let payment;
        try { payment = paymentDetails(mentorUser, { ...req.body, isRequest: true }, durationMins); }
        catch (error) { return res.status(400).json({ message: error.message }); }
        
        const now = new Date();
        const actionExpiresAt = new Date(now.getTime() + FOUR_HOURS_MS);

        // Create booking
        const booking = await Booking.create({
            ...payment,
            duration: durationMins,
            mentor,
            learner: learnerId,
            date,
            time,
            message: message?.trim() || "",
            status: "pending",
            lastActionAt: now,
            actionExpiresAt
        });

        recordActivity({
            actor: learnerId,
            action: "booking.created",
            entityType: "Booking",
            entityId: booking._id,
            metadata: { mentor, date, time }
        });

        const populatedBooking =
            await Booking.findById(booking._id)
                .populate(
                    "mentor learner",
                    "name email role avatarUrl"
                );

        return res.status(201).json({
            message: "Booking created successfully",
            booking: populatedBooking
        });

    } catch (error) {
        console.error(
            "Create booking error:",
            error
        );

        return res.status(500).json({
            message: "Unable to create booking"
        });
    }
};

// =====================================================
// GET MY BOOKINGS
// =====================================================

const getBookings = async (req, res) => {
    try {
        await expireStaleBookings();
        const userId = getCurrentUserId(req);

        const bookings = await Booking.find({
            $or: [
                { learner: userId },
                { mentor: userId }
            ]
        })
            .populate(
                "mentor learner",
                "name email role avatarUrl"
            )
            .sort({
                date: -1,
                time: -1,
                createdAt: -1
            });

        return res.json(bookings.map(booking => withMeeting(booking)));

    } catch (error) {
        console.error(
            "Get bookings error:",
            error
        );

        return res.status(500).json({
            message: "Unable to load bookings"
        });
    }
};

// =====================================================
// GET MENTOR REQUESTS
// =====================================================

const getMentorRequests = async (req, res) => {
    try {
        await expireStaleBookings();
        const userId = getCurrentUserId(req);

        const requests = await Booking.find({
            mentor: userId,
            status: "pending"
        })
            .populate(
                "learner",
                "name email role avatarUrl"
            )
            .sort({
                date: -1,
                time: -1,
                createdAt: -1
            });

        return res.json(requests);

    } catch (error) {
        console.error(
            "Get mentor requests error:",
            error
        );

        return res.status(500).json({
            message: "Unable to load booking requests"
        });
    }
};

// =====================================================
// UPDATE BOOKING STATUS
// =====================================================

const updateBookingStatus = async (req, res) => {
    try {
        await expireStaleBookings();
        const userId = getCurrentUserId(req);
        const requestedStatus = req.body.status;

        const booking = await Booking.findById(
            req.params.id
        );

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found"
            });
        }

        const mentorId =
            booking.mentor.toString();

        const learnerId =
            booking.learner.toString();

        const isMentor =
            mentorId === userId;

        const isLearner =
            learnerId === userId;

        if (!isMentor && !isLearner) {
            return res.status(403).json({
                message:
                    "You are not part of this booking"
            });
        }

        // =================================================
        // APPROVE / ACCEPT / REJECT
        // Only mentor can do this
        // =================================================

        if (
            requestedStatus === "approved" ||
            requestedStatus === "accepted" ||
            requestedStatus === "rejected"
        ) {
            if (!isMentor) {
                return res.status(403).json({
                    message:
                        "Only the mentor can approve, accept or reject a booking"
                });
            }

            if (booking.status !== "pending" && booking.status !== "slots_offered") {
                return res.status(400).json({
                    message:
                        "Only pending or slot-offered bookings can be approved, accepted or rejected"
                });
            }
        }

        // =================================================
        // COMPLETE
        // =================================================

        if (requestedStatus === "completed") {
            if (!isMentor) {
                return res.status(403).json({
                    message:
                        "Only the mentor can mark a session completed"
                });
            }

            if (booking.status !== "accepted") {
                return res.status(400).json({
                    message:
                        "Only accepted sessions can be completed"
                });
            }
        }

        const allowedStatuses = [
            "approved",
            "accepted",
            "rejected",
            "completed"
        ];

        if (
            !allowedStatuses.includes(
                requestedStatus
            )
        ) {
            return res.status(400).json({
                message: "Invalid booking status"
            });
        }

        const now = new Date();
        booking.lastActionAt = now;

        // If mentor approves a free session, auto-confirm to accepted
        if (requestedStatus === "approved") {
            if (booking.paymentAmount === 0 || booking.paymentMethod === "free") {
                booking.status = "accepted";
                booking.paymentStatus = "not_required";
                booking.actionExpiresAt = null;
            } else {
                booking.status = "approved";
                booking.paymentStatus = "unpaid";
                // 4-hour window for booker to complete payment
                booking.actionExpiresAt = new Date(now.getTime() + FOUR_HOURS_MS);
            }
        } else if (requestedStatus === "rejected") {
            booking.status = "rejected";
            booking.paymentStatus = "declined";
            booking.actionExpiresAt = null;
            booking.cancellationReason = req.body.reason || "Declined by mentor";
        } else if (requestedStatus === "completed") {
            booking.status = "completed";
            booking.actionExpiresAt = null;
        } else {
            booking.status = requestedStatus;
        }

        await booking.save();

        recordActivity({
            actor: userId,
            action: `booking.${booking.status}`,
            entityType: "Booking",
            entityId: booking._id
        });

        const updatedBooking =
            await Booking.findById(
                booking._id
            ).populate(
                "mentor learner",
                "name email role avatarUrl"
            );

        return res.json({
            message:
                "Booking updated successfully",
            booking: withMeeting(updatedBooking)
        });

    } catch (error) {
        console.error(
            "Update booking error:",
            error
        );

        return res.status(500).json({
            message: "Unable to update booking"
        });
    }
};

// =====================================================
// COMPLETE BOOKING PAYMENT
// =====================================================

const completeBookingPayment = async (req, res) => {
    try {
        const userId = getCurrentUserId(req);
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (String(booking.learner) !== userId) {
            return res.status(403).json({ message: "Only the booker can submit payment for this session" });
        }

        if (booking.status !== "approved") {
            return res.status(400).json({ message: "Payment can only be completed after mentor approves the time slot" });
        }

        const mentorUser = await User.findById(booking.mentor).select("_id name role isActive hourlyRate +paymentQr");
        if (!mentorUser) {
            return res.status(404).json({ message: "Mentor not found" });
        }

        let payment;
        try {
            payment = paymentDetails(mentorUser, req.body, booking.duration || 60);
        } catch (err) {
            return res.status(400).json({ message: err.message });
        }

        booking.paymentMethod = payment.paymentMethod;
        booking.paymentAmount = payment.paymentAmount;
        booking.baseSessionAmount = payment.baseSessionAmount !== undefined ? payment.baseSessionAmount : payment.paymentAmount;
        booking.gstAmount = payment.gstAmount || 0;
        booking.grossAmountWithGst = payment.grossAmountWithGst || payment.paymentAmount;
        booking.paymentStatus = payment.paymentStatus;
        booking.paymentReference = payment.paymentReference;
        booking.learnerConvenienceFee = payment.learnerConvenienceFee || 0;
        booking.mentorPlatformFee = payment.mentorPlatformFee || 0;
        booking.mentorEarnings = payment.mentorEarnings || 0;
        booking.totalAmountPaid = payment.totalAmountPaid || payment.paymentAmount;
        booking.status = "accepted"; // Booking confirmed upon payment!
        booking.actionExpiresAt = null;
        booking.lastActionAt = new Date();

        // Wallet Settlement
        const deductionAmount = payment.totalAmountPaid || payment.paymentAmount;
        if (payment.paymentMethod === "wallet" && deductionAmount > 0) {
            const learnerWallet = await getOrCreateReconciledWallet(userId);

            if (learnerWallet.balance < deductionAmount) {
                return res.status(400).json({
                    message: `Insufficient wallet balance (₹${learnerWallet.balance.toLocaleString("en-IN")}). Please top up your wallet or pay via direct UPI/Card.`
                });
            }

            // Deduct from Top-Up Balance first, then fall back to Earned Balance
            let remainingToDeduct = deductionAmount;
            const deductFromTopup = Math.min(learnerWallet.topupBalance, remainingToDeduct);
            learnerWallet.topupBalance = Math.round((learnerWallet.topupBalance - deductFromTopup + Number.EPSILON) * 100) / 100;
            remainingToDeduct = Math.round((remainingToDeduct - deductFromTopup + Number.EPSILON) * 100) / 100;

            if (remainingToDeduct > 0) {
                learnerWallet.earnedBalance = Math.round((learnerWallet.earnedBalance - remainingToDeduct + Number.EPSILON) * 100) / 100;
            }
            learnerWallet.balance = Math.round((learnerWallet.earnedBalance + learnerWallet.topupBalance + Number.EPSILON) * 100) / 100;
            await learnerWallet.save();

            await WalletTransaction.create({
                wallet: learnerWallet._id,
                user: userId,
                type: "session_payment",
                amount: -deductionAmount,
                balanceAfter: learnerWallet.balance,
                booking: booking._id,
                learnerConvenienceFee: 0,
                mentorPlatformFee: 0,
                description: `Payment for session with ${mentorUser.name || "mentor"}`,
                paymentMethod: "wallet",
                reference: payment.paymentReference
            });

            // Credit to mentor wallet earnedBalance (net of 3% platform fee)
            const mentorWallet = await getOrCreateReconciledWallet(booking.mentor);

            mentorWallet.earnedBalance = Math.round((mentorWallet.earnedBalance + payment.mentorEarnings + Number.EPSILON) * 100) / 100;
            mentorWallet.balance = Math.round((mentorWallet.earnedBalance + mentorWallet.topupBalance + Number.EPSILON) * 100) / 100;
            await mentorWallet.save();

            await WalletTransaction.create({
                wallet: mentorWallet._id,
                user: booking.mentor,
                type: "session_earning",
                amount: payment.mentorEarnings,
                balanceAfter: mentorWallet.balance,
                booking: booking._id,
                mentorPlatformFee: payment.mentorPlatformFee,
                learnerConvenienceFee: 0,
                description: `Session earnings (3% platform fee deducted)`,
                paymentMethod: "wallet",
                reference: payment.paymentReference
            });
        } else if (['upi', 'upi_card', 'card'].includes(payment.paymentMethod) && payment.paymentStatus === 'verified' && payment.mentorEarnings > 0) {
            // Direct UPI/Card: Credit to mentor wallet earnedBalance (net of 3% platform fee)
            const mentorWallet = await getOrCreateReconciledWallet(booking.mentor);

            mentorWallet.earnedBalance = Math.round((mentorWallet.earnedBalance + payment.mentorEarnings + Number.EPSILON) * 100) / 100;
            mentorWallet.balance = Math.round((mentorWallet.earnedBalance + mentorWallet.topupBalance + Number.EPSILON) * 100) / 100;
            await mentorWallet.save();

            await WalletTransaction.create({
                wallet: mentorWallet._id,
                user: booking.mentor,
                type: "session_earning",
                amount: payment.mentorEarnings,
                balanceAfter: mentorWallet.balance,
                booking: booking._id,
                mentorPlatformFee: payment.mentorPlatformFee,
                learnerConvenienceFee: payment.learnerConvenienceFee || 0,
                description: `Session earnings (3% platform fee deducted)`,
                paymentMethod: "upi",
                reference: payment.paymentReference
            });
        }

        await booking.save();

        recordActivity({
            actor: userId,
            action: "booking.payment_completed",
            entityType: "Booking",
            entityId: booking._id,
            metadata: {
                method: booking.paymentMethod,
                amount: booking.paymentAmount,
                learnerConvenienceFee: booking.learnerConvenienceFee,
                mentorPlatformFee: booking.mentorPlatformFee,
                mentorEarnings: booking.mentorEarnings
            }
        });

        const updatedBooking = await Booking.findById(booking._id).populate(
            "mentor learner",
            "name email role avatarUrl"
        );

        return res.json({
            message: "Payment processed and session confirmed!",
            booking: withMeeting(updatedBooking)
        });
    } catch (error) {
        console.error("Complete payment error:", error);
        return res.status(500).json({ message: "Unable to complete booking payment" });
    }
};

// =====================================================
// SUGGEST AVAILABLE SLOTS (MENTOR REJECTION / ALTERNATES)
// =====================================================

const suggestSlots = async (req, res) => {
    try {
        await expireStaleBookings();
        const userId = getCurrentUserId(req);
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (String(booking.mentor) !== userId) {
            return res.status(403).json({ message: "Only the mentor can suggest alternate slots" });
        }

        if (!["pending", "slots_offered"].includes(booking.status)) {
            return res.status(400).json({ message: "Slots can only be suggested for pending requests" });
        }

        const { slots } = req.body;
        if (!Array.isArray(slots) || slots.length === 0) {
            return res.status(400).json({ message: "Please provide at least one available slot" });
        }

        const duration = booking.duration || 60;
        const formattedSlots = [];

        for (const slot of slots) {
            if (!slot.date || !slot.time) {
                return res.status(400).json({ message: "Each slot must have a valid date and time" });
            }
            const window = getSessionWindow(slot.date.trim(), slot.time.trim(), duration);
            if (!window || window.start <= Date.now()) {
                return res.status(400).json({ message: `Slot on ${slot.date} at ${slot.time} must be in the future` });
            }
            formattedSlots.push({
                date: slot.date.trim(),
                time: slot.time.trim(),
                isPreferred: Boolean(slot.isPreferred)
            });
        }

        // Put preferred slot first, sort remaining chronologically
        const preferred = formattedSlots.filter(s => s.isPreferred);
        const others = formattedSlots.filter(s => !s.isPreferred).sort((a, b) => {
            const timeA = new Date(`${a.date}T${a.time}`).getTime();
            const timeB = new Date(`${b.date}T${b.time}`).getTime();
            return timeA - timeB;
        });

        let orderedSlots;
        if (preferred.length > 0) {
            orderedSlots = [preferred[0], ...others];
        } else {
            orderedSlots = others;
            if (orderedSlots.length > 0) orderedSlots[0].isPreferred = true;
        }

        const now = new Date();
        booking.status = "slots_offered";
        booking.suggestedSlots = orderedSlots;
        booking.lastActionAt = now;
        // Timer resets to fresh 4 hours when mentor shares alternate slots!
        booking.actionExpiresAt = new Date(now.getTime() + FOUR_HOURS_MS);

        await booking.save();

        recordActivity({
            actor: userId,
            action: "booking.slots_offered",
            entityType: "Booking",
            entityId: booking._id,
            metadata: { slotCount: orderedSlots.length }
        });

        const updatedBooking = await Booking.findById(booking._id).populate(
            "mentor learner",
            "name email role avatarUrl"
        );

        return res.json({
            message: "Available slots shared with learner successfully",
            booking: withMeeting(updatedBooking)
        });
    } catch (error) {
        console.error("Suggest slots error:", error);
        return res.status(500).json({ message: "Unable to suggest slots" });
    }
};

// =====================================================
// BOOKER PICKS SLOT -> DIRECT TO PAYMENT
// =====================================================

const chooseSlot = async (req, res) => {
    try {
        await expireStaleBookings();
        const userId = getCurrentUserId(req);
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (String(booking.learner) !== userId) {
            return res.status(403).json({ message: "Only the booker can select an offered slot" });
        }

        if (booking.status !== "slots_offered") {
            return res.status(400).json({ message: "No alternate slots currently offered for this booking" });
        }

        const { date, time } = req.body;
        if (!date || !time) {
            return res.status(400).json({ message: "Please select a valid date and time" });
        }

        const match = booking.suggestedSlots.find(s => s.date === date && s.time === time);
        if (!match) {
            return res.status(400).json({ message: "Selected slot is not among the mentor's offered slots" });
        }

        const duration = booking.duration || 60;
        const slotWindow = getSessionWindow(date, time, duration);
        if (!slotWindow || slotWindow.start <= Date.now()) {
            return res.status(400).json({ message: "Selected time slot has already passed" });
        }

        // Check if mentor has a conflicting accepted session
        const mentorBookings = await Booking.find({
            mentor: booking.mentor,
            _id: { $ne: booking._id },
            date,
            status: { $in: ["approved", "accepted"] }
        });

        for (const b of mentorBookings) {
            const bSlot = getSessionWindow(b.date, b.time, b.duration || 60);
            if (bSlot && doSlotsOverlap(slotWindow, bSlot)) {
                return res.status(409).json({ message: "Mentor is no longer available at this time slot" });
            }
        }

        const now = new Date();
        booking.date = date;
        booking.time = time;

        // DIRECT TO PAYMENT:
        // Free session: auto-accept.
        // Paid session: transitions directly to "approved" so payment unlocks with zero extra mentor confirmation!
        if (booking.paymentAmount === 0 || booking.paymentMethod === "free") {
            booking.status = "accepted";
            booking.paymentStatus = "not_required";
            booking.actionExpiresAt = null;
        } else {
            booking.status = "approved";
            booking.paymentStatus = "unpaid";
            booking.actionExpiresAt = new Date(now.getTime() + FOUR_HOURS_MS);
        }
        booking.lastActionAt = now;

        await booking.save();

        recordActivity({
            actor: userId,
            action: "booking.slot_chosen",
            entityType: "Booking",
            entityId: booking._id,
            metadata: { date, time }
        });

        const updatedBooking = await Booking.findById(booking._id).populate(
            "mentor learner",
            "name email role avatarUrl"
        );

        return res.json({
            message: "Slot selected successfully. Proceed directly to payment.",
            booking: withMeeting(updatedBooking)
        });
    } catch (error) {
        console.error("Choose slot error:", error);
        return res.status(500).json({ message: "Unable to select slot" });
    }
};

// =====================================================
// CANCEL BOOKING
// =====================================================

const cancelBooking = async (req, res) => {
    try {
        const userId = getCurrentUserId(req);

        const booking =
            await Booking.findById(
                req.params.id
            );

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found"
            });
        }

        const isMentor =
            booking.mentor.toString() === userId;

        const isLearner =
            booking.learner.toString() === userId;

        if (!isMentor && !isLearner) {
            return res.status(403).json({
                message:
                    "You are not part of this booking"
            });
        }

        if (
            !["pending", "approved", "slots_offered", "accepted"]
                .includes(booking.status)
        ) {
            return res.status(400).json({
                message:
                    "This booking cannot be cancelled"
            });
        }

        const wasAccepted = booking.status === "accepted";
        const hasPayment = (Number(booking.paymentAmount) > 0 && booking.paymentMethod !== "free");
        const learnerRefundDue = isMentor && wasAccepted && hasPayment;

        booking.status = "cancelled";
        booking.paymentStatus = "cancelled";
        booking.cancelledBy = isMentor ? "mentor" : "learner";
        booking.actionExpiresAt = null;
        booking.lastActionAt = new Date();

        if (learnerRefundDue) {
            booking.cancellationReason = "Cancelled by mentor: Learner payment refund required under platform cancellation policy";
        } else if (req.body?.reason) {
            booking.cancellationReason = req.body.reason.trim();
        } else if (isLearner) {
            booking.cancellationReason = "Cancelled by learner before payment.";
        }

        await booking.save();

        recordActivity({
            actor: userId,
            action: "booking.cancelled",
            entityType: "Booking",
            entityId: booking._id,
            metadata: {
                cancelledBy: booking.cancelledBy,
                learnerRefundDue
            }
        });

        return res.json({
            message: "Booking cancelled successfully",
            booking,
            learnerRefundDue
        });

    } catch (error) {
        console.error(
            "Cancel booking error:",
            error
        );

        return res.status(500).json({
            message: "Unable to cancel booking"
        });
    }
};

const updateMeeting = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (String(booking.mentor) !== getCurrentUserId(req)) return res.status(403).json({ message: 'Only the mentor can set the meeting link' });
        if (booking.status !== 'accepted') return res.status(400).json({ message: 'Accept the session before adding a meeting link' });
        const url = normalizeMeetUrl(req.body.meetingUrl);
        if (!url) return res.status(400).json({ message: 'Enter a valid Google Meet link: https://meet.google.com/abc-defg-hij' });
        booking.meetingUrl = url;
        await booking.save();
        return res.json({ meetingUrl: url });
    } catch {
        return res.status(500).json({ message: 'Unable to save meeting link' });
    }
};

module.exports = {
    checkAvailability,
    completeBookingPayment,
    suggestSlots,
    chooseSlot,
    updateMeeting,
    createBooking,
    getBookings,
    getMentorRequests,
    updateBookingStatus,
    cancelBooking
};
// @teamcosmiccoders
