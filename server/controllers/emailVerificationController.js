const User = require("../Backend Configuration/Models/UserSchema/user");
const {
  MAX_OTP_ATTEMPTS,
  createEmailVerificationOtp,
  getResendWaitMs,
  hashEmailVerificationToken,
  isEmailVerificationOtpValid,
} = require("../Utils/emailVerification");
const { sendVerificationOtp } = require("../services/emailService");

const GENERIC_RESEND_MESSAGE =
  "If an unverified account exists for that email, a verification code has been sent.";

async function verifyEmail(req, res) {
  try {
    const token = typeof req.body.token === "string" ? req.body.token.trim() : "";

    if (!token) {
      return res.status(400).json({ message: "Verification token is required" });
    }

    if (!/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).json({
        code: "INVALID_VERIFICATION_TOKEN",
        message: "This verification link is invalid or has expired.",
      });
    }

    const tokenHash = hashEmailVerificationToken(token);
    const user = await User.findOne({
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpiresAt: { $gt: new Date() },
    }).select(
      "+emailVerificationTokenHash +emailVerificationOtpHash +emailVerificationOtpAttempts +emailVerificationExpiresAt",
    );

    if (!user) {
      return res.status(400).json({
        code: "INVALID_VERIFICATION_TOKEN",
        message: "This verification link is invalid or has expired.",
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationTokenHash = undefined;
    user.emailVerificationOtpHash = undefined;
    user.emailVerificationOtpAttempts = 0;
    user.emailVerificationExpiresAt = undefined;
    user.emailVerificationSentAt = undefined;
    await user.save();

    return res.json({ message: "Email verified successfully. You can now sign in." });
  } catch (error) {
    console.error("Email verification failed:", error.message);
    return res.status(500).json({ message: "Unable to verify email" });
  }
}

async function verifyEmailOtp(req, res) {
  try {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const otp = typeof req.body.otp === "string" ? req.body.otp.trim() : "";

    if (!email || !/^[0-9]{6}$/.test(otp)) {
      return res.status(400).json({
        code: "INVALID_OTP",
        message: "Enter the 6-digit verification code.",
      });
    }

    const user = await User.findOne({ email }).select(
      "+emailVerificationOtpHash +emailVerificationOtpAttempts +emailVerificationTokenHash +emailVerificationExpiresAt +emailVerificationSentAt",
    );

    if (!user) {
      return res.status(400).json({ code: "INVALID_OTP", message: "Invalid verification code." });
    }

    if (user.isEmailVerified !== false) {
      return res.json({ message: "Email is already verified. You can sign in." });
    }

    if (!user.emailVerificationOtpHash || !user.emailVerificationExpiresAt || user.emailVerificationExpiresAt <= new Date()) {
      return res.status(400).json({
        code: "OTP_EXPIRED",
        message: "This code has expired. Request a new verification code.",
      });
    }

    const attempts = user.emailVerificationOtpAttempts || 0;
    if (attempts >= MAX_OTP_ATTEMPTS) {
      return res.status(429).json({
        code: "OTP_ATTEMPTS_EXCEEDED",
        message: "Too many incorrect attempts. Request a new verification code.",
      });
    }

    if (!isEmailVerificationOtpValid(otp, user.emailVerificationOtpHash)) {
      user.emailVerificationOtpAttempts = attempts + 1;
      await user.save();

      const remaining = MAX_OTP_ATTEMPTS - user.emailVerificationOtpAttempts;
      return res.status(400).json({
        code: remaining > 0 ? "INVALID_OTP" : "OTP_ATTEMPTS_EXCEEDED",
        message: remaining > 0
          ? `Invalid verification code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
          : "Too many incorrect attempts. Request a new verification code.",
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationOtpHash = undefined;
    user.emailVerificationOtpAttempts = 0;
    user.emailVerificationTokenHash = undefined;
    user.emailVerificationExpiresAt = undefined;
    user.emailVerificationSentAt = undefined;
    await user.save();

    return res.json({ message: "Email verified successfully. You can now sign in." });
  } catch (error) {
    console.error("OTP verification failed:", error.message);
    return res.status(500).json({ message: "Unable to verify email" });
  }
}

async function resendVerification(req, res) {
  try {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email }).select(
      "+emailVerificationTokenHash +emailVerificationExpiresAt +emailVerificationSentAt",
    );

    if (!user || user.isEmailVerified !== false) {
      return res.json({ message: GENERIC_RESEND_MESSAGE });
    }

    const waitMs = getResendWaitMs(user.emailVerificationSentAt);
    if (waitMs > 0) {
      return res.json({ message: GENERIC_RESEND_MESSAGE });
    }

    const verification = createEmailVerificationOtp();
    user.emailVerificationOtpHash = verification.otpHash;
    user.emailVerificationOtpAttempts = 0;
    user.emailVerificationTokenHash = undefined;
    user.emailVerificationExpiresAt = verification.expiresAt;
    await user.save();

    await sendVerificationOtp({
      name: user.name,
      to: user.email,
      otp: verification.otp,
    });

    user.emailVerificationSentAt = new Date();
    await user.save();

    return res.json({ message: GENERIC_RESEND_MESSAGE });
  } catch (error) {
    console.error("Resend verification failed:", error.message);
    return res.json({ message: GENERIC_RESEND_MESSAGE });
  }
}

module.exports = { resendVerification, verifyEmail, verifyEmailOtp };
