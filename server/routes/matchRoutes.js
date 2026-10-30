const express = require("express");
const verifyToken = require("../Backend Configuration/Configuration Folders/Middleware Configuration/authMiddleware");
const { getMatches } = require("../controllers/matchController");

const router = express.Router();

router.get("/matches", verifyToken, getMatches);

module.exports = router;
