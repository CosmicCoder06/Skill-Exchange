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
// CREATE BOOKING
// =====================================================

const createBooking = async (req, res) => {
    try {
        const learnerId = getCurrentUserId(req);

        const {
            mentor,
            date,
            time,
            message
        } = req.body;

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
        const selectedDate = new Date(`${date}T${time}`);

        if (
            Number.isNaN(selectedDate.getTime()) ||
            selectedDate <= new Date()
        ) {
            return res.status(400).json({
                message: "Please select a future date and time"
            });
        }

        // Prevent double booking of the same mentor slot
        const conflictingBooking =
            await Booking.findOne({
                mentor,
                date,
                time,
                status: {
                    $in: ["pending", "accepted"]
                }
            });

        if (conflictingBooking) {
            return res.status(409).json({
                message:
                    "This time slot is already booked or awaiting approval"
            });
        }

        let payment;
        try { payment = paymentDetails(mentorUser, req.body); }
        catch (error) { return res.status(400).json({ message: error.message }); }
        // Create booking
        const booking = await Booking.create({
            ...payment,
            mentor,
            learner: learnerId,
            date,
            time,
            message: message?.trim() || "",
            status: "pending"
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
                date: 1,
                time: 1,
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
        // ACCEPT / REJECT
        // Only mentor can do this
        // =================================================

        if (
            requestedStatus === "accepted" ||
            requestedStatus === "rejected"
        ) {
            if (!isMentor) {
                return res.status(403).json({
                    message:
                        "Only the mentor can accept or reject a booking"
                });
            }

            if (booking.status !== "pending") {
                return res.status(400).json({
                    message:
                        "Only pending bookings can be accepted or rejected"
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

        booking.status =
            requestedStatus;

        await booking.save();

        recordActivity({
            actor: userId,
            action: `booking.${requestedStatus}`,
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
            !["pending", "accepted"]
                .includes(booking.status)
        ) {
            return res.status(400).json({
                message:
                    "This booking cannot be cancelled"
            });
        }

        booking.status = "cancelled";

        await booking.save();

        recordActivity({
            actor: userId,
            action: "booking.cancelled",
            entityType: "Booking",
            entityId: booking._id
        });

        return res.json({
            message: "Booking cancelled successfully",
            booking
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
    updateMeeting,
    createBooking,
    getBookings,
    getMentorRequests,
    updateBookingStatus,
    cancelBooking
};
// @teamcosmiccoders
