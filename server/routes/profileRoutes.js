const express = require("express");

const verifyToken = require("../Backend Configuration/Configuration Folders/Middleware Configuration/authMiddleware");

const {
    getMyProfile,
    updateProfile,
    getUserProfile,
    deactivateMyAccount
} = require("../controllers/profileController");

const {
    getUserAvatar,
    getUserCover
} = require("../controllers/userMediaController");

const router = express.Router();

// Public media asset endpoints with browser caching
router.get("/users/:id/avatar", getUserAvatar);
router.get("/users/:id/cover", getUserCover);
router.get("/profile/:id/avatar", getUserAvatar);
router.get("/profile/:id/cover", getUserCover);

// Get logged in user's profile
router.get(
    "/profile/me",
    verifyToken,
    getMyProfile
);

// Update logged in user's profile
router.put(
    "/profile/update",
    verifyToken,
    updateProfile
);

router.put("/account/deactivate", verifyToken, deactivateMyAccount);

// View other user's profile
router.get(
    "/profile/:id",
    verifyToken,
    getUserProfile
);

module.exports = router;
// @teamcosmiccoders
