const express = require("express");

const router = express.Router();

const {
    createBooking,
    getBookings,
    getMentorRequests,
    updateBookingStatus,
    cancelBooking,
    updateMeeting
} = require("../controllers/bookingController");


// Authentication middleware
const authMiddleware =
    require("../Backend Configuration/Configuration Folders/Middleware Configuration/authMiddleware");

router.put('/bookings/:id/meeting', authMiddleware, updateMeeting);


// ========================================
// CREATE BOOKING
// POST /api/bookings
// ========================================

router.post(
    "/bookings",
    authMiddleware,
    createBooking
);


// ========================================
// GET MY BOOKINGS
// GET /api/bookings
// ========================================

router.get(
    "/bookings",
    authMiddleware,
    getBookings
);


// ========================================
// GET MENTOR REQUESTS
// GET /api/bookings/requests
// ========================================

router.get(
    "/bookings/requests",
    authMiddleware,
    getMentorRequests
);


// ========================================
// UPDATE BOOKING STATUS
// PUT /api/bookings/:id
// ========================================

router.put(
    "/bookings/:id",
    authMiddleware,
    updateBookingStatus
);


// ========================================
// CANCEL BOOKING
// DELETE /api/bookings/:id
// ========================================

router.delete(
    "/bookings/:id",
    authMiddleware,
    cancelBooking
);


module.exports = router;
// @teamcosmiccoders
