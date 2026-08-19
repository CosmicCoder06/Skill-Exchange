const User = require("../../../Models/UserSchema/user");
const {
  buildEmailVerificationUrl,
  createEmailVerificationToken,
} = require("../../../../Utils/emailVerification");
const { sendVerificationEmail } = require("../../../../services/emailService");

// @route POST /api/auth/register
// @access Public
const registerUser = async (req, res) => {
  try {
    const { name, password, role } = req.body;
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    if (role && !["learner", "mentor"].includes(role)) {
      return res.status(400).json({ message: "Choose either learner or mentor" });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        message: "User already exists with this email",
      });
    }

    const verification = createEmailVerificationToken();
    const user = await User.create({
      name,
      email,
      password,
      role: role || "learner",
      isEmailVerified: false,
      emailVerificationTokenHash: verification.tokenHash,
      emailVerificationExpiresAt: verification.expiresAt,
    });

    let emailSent = false;
    try {
      await sendVerificationEmail({
        name: user.name,
        to: user.email,
        verificationUrl: buildEmailVerificationUrl(verification.rawToken),
      });
      user.emailVerificationSentAt = new Date();
      await user.save();
      emailSent = true;
    } catch (emailError) {
      console.error("Initial verification email failed:", emailError.message);
    }

    return res.status(emailSent ? 201 : 202).json({
      code: emailSent ? "VERIFICATION_EMAIL_SENT" : "EMAIL_PENDING_DELIVERY",
      email: user.email,
      emailSent,
      requiresEmailVerification: true,
      message: emailSent
        ? "Account created. Check your email to verify your account."
        : "Account created, but the verification email could not be sent. Use resend after email delivery is configured.",
    });
  } catch (error) {
    console.error("Registration failed:", error.message);

    return res.status(500).json({
      message: "Registration failed",
    });
  }
};

module.exports = {
  registerUser,
};
