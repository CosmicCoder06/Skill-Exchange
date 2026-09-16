const express = require("express");
const verifyToken = require("../Backend Configuration/Configuration Folders/Middleware Configuration/authMiddleware");
const authorize = require("../Backend Configuration/Configuration Folders/Middleware Configuration/roleSpecificMiddleware");
const { listActivityLogs } = require("../controllers/activityLogController");
const router = express.Router();
router.get("/activity-logs", verifyToken, authorize("admin"), listActivityLogs);
module.exports = router;
