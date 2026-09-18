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

test('completed session reviews assign reviewee symmetrically', () => {
  function getReviewee(currentUserId, booking) {
    const learnerId = booking.learner.toString();
    const mentorId = booking.mentor.toString();
    if (currentUserId !== learnerId && currentUserId !== mentorId) {
      throw new Error("Forbidden");
    }
    return currentUserId === learnerId ? booking.mentor : booking.learner;
  }

  const booking = {
    learner: "user_learner_1",
    mentor: "user_mentor_2",
    status: "completed"
  };

  // Learner reviewing mentor
  assert.equal(getReviewee("user_learner_1", booking), "user_mentor_2");
  // Mentor reviewing learner
  assert.equal(getReviewee("user_mentor_2", booking), "user_learner_1");
  // Unrelated user
  assert.throws(() => getReviewee("user_intruder_3", booking), /Forbidden/);
});

test('booking reviews partitioning accurately separates learner and mentor reviews', () => {
  function partitionReviews(reviews, booking, currentUserId) {
    const learnerId = (booking.learner?._id || booking.learner).toString();
    const mentorId = (booking.mentor?._id || booking.mentor).toString();

    const learnerReview = reviews.find(
      (r) => (r.reviewer?._id || r.reviewer)?.toString() === learnerId
    ) || null;

    const mentorReview = reviews.find(
      (r) => (r.reviewer?._id || r.reviewer)?.toString() === mentorId
    ) || null;

    const myReview = reviews.find(
      (r) => (r.reviewer?._id || r.reviewer)?.toString() === currentUserId
    ) || null;

    return { review: myReview, reviews, learnerReview, mentorReview };
  }

  const booking = {
    _id: "booking_123",
    learner: { _id: "learner_01", name: "Alice" },
    mentor: { _id: "mentor_02", name: "Bob" }
  };

  const sampleLearnerReview = {
    _id: "rev_1",
    reviewer: { _id: "learner_01", name: "Alice" },
    rating: 5,
    comment: "Great session!"
  };

  const sampleMentorReview = {
    _id: "rev_2",
    reviewer: { _id: "mentor_02", name: "Bob" },
    rating: 4,
    comment: "Quick learner and engaged."
  };

  // Case 1: Both reviews exist
  const resBoth = partitionReviews([sampleLearnerReview, sampleMentorReview], booking, "learner_01");
  assert.equal(resBoth.learnerReview._id, "rev_1");
  assert.equal(resBoth.mentorReview._id, "rev_2");
  assert.equal(resBoth.review._id, "rev_1");

  // Case 2: Only learner reviewed
  const resLearnerOnly = partitionReviews([sampleLearnerReview], booking, "mentor_02");
  assert.equal(resLearnerOnly.learnerReview._id, "rev_1");
  assert.equal(resLearnerOnly.mentorReview, null);
  assert.equal(resLearnerOnly.review, null);

  // Case 3: Neither reviewed
  const resNone = partitionReviews([], booking, "learner_01");
  assert.equal(resNone.learnerReview, null);
  assert.equal(resNone.mentorReview, null);
  assert.equal(resNone.review, null);
});

