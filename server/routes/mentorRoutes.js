const express = require("express");
const verifyToken = require("../Backend Configuration/Configuration Folders/Middleware Configuration/authMiddleware");
const { listMentors } = require("../controllers/mentorController");
const router = express.Router();
router.get("/mentors", verifyToken, listMentors);
module.exports = router;
