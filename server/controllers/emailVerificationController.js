const User = require("../Backend Configuration/Models/UserSchema/user");
const {
  buildEmailVerificationUrl,
  createEmailVerificationToken,
  getResendWaitMs,
  hashEmailVerificationToken,
} = require("../Utils/emailVerification");
const { sendVerificationEmail } = require("../services/emailService");

const GENERIC_RESEND_MESSAGE =
  "If an unverified account exists for that email, a verification link has been sent.";

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
    }).select("+emailVerificationTokenHash +emailVerificationExpiresAt");

    if (!user) {
      return res.status(400).json({
        code: "INVALID_VERIFICATION_TOKEN",
        message: "This verification link is invalid or has expired.",
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationTokenHash = undefined;
    user.emailVerificationExpiresAt = undefined;
    user.emailVerificationSentAt = undefined;
    await user.save();

    return res.json({ message: "Email verified successfully. You can now sign in." });
  } catch (error) {
    console.error("Email verification failed:", error.message);
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

    const verification = createEmailVerificationToken();
    user.emailVerificationTokenHash = verification.tokenHash;
    user.emailVerificationExpiresAt = verification.expiresAt;
    await user.save();

    await sendVerificationEmail({
      name: user.name,
      to: user.email,
      verificationUrl: buildEmailVerificationUrl(verification.rawToken),
    });

    user.emailVerificationSentAt = new Date();
    await user.save();

    return res.json({ message: GENERIC_RESEND_MESSAGE });
  } catch (error) {
    console.error("Resend verification failed:", error.message);
    return res.json({ message: GENERIC_RESEND_MESSAGE });
  }
}

module.exports = { resendVerification, verifyEmail };
