const express = require("express");

const {
  registerUser,
} = require("../../../Controllers/Registration and Login Controller/Registration/registrationController");
const {
  resendVerification,
  verifyEmail,
} = require("../../../../controllers/emailVerificationController");

const router = express.Router();

// POST /api/registration/api
router.post("/registration/api", registerUser);
router.post("/auth/verify-email", verifyEmail);
router.post("/auth/resend-verification", resendVerification);

module.exports = router;
