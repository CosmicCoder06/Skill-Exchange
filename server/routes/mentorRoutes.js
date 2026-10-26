const express = require("express");
const verifyToken = require("../Backend Configuration/Configuration Folders/Middleware Configuration/authMiddleware");
const { listMentors, getMentorById, getMentorPaymentInfo } = require("../controllers/mentorController");
const router = express.Router();

router.get("/mentors", verifyToken, listMentors);
router.get("/mentors/:id", verifyToken, getMentorById);
router.get("/mentors/:id/payment", verifyToken, getMentorPaymentInfo);

module.exports = router;
