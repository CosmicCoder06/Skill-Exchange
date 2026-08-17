const {
  refreshAccessToken,
  logoutUser,
  getMe,
} = require("../../Controllers/Token and Session Controller/tokenController");

const {
  protect,
} = require("../../Configuration Folders/Middleware Configuration/authMiddleware");