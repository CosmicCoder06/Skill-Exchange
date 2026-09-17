const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateSessionAmount, paymentDetails } = require('../Utils/manualPayment');

test('duration calculates session payment amount dynamically', () => {
  assert.equal(calculateSessionAmount(500, 30), 250);
  assert.equal(calculateSessionAmount(500, 45), 375);
  assert.equal(calculateSessionAmount(500, 60), 500);
  assert.equal(calculateSessionAmount(500, 90), 750);
  assert.equal(calculateSessionAmount(500, 120), 1000);
  assert.equal(calculateSessionAmount(0, 60), 0);
});

test('paymentDetails accurately incorporates duration', () => {
  const mentor = { hourlyRate: 600, paymentQr: 'sample_qr' };
  
  // Request mode (before approval)
  const reqDetails = paymentDetails(mentor, { isRequest: true }, 45);
  assert.equal(reqDetails.paymentAmount, 450);
  assert.equal(reqDetails.paymentStatus, 'awaiting_approval');

  // Complete payment via QR after approval
  const payDetails = paymentDetails(mentor, {
    quotedAmount: 450,
    paymentMethod: 'qr',
    paymentReference: 'TXN12345678'
  }, 45);
  assert.equal(payDetails.paymentAmount, 450);
  assert.equal(payDetails.paymentStatus, 'pending_verification');
  assert.equal(payDetails.paymentReference, 'TXN12345678');
});

test('slot overlap helper detects overlaps and permits non-overlapping slots', () => {
  function getSessionWindow(date, time, duration = 60) {
    const start = new Date(`${date}T${time}`).getTime();
    const end = start + duration * 60 * 1000;
    return { start, end };
  }
  function doSlotsOverlap(a, b) {
    return a.start < b.end && b.start < a.end;
  }

  const slot1 = getSessionWindow('2026-10-01', '10:00', 60);
  const slot2Overlap = getSessionWindow('2026-10-01', '10:30', 30);
  const slot3Overlap = getSessionWindow('2026-10-01', '09:30', 45);
  const slot4Adjacent = getSessionWindow('2026-10-01', '11:00', 60);
  const slot5Before = getSessionWindow('2026-10-01', '09:00', 60);

  assert.equal(doSlotsOverlap(slot1, slot2Overlap), true);
  assert.equal(doSlotsOverlap(slot1, slot3Overlap), true);
  assert.equal(doSlotsOverlap(slot1, slot4Adjacent), false);
  assert.equal(doSlotsOverlap(slot1, slot5Before), false);
});

test('terminal booking states update paymentStatus accordingly', () => {
  function getEffectivePaymentStatus(rawPaymentStatus, sessionStatus) {
    if (sessionStatus === "rejected") return "declined";
    if (sessionStatus === "cancelled") {
      return rawPaymentStatus === "verified" ? "refunded" : "cancelled";
    }
    if (sessionStatus === "approved" && (!rawPaymentStatus || rawPaymentStatus === "awaiting_approval")) {
      return "unpaid";
    }
    return rawPaymentStatus || "unpaid";
  }

  // Stale awaiting_approval on rejected booking must resolve to declined
  assert.equal(getEffectivePaymentStatus("awaiting_approval", "rejected"), "declined");
  
  // Stale awaiting_approval on cancelled booking must resolve to cancelled
  assert.equal(getEffectivePaymentStatus("awaiting_approval", "cancelled"), "cancelled");

  // Approved booking with awaiting_approval resolves to unpaid (ready for payment)
  assert.equal(getEffectivePaymentStatus("awaiting_approval", "approved"), "unpaid");

  // Paid booking that gets cancelled resolves to refunded
  assert.equal(getEffectivePaymentStatus("verified", "cancelled"), "refunded");

  // Active verified booking remains verified
  assert.equal(getEffectivePaymentStatus("verified", "accepted"), "verified");
  assert.equal(getEffectivePaymentStatus("verified", "completed"), "verified");
});

