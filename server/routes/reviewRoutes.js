const express = require("express");
const router = express.Router();

const {
    createReview,
    getMyReviews,
    getUserReviews,
    getBookingReview
} = require("../controllers/reviewController");

const authMiddleware = require(
    "../Backend Configuration/Configuration Folders/Middleware Configuration/authMiddleware"
);

router.post(
    "/reviews",
    authMiddleware,
    createReview
);

router.get(
    "/reviews",
    authMiddleware,
    getMyReviews
);

router.get(
    "/reviews/user/:userId",
    authMiddleware,
    getUserReviews
);

router.get(
    "/reviews/booking/:bookingId",
    authMiddleware,
    getBookingReview
);

module.exports = router;
// @teamcosmiccoders
