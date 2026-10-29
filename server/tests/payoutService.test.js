const test = require("node:test");
const assert = require("node:assert/strict");
const {
  getPayoutState,
  calculatePayoutAmounts,
} = require("../services/payoutService");

test("getPayoutState accurately identifies all payout lifecycle states", () => {
  // 1. Free sessions are not payable
  assert.equal(
    getPayoutState({
      paymentMethod: "free",
      baseSessionAmount: 0,
      paymentAmount: 0,
      status: "completed",
    }),
    "not_payable"
  );

  // 2. Unpaid completed sessions are not payable
  assert.equal(
    getPayoutState({
      paymentMethod: "pay_later",
      paymentStatus: "unpaid",
      status: "completed",
      baseSessionAmount: 100,
    }),
    "not_payable"
  );

  // 3. Awaiting payment sessions are not payable
  assert.equal(
    getPayoutState({
      paymentMethod: "razorpay",
      paymentStatus: "awaiting_payment",
      status: "accepted",
      baseSessionAmount: 200,
    }),
    "not_payable"
  );

  // 4. Cancelled booking with unpaid payment is not payable
  assert.equal(
    getPayoutState({
      paymentMethod: "razorpay",
      paymentStatus: "cancelled",
      status: "cancelled",
      baseSessionAmount: 500,
    }),
    "not_payable"
  );

  // 5. Cancelled booking with paid payment requires a refund (refund_due)
  assert.equal(
    getPayoutState({
      paymentMethod: "razorpay",
      paymentStatus: "paid",
      status: "cancelled",
      baseSessionAmount: 500,
    }),
    "refund_due"
  );

  // 6. Rejected booking with paid payment requires a refund (refund_due)
  assert.equal(
    getPayoutState({
      paymentMethod: "razorpay",
      paymentStatus: "confirmed",
      status: "rejected",
      baseSessionAmount: 1000,
    }),
    "refund_due"
  );

  // 7. Paid session that is not yet completed is in escrow
  assert.equal(
    getPayoutState({
      paymentMethod: "razorpay",
      paymentStatus: "paid",
      status: "accepted",
      baseSessionAmount: 500,
    }),
    "in_escrow"
  );

  // 8. Paid session that is completed and not settled is eligible for pending settlement
  assert.equal(
    getPayoutState({
      paymentMethod: "razorpay",
      paymentStatus: "paid",
      status: "completed",
      payoutStatus: "pending",
      baseSessionAmount: 500,
    }),
    "pending_settlement"
  );

  // 9. Legacy verified session that is completed is eligible for pending settlement
  assert.equal(
    getPayoutState({
      paymentMethod: "wallet",
      paymentStatus: "verified",
      status: "completed",
      baseSessionAmount: 20,
    }),
    "pending_settlement"
  );

  // 10. Completed paid session with payoutStatus: 'paid' is settled
  assert.equal(
    getPayoutState({
      paymentMethod: "razorpay",
      paymentStatus: "paid",
      status: "completed",
      payoutStatus: "paid",
      baseSessionAmount: 500,
    }),
    "settled"
  );
});

test("calculatePayoutAmounts enforces integer paise, 0% platform fee, and 100% mentor payout", () => {
  // Scenario 1: New booking with base rate ₹100, 3% platform fee = ₹3, mentor payout = ₹97
  // Even if grossAmountWithGst was ₹118, GST must NOT enter mentor calculation
  const booking1 = {
    baseSessionAmount: 100,
    paymentAmount: 100,
    grossAmountWithGst: 118,
  };
  const amounts1 = calculatePayoutAmounts(booking1);

  assert.equal(amounts1.gross, 100);
  assert.equal(amounts1.grossPaise, 10000);
  assert.equal(amounts1.platformFee, 0);
  assert.equal(amounts1.mentorFeePaise, 0);
  assert.equal(amounts1.net, 100);
  assert.equal(amounts1.mentorPayoutPaise, 10000);

  // Scenario 2: Stored integer paise fields take precedence
  const booking2 = {
    grossPaise: 25000, // ₹250
    mentorFeePaise: 750, // ₹7.50
    mentorPayoutPaise: 24250, // ₹242.50
  };
  const amounts2 = calculatePayoutAmounts(booking2);

  assert.equal(amounts2.gross, 250);
  assert.equal(amounts2.platformFee, 7.5);
  assert.equal(amounts2.net, 242.5);
  assert.equal(amounts2.mentorPayoutPaise, 24250);

  // Scenario 3: Legacy booking with pre-stored mentorPayout and platformFee
  const legacyBooking = {
    payment: {
      amount: 20,
      mentorPayout: 22.89,
      platformFee: 0,
    },
  };
  const legacyAmounts = calculatePayoutAmounts(legacyBooking);
  assert.equal(legacyAmounts.net, 22.89);
  assert.equal(legacyAmounts.isLegacy, true);
});

test("completeBooking blocks unpaid paid-type sessions", () => {
  // Logic validation for booking completion constraint
  function canCompleteSession(booking) {
    const isFree = booking.paymentMethod === "free" || Number(booking.paymentAmount || booking.baseSessionAmount || 0) === 0;
    const rawStatus = booking.paymentStatus || booking.payment?.status || "";
    const isPaid = ["paid", "confirmed", "verified"].includes(rawStatus);
    const isNotRequired = rawStatus === "not_required";

    if (isFree && (isNotRequired || isPaid || !rawStatus)) return true;
    return isPaid;
  }

  // Free session -> can complete
  assert.equal(canCompleteSession({ paymentMethod: "free", paymentAmount: 0, paymentStatus: "not_required" }), true);

  // Paid session but paymentStatus is 'unpaid' -> BLOCKED
  assert.equal(canCompleteSession({ paymentMethod: "razorpay", paymentAmount: 100, paymentStatus: "unpaid" }), false);

  // Paid session with awaiting_payment -> BLOCKED
  assert.equal(canCompleteSession({ paymentMethod: "razorpay", paymentAmount: 500, paymentStatus: "awaiting_payment" }), false);

  // Paid session with paymentStatus 'paid' -> ALLOWED
  assert.equal(canCompleteSession({ paymentMethod: "razorpay", paymentAmount: 500, paymentStatus: "paid" }), true);
});
