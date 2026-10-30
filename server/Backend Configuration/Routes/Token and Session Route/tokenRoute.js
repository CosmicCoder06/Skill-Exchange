const {
  refreshAccessToken,
  logoutUser,
  getMe,
} = require("../../Controllers/Token and Session Controller/tokenController");

const verifyToken = require("../../Configuration Folders/Middleware Configuration/authMiddleware");
const express = require("express");
const router = express.Router();

router.post("/auth/refresh", refreshAccessToken);
router.post("/auth/logout", verifyToken, logoutUser);
router.get("/auth/me", verifyToken, getMe);

module.exports = router;
