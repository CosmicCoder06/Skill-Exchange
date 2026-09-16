const Booking = require("../models/Booking");

const createBooking = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;

        const booking = await Booking.create({
            mentor: req.body.mentor,
            learner: userId,
            date: req.body.date,
            time: req.body.time,
            message: req.body.message || ""
        });

        res.status(201).json({
            message: "Booking created successfully",
            booking
        });
    } catch (error) {
        console.error("Create booking error:", error);
        res.status(500).json({
            message: error.message
        });
    }
};

const getBookings = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;

        const bookings = await Booking.find({
            $or: [
                { learner: userId },
                { mentor: userId }
            ]
        })
            .populate("mentor learner", "name email")
            .sort({ createdAt: -1 });

        res.json(bookings);
    } catch (error) {
        console.error("Get bookings error:", error);
        res.status(500).json({
            message: error.message
        });
    }
};

const getMentorRequests = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;

        const requests = await Booking.find({
            mentor: userId,
            status: "pending"
        })
            .populate("learner", "name email")
            .sort({ createdAt: -1 });

        res.json(requests);
    } catch (error) {
        console.error("Get mentor requests error:", error);
        res.status(500).json({
            message: error.message
        });
    }
};

const updateBookingStatus = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;

        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found"
            });
        }

        const mentorId = booking.mentor.toString();
        const learnerId = booking.learner.toString();
        const requestedStatus = req.body.status;

        if (
            requestedStatus === "accepted" ||
            requestedStatus === "rejected"
        ) {
            if (mentorId !== userId.toString()) {
                return res.status(403).json({
                    message: "Only the mentor can accept or reject this booking"
                });
            }
        }

        if (requestedStatus === "completed") {
            if (
                mentorId !== userId.toString() &&
                learnerId !== userId.toString()
            ) {
                return res.status(403).json({
                    message: "You are not part of this booking"
                });
            }

            if (booking.status !== "accepted") {
                return res.status(400).json({
                    message: "Only an accepted session can be completed"
                });
            }
        }

        const allowedStatuses = [
            "pending",
            "accepted",
            "rejected",
            "completed",
            "cancelled"
        ];

        if (!allowedStatuses.includes(requestedStatus)) {
            return res.status(400).json({
                message: "Invalid booking status"
            });
        }

        booking.status = requestedStatus;
        await booking.save();

        res.json({
            message: "Booking updated successfully",
            booking
        });
    } catch (error) {
        console.error("Update booking error:", error);
        res.status(500).json({
            message: error.message
        });
    }
};

const cancelBooking = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;

        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found"
            });
        }

        if (
            booking.mentor.toString() !== userId.toString() &&
            booking.learner.toString() !== userId.toString()
        ) {
            return res.status(403).json({
                message: "You are not part of this booking"
            });
        }

        booking.status = "cancelled";
        await booking.save();

        res.json({
            message: "Booking cancelled",
            booking
        });
    } catch (error) {
        console.error("Cancel booking error:", error);
        res.status(500).json({
            message: error.message
        });
    }
};

module.exports = {
    createBooking,
    getBookings,
    getMentorRequests,
    updateBookingStatus,
    cancelBooking
};