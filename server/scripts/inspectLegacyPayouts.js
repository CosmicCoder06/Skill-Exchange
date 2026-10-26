/**
 * inspectLegacyPayouts.js
 * 
 * STRICTLY READ-ONLY INSPECTOR SCRIPT.
 * Does NOT modify, update, delete or insert any MongoDB documents.
 * 
 * Inspects all bookings across the database and categorizes:
 * 1. Payout status inconsistencies (e.g. pending payout on unpaid/cancelled bookings)
 * 2. Unpaid completed bookings
 * 3. Legacy manual UTR verified bookings
 * 4. Cancelled/rejected bookings with confirmed payment (refunds due)
 * 5. Full breakdown for tester1 (6aaac3d8b1dc0bda450f164e)
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const User = require("../Backend Configuration/Models/UserSchema/user");
const { getPayoutState, calculatePayoutAmounts } = require("../services/payoutService");

async function runInspection() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/skill_exchange";
  console.log("Connecting (READ-ONLY) to:", uri.replace(/\/\/.*@/, "//***@"));
  await mongoose.connect(uri);

  console.log("\n=======================================================");
  console.log("       SKILL EXCHANGE PAYOUT & BOOKING AUDIT           ");
  console.log("=======================================================\n");

  const allBookings = await Booking.find({})
    .populate("mentor", "name email payoutUpiId")
    .populate("learner", "name email")
    .sort({ createdAt: 1 })
    .lean();

  console.log(`Total Bookings in Database: ${allBookings.length}`);

  // Categorize
  const anomalies = {
    pendingPayoutOnUnpaidOrCancelled: [],
    completedWithUnpaid: [],
    legacyManualVerified: [],
    refundsDue: [],
    activeInEscrow: [],
    eligiblePendingSettlement: [],
    alreadySettled: []
  };

  let totalCollectedPaise = 0;

  for (const b of allBookings) {
    const state = getPayoutState(b);
    const money = calculatePayoutAmounts(b);
    const rawPayment = b.paymentStatus || b.payment?.status || "";
    const isPaid = ["paid", "confirmed", "verified"].includes(rawPayment);
    const isCancelled = ["cancelled", "rejected", "declined"].includes(b.status) || rawPayment === "cancelled";
    const isRefunded = rawPayment === "refunded";

    if (isPaid && !isCancelled && !isRefunded && money.gross > 0) {
      totalCollectedPaise += money.grossPaise;
    }

    if (b.payoutStatus === "pending" && (!isPaid || isCancelled)) {
      anomalies.pendingPayoutOnUnpaidOrCancelled.push({
        id: b._id,
        bookingStatus: b.status,
        paymentStatus: b.paymentStatus,
        mentor: b.mentor?.email,
        amount: money.gross
      });
    }

    if (b.status === "completed" && !isPaid && b.paymentMethod !== "free" && money.gross > 0) {
      anomalies.completedWithUnpaid.push({
        id: b._id,
        bookingStatus: b.status,
        paymentStatus: b.paymentStatus,
        mentor: b.mentor?.email,
        amount: money.gross
      });
    }

    if (b.payment?.manualVerificationStatus === "verified" || b.paymentStatus === "verified" || b.payment?.utrNumber) {
      anomalies.legacyManualVerified.push({
        id: b._id,
        bookingStatus: b.status,
        paymentStatus: b.paymentStatus,
        utr: b.payment?.utrNumber,
        mentor: b.mentor?.email,
        amount: money.gross,
        netPayout: money.net,
        state
      });
    }

    if (state === "refund_due") {
      anomalies.refundsDue.push({
        id: b._id,
        bookingStatus: b.status,
        paymentStatus: b.paymentStatus,
        learner: b.learner?.email,
        amount: money.gross,
        razorpayPaymentId: b.razorpayPaymentId || b.payment?.razorpayPaymentId || "None (Legacy)"
      });
    } else if (state === "in_escrow") {
      anomalies.activeInEscrow.push({
        id: b._id,
        mentor: b.mentor?.email,
        amount: money.gross,
        netPayout: money.net
      });
    } else if (state === "pending_settlement") {
      anomalies.eligiblePendingSettlement.push({
        id: b._id,
        mentor: b.mentor?.email,
        gross: money.gross,
        netPayout: money.net,
        isLegacy: money.isLegacy
      });
    } else if (state === "settled") {
      anomalies.alreadySettled.push({
        id: b._id,
        mentor: b.mentor?.email,
        netPayout: money.net,
        ref: b.payoutReference
      });
    }
  }

  console.log("\n--- SUMMARY OF SYSTEM ANOMALIES & LEGACY RECORDS ---");
  console.log(`1. Pending payout set on unpaid or cancelled: ${anomalies.pendingPayoutOnUnpaidOrCancelled.length}`);
  if (anomalies.pendingPayoutOnUnpaidOrCancelled.length > 0) {
    console.table(anomalies.pendingPayoutOnUnpaidOrCancelled);
  }

  console.log(`\n2. Completed sessions with unpaid payment: ${anomalies.completedWithUnpaid.length}`);
  if (anomalies.completedWithUnpaid.length > 0) {
    console.table(anomalies.completedWithUnpaid);
  }

  console.log(`\n3. Legacy manual UTR verified sessions: ${anomalies.legacyManualVerified.length}`);
  if (anomalies.legacyManualVerified.length > 0) {
    console.table(anomalies.legacyManualVerified);
  }

  console.log(`\n4. Refunds due (Cancelled/rejected with payment paid): ${anomalies.refundsDue.length}`);
  if (anomalies.refundsDue.length > 0) {
    console.table(anomalies.refundsDue);
  }

  console.log(`\n5. Eligible pending payouts: ${anomalies.eligiblePendingSettlement.length}`);
  if (anomalies.eligiblePendingSettlement.length > 0) {
    console.table(anomalies.eligiblePendingSettlement);
  }

  console.log(`\n6. Active in-escrow sessions: ${anomalies.activeInEscrow.length}`);
  console.log(`7. Already settled sessions: ${anomalies.alreadySettled.length}`);
  console.log(`8. Total platform collected: ₹${(totalCollectedPaise / 100).toLocaleString("en-IN")}`);

  // Detailed inspect for tester1
  console.log("\n=======================================================");
  console.log("       DETAILED BREAKDOWN: tester1@gmail.com           ");
  console.log("=======================================================\n");

  const tester1 = await User.findOne({ email: "tester1@gmail.com" }).lean();
  if (!tester1) {
    console.log("tester1@gmail.com not found in User collection.");
  } else {
    console.log(`User ID: ${tester1._id}`);
    console.log(`Registered Payout UPI ID: ${tester1.payoutUpiId || "None"}`);

    const tester1Bookings = allBookings.filter((b) => String(b.mentor?._id) === String(tester1._id));
    console.log(`Total Bookings for tester1: ${tester1Bookings.length}`);

    let settledSum = 0;
    let pendingSum = 0;
    let inEscrowSum = 0;
    const tableData = [];

    tester1Bookings.forEach((b, idx) => {
      const state = getPayoutState(b);
      const money = calculatePayoutAmounts(b);

      if (state === "settled") settledSum += money.mentorPayoutPaise;
      else if (state === "pending_settlement") pendingSum += money.mentorPayoutPaise;
      else if (state === "in_escrow") inEscrowSum += money.mentorPayoutPaise;

      tableData.push({
        "#": idx + 1,
        id: String(b._id).slice(-6),
        status: b.status,
        paymentStatus: b.paymentStatus || b.payment?.status,
        method: b.paymentMethod || "razorpay",
        gross: money.gross,
        fee3Pct: money.platformFee,
        netPayout: money.net,
        state,
        isLegacy: money.isLegacy ? "YES" : "NO"
      });
    });

    console.table(tableData);

    console.log(`\nTester1 Ledger Summary:`);
    console.log(`- Settled Payouts:    ₹${(settledSum / 100).toFixed(2)}`);
    console.log(`- Pending Settlement: ₹${(pendingSum / 100).toFixed(2)}`);
    console.log(`- In Escrow:          ₹${(inEscrowSum / 100).toFixed(2)}`);
    console.log(`- Lifetime Revenue:   ₹${((settledSum + pendingSum) / 100).toFixed(2)}`);
  }

  await mongoose.disconnect();
  console.log("\nAudit inspection complete. Connection closed safely.\n");
}

runInspection().catch((err) => {
  console.error("Inspection error:", err);
  process.exit(1);
});
