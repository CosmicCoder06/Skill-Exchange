const express = require("express");
const verifyToken = require("../Backend Configuration/Configuration Folders/Middleware Configuration/authMiddleware");
const authorize = require("../Backend Configuration/Configuration Folders/Middleware Configuration/roleSpecificMiddleware");
const { listSettings, upsertSetting } = require("../controllers/settingController");
const router = express.Router();

router.get("/settings", verifyToken, authorize("admin"), listSettings);
router.put("/settings", verifyToken, authorize("admin"), upsertSetting);

module.exports = router;
