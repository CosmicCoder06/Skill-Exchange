const express = require("express");
const verifyToken = require("../Backend Configuration/Configuration Folders/Middleware Configuration/authMiddleware");
const authorize = require("../Backend Configuration/Configuration Folders/Middleware Configuration/roleSpecificMiddleware");
const { listSettings, upsertSetting } = require("../controllers/settingController");
const router = express.Router();
router.use(verifyToken, authorize("admin"));
router.get("/settings", listSettings);
router.put("/settings", upsertSetting);
module.exports = router;
