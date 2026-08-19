const assert = require("node:assert/strict");
const test = require("node:test");
const {
  MAX_OTP_ATTEMPTS,
  buildEmailVerificationUrl,
  createEmailVerificationOtp,
  createEmailVerificationToken,
  getResendWaitMs,
  hashEmailVerificationToken,
  isEmailVerificationOtpValid,
} = require("../Utils/emailVerification");

test("creates a random token and stores only its hash", () => {
  const now = new Date("2026-08-19T00:00:00.000Z");
  const first = createEmailVerificationToken(now);
  const second = createEmailVerificationToken(now);

  assert.notEqual(first.rawToken, second.rawToken);
  assert.equal(first.tokenHash, hashEmailVerificationToken(first.rawToken));
  assert.notEqual(first.rawToken, first.tokenHash);
  assert.equal(first.expiresAt.toISOString(), "2026-08-20T00:00:00.000Z");
});

test("builds a client verification URL safely", () => {
  assert.equal(
    buildEmailVerificationUrl("token value", "https://skill.example/"),
    "https://skill.example/?verifyEmail=token%20value",
  );
});

test("enforces the resend cooldown", () => {
  const sentAt = new Date("2026-08-19T00:00:00.000Z");
  assert.equal(getResendWaitMs(sentAt, new Date("2026-08-19T00:00:30.000Z")), 30000);
  assert.equal(getResendWaitMs(sentAt, new Date("2026-08-19T00:02:00.000Z")), 0);
});

test("creates a six-digit OTP with a ten-minute expiry", () => {
  const now = new Date("2026-08-19T00:00:00.000Z");
  const verification = createEmailVerificationOtp("test-secret", now);

  assert.match(verification.otp, /^[0-9]{6}$/);
  assert.notEqual(verification.otp, verification.otpHash);
  assert.equal(verification.expiresAt.toISOString(), "2026-08-19T00:10:00.000Z");
  assert.equal(MAX_OTP_ATTEMPTS, 5);
});

test("validates OTP hashes using the server secret", () => {
  const verification = createEmailVerificationOtp("correct-secret");

  assert.equal(
    isEmailVerificationOtpValid(verification.otp, verification.otpHash, "correct-secret"),
    true,
  );
  assert.equal(
    isEmailVerificationOtpValid("000000", verification.otpHash, "wrong-secret"),
    false,
  );
});
