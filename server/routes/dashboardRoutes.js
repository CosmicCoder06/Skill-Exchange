const express = require("express");

const verifyToken = require("../Backend Configuration/Configuration Folders/Middleware Configuration/authMiddleware");

const authorize = require("../Backend Configuration/Configuration Folders/Middleware Configuration/roleSpecificMiddleware");

const {
    getMentorDashboard,
    getLearnerDashboard
} = require("../controllers/dashboardController");

const router = express.Router();

// Mentor Dashboard
router.get(
    "/dashboard/mentor",
    verifyToken,
    authorize("mentor"),
    getMentorDashboard
);

// Learner Dashboard
router.get(
    "/dashboard/learner",
    verifyToken,
    authorize("learner"),
    getLearnerDashboard
);

module.exports = router;
// @teamcosmiccoders
