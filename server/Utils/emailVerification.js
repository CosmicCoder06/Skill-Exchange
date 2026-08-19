const crypto = require("crypto");

const TOKEN_BYTES = 32;
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

function getOtpSecret(secret) {
  const value = secret || process.env.EMAIL_OTP_SECRET || process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
  if (!value) throw new Error("EMAIL_OTP_SECRET or JWT_ACCESS_SECRET is required");
  return value;
}

function hashEmailVerificationToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function createEmailVerificationToken(now = new Date()) {
  const rawToken = crypto.randomBytes(TOKEN_BYTES).toString("hex");

  return {
    rawToken,
    tokenHash: hashEmailVerificationToken(rawToken),
    expiresAt: new Date(now.getTime() + TOKEN_TTL_MS),
  };
}

function hashEmailVerificationOtp(otp, secret) {
  return crypto.createHmac("sha256", getOtpSecret(secret)).update(String(otp)).digest("hex");
}

function createEmailVerificationOtp(secret, now = new Date()) {
  const otp = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");

  return {
    otp,
    otpHash: hashEmailVerificationOtp(otp, secret),
    expiresAt: new Date(now.getTime() + OTP_TTL_MS),
  };
}

function isEmailVerificationOtpValid(otp, expectedHash, secret) {
  if (!/^[0-9]{6}$/.test(String(otp)) || !/^[a-f0-9]{64}$/i.test(expectedHash || "")) {
    return false;
  }

  const actual = Buffer.from(hashEmailVerificationOtp(otp, secret), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

function buildEmailVerificationUrl(token, clientUrl = process.env.CLIENT_URL) {
  const baseUrl = (clientUrl || "http://localhost:5173").replace(/\/$/, "");
  return `${baseUrl}/?verifyEmail=${encodeURIComponent(token)}`;
}

function getResendWaitMs(sentAt, now = new Date()) {
  if (!sentAt) return 0;
  return Math.max(new Date(sentAt).getTime() + RESEND_COOLDOWN_MS - now.getTime(), 0);
}

module.exports = {
  MAX_OTP_ATTEMPTS,
  buildEmailVerificationUrl,
  createEmailVerificationOtp,
  createEmailVerificationToken,
  getResendWaitMs,
  hashEmailVerificationOtp,
  hashEmailVerificationToken,
  isEmailVerificationOtpValid,
};
