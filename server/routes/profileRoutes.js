const express = require("express");

const verifyToken = require("../Backend Configuration/Configuration Folders/Middleware Configuration/authMiddleware");

const {
    getMyProfile,
    updateProfile,
    getUserProfile,
    deactivateMyAccount
} = require("../controllers/profileController");


const router = express.Router();


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
