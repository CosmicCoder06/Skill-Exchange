const crypto = require("crypto");

const TOKEN_BYTES = 32;
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

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

function buildEmailVerificationUrl(token, clientUrl = process.env.CLIENT_URL) {
  const baseUrl = (clientUrl || "http://localhost:5173").replace(/\/$/, "");
  return `${baseUrl}/?verifyEmail=${encodeURIComponent(token)}`;
}

function getResendWaitMs(sentAt, now = new Date()) {
  if (!sentAt) return 0;
  return Math.max(new Date(sentAt).getTime() + RESEND_COOLDOWN_MS - now.getTime(), 0);
}

module.exports = {
  buildEmailVerificationUrl,
  createEmailVerificationToken,
  getResendWaitMs,
  hashEmailVerificationToken,
};
