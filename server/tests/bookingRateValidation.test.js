const test = require("node:test");
const assert = require("node:assert/strict");
const { calculateSessionAmount, calculatePaymentDetails: paymentDetails } = require("../Utils/feeCalculator");

test("booking fee calculation for paid mentor at rate 500 for 30, 60, and 90 mins", () => {
  const mentorRate = 500;
  
  // 30 min duration
  const fee30 = Math.round((mentorRate * 30) / 60);
  assert.equal(fee30, 250);
  assert.equal(calculateSessionAmount(mentorRate, 30), 250);
  const payment30 = paymentDetails({ hourlyRate: mentorRate }, { isRequest: true }, 30);
  assert.equal(payment30.paymentAmount, 250);
  assert.equal(payment30.paymentStatus, "awaiting_approval");

  // 60 min duration
  const fee60 = Math.round((mentorRate * 60) / 60);
  assert.equal(fee60, 500);
  assert.equal(calculateSessionAmount(mentorRate, 60), 500);
  const payment60 = paymentDetails({ hourlyRate: mentorRate }, { isRequest: true }, 60);
  assert.equal(payment60.paymentAmount, 500);
  assert.equal(payment60.paymentStatus, "awaiting_approval");

  // 90 min duration
  const fee90 = Math.round((mentorRate * 90) / 60);
  assert.equal(fee90, 750);
  assert.equal(calculateSessionAmount(mentorRate, 90), 750);
  const payment90 = paymentDetails({ hourlyRate: mentorRate }, { isRequest: true }, 90);
  assert.equal(payment90.paymentAmount, 750);
  assert.equal(payment90.paymentStatus, "awaiting_approval");
});

test("mentor with rate 0 produces a free session", () => {
  const mentorRate = 0;
  const fee = Math.round((mentorRate * 60) / 60);
  assert.equal(fee, 0);
  assert.equal(calculateSessionAmount(mentorRate, 60), 0);

  const payment = paymentDetails({ hourlyRate: mentorRate }, { isRequest: true }, 60);
  assert.equal(payment.paymentAmount, 0);
  assert.equal(payment.paymentMethod, "free");
  assert.equal(payment.paymentStatus, "not_required");
});

test("rate validation helper detects missing, undefined, null, and NaN rates", () => {
  function isMentorRateConfigured(hourlyRate) {
    return (
      hourlyRate !== undefined &&
      hourlyRate !== null &&
      hourlyRate !== "" &&
      Number.isFinite(Number(hourlyRate)) &&
      Number(hourlyRate) >= 0
    );
  }

  // Valid rates
  assert.equal(isMentorRateConfigured(500), true);
  assert.equal(isMentorRateConfigured(0), true);
  assert.equal(isMentorRateConfigured("300"), true);
  assert.equal(isMentorRateConfigured("0"), true);

  // Invalid / unconfigured rates (must NOT be treated as free)
  assert.equal(isMentorRateConfigured(undefined), false);
  assert.equal(isMentorRateConfigured(null), false);
  assert.equal(isMentorRateConfigured(""), false);
  assert.equal(isMentorRateConfigured(NaN), false);
  assert.equal(isMentorRateConfigured("abc"), false);
  assert.equal(isMentorRateConfigured(-100), false);
});
