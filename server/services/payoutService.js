const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const User = require("../Backend Configuration/Models/UserSchema/user");
const { recordActivity } = require("../Utils/activityLogger");

/**
 * Single source of truth for Payout State classification:
 * - not_payable: payment not paid, cancelled/declined bookings, free sessions, or refunded
 * - refund_due: paid/confirmed/verified but cancelled/rejected (awaiting learner refund)
 * - in_escrow: paid/confirmed/verified but session not completed yet
 * - pending_settlement: paid/confirmed/verified AND status completed AND payoutStatus not paid
 * - settled: payoutStatus is paid
 */
function getPayoutState(b) {
  if (!b) return "not_payable";

  const base = Number(b.baseSessionAmount ?? b.paymentAmount ?? b.payment?.amount ?? 0);
  const isFree = b.paymentMethod === "free" || base === 0 || b.paymentStatus === "not_required";
  const paymentStatus = b.paymentStatus || b.payment?.status || "awaiting_payment";
  const isPaid = ["paid", "confirmed", "verified"].includes(paymentStatus);
  const isCancelled =
    ["cancelled", "rejected", "declined"].includes(b.status) ||
    paymentStatus === "cancelled" ||
    paymentStatus === "refunded";

  if (paymentStatus === "refunded") {
    return "not_payable";
  }

  if (isPaid && isCancelled) {
    return "refund_due";
  }

  if (isFree || !isPaid || isCancelled) {
    return "not_payable";
  }

  // Session is paid and active (not cancelled)
  if (b.status !== "completed") {
    return "in_escrow";
  }

  // Session is paid and completed
  if (
    b.payoutStatus === "paid" ||
    b.payment?.status === "paid_out" ||
    b.paymentStatus === "paid_out"
  ) {
    return "settled";
  }

  return "pending_settlement";
}

/**
 * Calculates money values strictly in integer paise to eliminate floating-point artifacts:
 * - Platform Fee: ₹0 (0% platform fee)
 * - Net Mentor Payout: 100% of base session amount
 */
function calculatePayoutAmounts(b) {
  const base = Number(
    b.baseSessionAmount ??
      b.paymentAmount ??
      b.payment?.amount ??
      (b.grossPaise !== undefined ? b.grossPaise / 100 : 0)
  );
  const isFree =
    b.paymentMethod === "free" ||
    (base === 0 && !b.grossPaise && !b.mentorPayoutPaise) ||
    b.paymentStatus === "not_required";

  if (isFree) {
    return {
      grossPaise: 0,
      mentorFeePaise: 0,
      mentorPayoutPaise: 0,
      gross: 0,
      platformFee: 0,
      net: 0,
      isLegacy: false,
    };
  }

  let grossPaise;
  let mentorFeePaise;
  let mentorPayoutPaise;
  const isLegacy = b.paymentStatus === "verified" || (!b.razorpayPaymentId && !b.grossPaise);

  const legacyPayout = b.mentorEarnings ?? b.mentorPayout ?? b.payment?.mentorPayout;

  if (b.mentorPayoutPaise !== undefined && b.mentorFeePaise !== undefined) {
    grossPaise = b.grossPaise !== undefined ? b.grossPaise : Math.round(base * 100);
    mentorFeePaise = b.mentorFeePaise;
    mentorPayoutPaise = b.mentorPayoutPaise;
  } else if (legacyPayout !== undefined && Number(legacyPayout) > 0 && isLegacy) {
    // Preserve legacy float records (e.g. ₹22.89) rounded cleanly via paise
    mentorPayoutPaise = Math.round(Number(legacyPayout) * 100);
    const basePaise = Math.round(base * 100);
    grossPaise = basePaise;
    mentorFeePaise = Math.max(0, basePaise - mentorPayoutPaise);
  } else {
    // Canonical calculation: base minus 3% fee in paise
    const basePaise = Math.round(base * 100);
    grossPaise = basePaise;
    mentorFeePaise = 0;
    mentorPayoutPaise = basePaise - mentorFeePaise;
  }

  return {
    grossPaise,
    mentorFeePaise,
    mentorPayoutPaise,
    gross: grossPaise / 100,
    platformFee: mentorFeePaise / 100,
    net: mentorPayoutPaise / 100,
    isLegacy,
  };
}

/**
 * Admin: Get eligible pending mentor payouts grouped by mentor
 */
async function getPendingPayoutsGroupedByMentor() {
  const bookings = await Booking.find({
    status: "completed",
    $or: [
      { paymentStatus: { $in: ["paid", "confirmed", "verified"] } },
      { "payment.status": { $in: ["paid", "confirmed", "verified"] } },
    ],
    payoutStatus: { $ne: "paid" },
    paymentMethod: { $ne: "free" },
  })
    .populate("mentor", "name email avatarUrl payoutUpiId")
    .populate("learner", "name email avatarUrl")
    .sort({ updatedAt: -1 })
    .lean();

  const eligibleBookings = bookings.filter((b) => getPayoutState(b) === "pending_settlement");

  // Group by mentor ID
  const groupedMap = new Map();

  for (const b of eligibleBookings) {
    const mentorId = String(b.mentor?._id || b.mentor);
    if (!groupedMap.has(mentorId)) {
      const mentorObj = b.mentor || {};
      groupedMap.set(mentorId, {
        mentorId,
        mentorName: mentorObj.name || "Mentor",
        mentorEmail: mentorObj.email || "",
        mentorAvatar: mentorObj.avatarUrl || "",
        payoutUpiId: mentorObj.payoutUpiId || "",
        hasUpiId: Boolean(mentorObj.payoutUpiId && mentorObj.payoutUpiId.trim()),
        sessionsCount: 0,
        grossPaiseTotal: 0,
        feePaiseTotal: 0,
        netPayoutPaiseTotal: 0,
        sessions: [],
      });
    }

    const mentorGroup = groupedMap.get(mentorId);
    const money = calculatePayoutAmounts(b);

    mentorGroup.sessionsCount += 1;
    mentorGroup.grossPaiseTotal += money.grossPaise;
    mentorGroup.feePaiseTotal += money.mentorFeePaise;
    mentorGroup.netPayoutPaiseTotal += money.mentorPayoutPaise;

    mentorGroup.sessions.push({
      bookingId: b._id,
      learnerName: b.learner?.name || "Learner",
      learnerEmail: b.learner?.email || "",
      date: b.date || "—",
      time: b.time || "—",
      duration: b.duration || 60,
      grossAmount: money.gross,
      platformFee: money.platformFee,
      netAmount: money.net,
      isLegacy: money.isLegacy,
      paymentMethod: b.paymentMethod || "razorpay",
      razorpayPaymentId: b.razorpayPaymentId || b.payment?.razorpayPaymentId || "",
    });
  }

  // Convert paise totals to rupees for response
  const result = Array.from(groupedMap.values()).map((g) => ({
    ...g,
    grossTotal: g.grossPaiseTotal / 100,
    feeTotal: g.feePaiseTotal / 100,
    netPayoutTotal: g.netPayoutPaiseTotal / 100,
  }));

  return result;
}

/**
 * Admin: Atomically and idempotently settle mentor payouts
 */
async function settleMentorPayouts({ bookingIds, reference, note, adminId }) {
  if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
    const err = new Error("bookingIds must be a non-empty array.");
    err.statusCode = 400;
    throw err;
  }

  const cleanRef = String(reference || "").trim();
  if (!cleanRef || cleanRef.length < 8 || cleanRef.length > 30) {
    const err = new Error("Payout reference is required and must be between 8 and 30 characters.");
    err.statusCode = 400;
    throw err;
  }

  if (!/^[\w.-]+$/.test(cleanRef)) {
    const err = new Error("Payout reference must contain only letters, numbers, hyphens, underscores, or periods.");
    err.statusCode = 400;
    throw err;
  }

  // Ensure unique reference
  const existingWithRef = await Booking.findOne({
    $or: [{ payoutReference: cleanRef }, { "payment.payoutRef": cleanRef }],
  }).select("_id");

  if (existingWithRef) {
    const err = new Error(`Payout reference '${cleanRef}' has already been used. Payout references must be unique.`);
    err.statusCode = 409;
    throw err;
  }

  // Verify eligible bookings
  const bookings = await Booking.find({
    _id: { $in: bookingIds },
  }).populate("mentor", "name email payoutUpiId");

  if (bookings.length === 0) {
    const err = new Error("No matching bookings found.");
    err.statusCode = 404;
    throw err;
  }

  // Check that every booking is in pending_settlement state
  const ineligible = bookings.filter((b) => getPayoutState(b) !== "pending_settlement");
  if (ineligible.length > 0) {
    const err = new Error(
      `Cannot settle: ${ineligible.length} booking(s) are not eligible for settlement (must be paid, completed, and not yet settled).`
    );
    err.statusCode = 400;
    throw err;
  }

  // Verify all belong to the same mentor
  const mentorIds = new Set(bookings.map((b) => String(b.mentor?._id || b.mentor)));
  if (mentorIds.size > 1) {
    const err = new Error("All bookings in a single payout settlement must belong to the same mentor.");
    err.statusCode = 400;
    throw err;
  }

  const validBookingIds = bookings.map((b) => b._id);
  const now = new Date();

  // Atomic conditional updateMany: only update where payoutStatus is NOT 'paid'
  const updateRes = await Booking.updateMany(
    {
      _id: { $in: validBookingIds },
      status: "completed",
      paymentStatus: { $in: ["paid", "confirmed", "verified"] },
      payoutStatus: { $ne: "paid" },
    },
    {
      $set: {
        payoutStatus: "paid",
        payoutReference: cleanRef,
        payoutNote: String(note || "").trim(),
        payoutAt: now,
        settledBy: adminId,
        "payment.payoutRef": cleanRef,
        "payment.status": "paid_out",
      },
    }
  );

  if (updateRes.modifiedCount === 0) {
    const err = new Error("Settlement failed: Bookings may have already been settled concurrently.");
    err.statusCode = 409;
    throw err;
  }

  // Calculate settled totals
  let totalNetPaise = 0;
  bookings.forEach((b) => {
    const money = calculatePayoutAmounts(b);
    totalNetPaise += money.mentorPayoutPaise;
  });
  const totalNet = totalNetPaise / 100;

  // Record audit log
  recordActivity({
    actor: adminId,
    action: "payout.settled",
    entityType: "Payout",
    entityId: bookings[0]._id,
    metadata: {
      reference: cleanRef,
      bookingIds: validBookingIds,
      settledSessionsCount: updateRes.modifiedCount,
      totalSettledAmount: totalNet,
      mentorId: Array.from(mentorIds)[0],
    },
  });

  return {
    success: true,
    message: `Successfully settled ₹${totalNet.toLocaleString("en-IN")} across ${updateRes.modifiedCount} session(s).`,
    reference: cleanRef,
    settledCount: updateRes.modifiedCount,
    totalAmount: totalNet,
    settledAt: now,
  };
}

/**
 * Admin: Get Payout History with search and date filters
 */
async function getPayoutHistory({ search, startDate, endDate, page = 1, limit = 20 }) {
  const query = {
    $or: [{ payoutStatus: "paid" }, { "payment.status": "paid_out" }],
  };

  if (startDate || endDate) {
    query.payoutAt = {};
    if (startDate) query.payoutAt.$gte = new Date(startDate);
    if (endDate) query.payoutAt.$lte = new Date(endDate);
  }

  let bookings = await Booking.find(query)
    .populate("mentor", "name email payoutUpiId")
    .populate("learner", "name email")
    .populate("settledBy", "name email")
    .sort({ payoutAt: -1, updatedAt: -1 })
    .lean();

  if (search && search.trim()) {
    const term = search.trim().toLowerCase();
    bookings = bookings.filter((b) => {
      const mName = b.mentor?.name?.toLowerCase() || "";
      const mEmail = b.mentor?.email?.toLowerCase() || "";
      const lName = b.learner?.name?.toLowerCase() || "";
      const lEmail = b.learner?.email?.toLowerCase() || "";
      const ref = (b.payoutReference || b.payment?.payoutRef || "").toLowerCase();
      const bId = String(b._id).toLowerCase();
      return (
        mName.includes(term) ||
        mEmail.includes(term) ||
        lName.includes(term) ||
        lEmail.includes(term) ||
        ref.includes(term) ||
        bId.includes(term)
      );
    });
  }

  const total = bookings.length;
  const paginated = bookings.slice((page - 1) * limit, page * limit);

  const history = paginated.map((b) => {
    const money = calculatePayoutAmounts(b);
    return {
      bookingId: b._id,
      sessionDate: b.date,
      sessionTime: b.time,
      mentorName: b.mentor?.name || "Mentor",
      mentorEmail: b.mentor?.email || "",
      mentorUpiId: b.mentor?.payoutUpiId || "",
      learnerName: b.learner?.name || "Learner",
      learnerEmail: b.learner?.email || "",
      grossAmount: money.gross,
      platformFee: money.platformFee,
      netAmount: money.net,
      payoutReference: b.payoutReference || b.payment?.payoutRef || "—",
      payoutNote: b.payoutNote || "",
      payoutAt: b.payoutAt || b.updatedAt,
      settledByName: b.settledBy?.name || "Administrator",
      settledByEmail: b.settledBy?.email || "",
    };
  });

  return {
    history,
    pagination: {
      page,
      limit,
      total,
      pages: Math.max(Math.ceil(total / limit), 1),
    },
  };
}

/**
 * Admin: Get bookings with refund_due or refunded status
 */
async function getRefundsList() {
  const bookings = await Booking.find({
    $or: [
      { status: { $in: ["cancelled", "rejected", "declined"] } },
      { paymentStatus: { $in: ["refunded", "cancelled"] } },
      { "payment.status": { $in: ["refunded", "cancelled"] } },
    ],
  })
    .populate("learner", "name email")
    .populate("mentor", "name email")
    .populate("refundedBy", "name email")
    .sort({ updatedAt: -1 })
    .lean();

  const refundItems = [];

  for (const b of bookings) {
    const state = getPayoutState(b);
    const isRefunded = b.paymentStatus === "refunded" || b.payment?.status === "refunded";

    if (state === "refund_due" || isRefunded) {
      const amt = Number(b.paymentAmount || b.baseSessionAmount || b.grossAmountWithGst || b.totalAmountPaid || 0);
      const rzpPaymentId = b.razorpayPaymentId || b.payment?.razorpayPaymentId || "";
      const canCallRazorpay = Boolean(rzpPaymentId && rzpPaymentId.startsWith("pay_"));

      refundItems.push({
        bookingId: b._id,
        learnerName: b.learner?.name || "Learner",
        learnerEmail: b.learner?.email || "",
        mentorName: b.mentor?.name || "Mentor",
        date: b.date,
        time: b.time,
        status: b.status,
        amount: amt,
        razorpayPaymentId: rzpPaymentId || "—",
        canCallRazorpay,
        isRefunded,
        refundId: b.refundId || "—",
        refundedAt: b.refundedAt || null,
        refundedByName: b.refundedBy?.name || "",
        cancellationReason: b.cancellationReason || b.payment?.refundReason || "Cancelled session",
      });
    }
  }

  return refundItems;
}

/**
 * Admin: Process Razorpay refund or record manual refund
 */
async function processRazorpayRefund({ bookingId, adminId, note }) {
  const booking = await Booking.findById(bookingId).populate("learner", "name email");

  if (!booking) {
    const err = new Error("Booking not found.");
    err.statusCode = 404;
    throw err;
  }

  if (booking.paymentStatus === "refunded") {
    const err = new Error("This booking has already been refunded.");
    err.statusCode = 400;
    throw err;
  }

  const rzpPaymentId = booking.razorpayPaymentId || booking.payment?.razorpayPaymentId || "";
  const refundAmountRupees = Number(
    booking.paymentAmount || booking.baseSessionAmount || booking.grossAmountWithGst || booking.totalAmountPaid || 0
  );

  const now = new Date();

  // If Razorpay payment ID exists, trigger Razorpay refund API
  if (rzpPaymentId && rzpPaymentId.startsWith("pay_")) {
    const Razorpay = require("razorpay");
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      const err = new Error("Razorpay credentials not configured on the server.");
      err.statusCode = 500;
      throw err;
    }

    const razorpay = new Razorpay({ key_id, key_secret });
    const refundPaise = Math.round(refundAmountRupees * 100);

    const rzpRefund = await razorpay.payments.refund(rzpPaymentId, {
      amount: refundPaise,
      notes: {
        bookingId: String(booking._id),
        refundedBy: String(adminId),
        note: String(note || "Admin approved refund").slice(0, 100),
      },
    });

    booking.paymentStatus = "refunded";
    booking.refundId = rzpRefund.id;
    booking.refundAmount = refundAmountRupees;
    booking.refundedAt = now;
    booking.refundedBy = adminId;
    if (booking.payment) {
      booking.payment.status = "refunded";
      booking.payment.refundReason = note || "Refunded via Razorpay";
    }
  } else {
    // Legacy booking without Razorpay ID: mark as manually refunded
    booking.paymentStatus = "refunded";
    booking.refundId = `MANUAL_REFUND_${Date.now()}`;
    booking.refundAmount = refundAmountRupees;
    booking.refundedAt = now;
    booking.refundedBy = adminId;
    if (booking.payment) {
      booking.payment.status = "refunded";
      booking.payment.refundReason = note || "Manual bank refund processed by admin";
    }
  }

  await booking.save();

  recordActivity({
    actor: adminId,
    action: "booking.refunded",
    entityType: "Booking",
    entityId: booking._id,
    metadata: {
      refundId: booking.refundId,
      amount: refundAmountRupees,
      learnerEmail: booking.learner?.email,
    },
  });

  return {
    success: true,
    message: `Refund of ₹${refundAmountRupees.toLocaleString("en-IN")} recorded successfully.`,
    refundId: booking.refundId,
    refundedAt: now,
  };
}

/**
 * Single source of truth for global Admin Payment Stats:
 * Total Collected counts only paid sessions that are not cancelled and not refunded.
 */
async function getAdminPaymentStats() {
  const allBookings = await Booking.find().select(
    "status paymentStatus payment.status payment.amount baseSessionAmount paymentAmount grossAmountWithGst razorpayPaymentId payoutStatus paymentMethod"
  ).lean();

  let totalCollectedPaise = 0;
  let paidCount = 0;
  let awaitingCount = 0;
  let failedCount = 0;
  let refundsDueCount = 0;
  let pendingPayoutsCount = 0;
  let settledPayoutsCount = 0;

  for (const b of allBookings) {
    const state = getPayoutState(b);
    const amt = Number(b.paymentAmount || b.baseSessionAmount || b.payment?.amount || 0);

    if (state === "refund_due") {
      refundsDueCount++;
    } else if (state === "pending_settlement") {
      pendingPayoutsCount++;
    } else if (state === "settled") {
      settledPayoutsCount++;
    }

    const rawPaymentStatus = b.paymentStatus || b.payment?.status || "";
    const isPaid = ["paid", "confirmed", "verified"].includes(rawPaymentStatus);
    const isCancelled = ["cancelled", "rejected", "declined"].includes(b.status) || rawPaymentStatus === "cancelled";
    const isRefunded = rawPaymentStatus === "refunded";

    // Total Collected: paid sessions that are NOT cancelled and NOT refunded
    if (isPaid && !isCancelled && !isRefunded && amt > 0) {
      paidCount++;
      totalCollectedPaise += Math.round(amt * 100);
    } else if (
      rawPaymentStatus === "awaiting_payment" &&
      !["completed", "cancelled", "rejected"].includes(b.status)
    ) {
      awaitingCount++;
    } else if (rawPaymentStatus === "failed") {
      failedCount++;
    }
  }

  return {
    totalCollected: totalCollectedPaise / 100,
    paidCount,
    awaitingCount,
    failedCount,
    refundsDueCount,
    pendingPayoutsCount,
    settledPayoutsCount,
  };
}

/**
 * Single source of truth for Mentor Earnings Summary & History
 */
async function getMentorEarningsSummary(mentorId) {
  const bookings = await Booking.find({ mentor: mentorId })
    .populate("learner", "name email")
    .sort({ createdAt: -1 })
    .lean();

  const currentMonthPrefix = new Date().toISOString().slice(0, 7);

  let settledPayoutsPaise = 0;
  let pendingSettlementPaise = 0;
  let inEscrowPaise = 0;
  let thisMonthPaise = 0;

  const history = [];

  for (const b of bookings) {
    const state = getPayoutState(b);
    const money = calculatePayoutAmounts(b);

    if (state === "settled") {
      settledPayoutsPaise += money.mentorPayoutPaise;
      if (b.date && b.date.startsWith(currentMonthPrefix)) {
        thisMonthPaise += money.mentorPayoutPaise;
      }
    } else if (state === "pending_settlement") {
      pendingSettlementPaise += money.mentorPayoutPaise;
      if (b.date && b.date.startsWith(currentMonthPrefix)) {
        thisMonthPaise += money.mentorPayoutPaise;
      }
    } else if (state === "in_escrow") {
      inEscrowPaise += money.mentorPayoutPaise;
    }

    let statusLabel = "Not Payable";
    if (state === "settled") statusLabel = "Settled";
    else if (state === "pending_settlement") statusLabel = "Pending Settlement";
    else if (state === "in_escrow") statusLabel = "In Escrow";
    else if (state === "refund_due") statusLabel = "Refund Due";
    else if (b.paymentMethod === "free" || money.gross === 0) statusLabel = "Free Session";
    else if (b.status === "cancelled") statusLabel = "Cancelled";
    else if (b.status === "rejected") statusLabel = "Declined";
    else if (b.paymentStatus === "unpaid") statusLabel = "Unpaid";

    history.push({
      bookingId: b._id,
      date: b.date || "—",
      time: b.time || "—",
      duration: b.duration || 60,
      learnerName: b.learner?.name || "Learner",
      learnerEmail: b.learner?.email || "",
      grossFee: money.gross,
      platformFee: money.platformFee,
      netAmount: money.net,
      state,
      status: statusLabel,
      isCredited: state === "settled",
      isLegacy: money.isLegacy,
      paymentMethod: b.paymentMethod || "razorpay",
      payoutReference: b.payoutReference || b.payment?.payoutRef || "",
    });
  }

  const settledPayouts = settledPayoutsPaise / 100;
  const pendingSettlement = pendingSettlementPaise / 100;
  const lifetimeRevenue = (settledPayoutsPaise + pendingSettlementPaise) / 100;
  const inEscrow = inEscrowPaise / 100;
  const thisMonthEarnings = thisMonthPaise / 100;

  // Filter counts for mentor Session Payout History
  const counts = {
    all: history.length,
    settled: history.filter((i) => i.state === "settled").length,
    pending: history.filter((i) => i.state === "pending_settlement").length,
    in_escrow: history.filter((i) => i.state === "in_escrow").length,
    not_payable: history.filter((i) => i.state === "not_payable" || i.state === "refund_due").length,
  };

  return {
    lifetimeRevenue,
    settledPayouts,
    pendingSettlement,
    inEscrow,
    thisMonthEarnings,
    counts,
    history,
  };
}

module.exports = {
  getPayoutState,
  calculatePayoutAmounts,
  getPendingPayoutsGroupedByMentor,
  settleMentorPayouts,
  getPayoutHistory,
  getRefundsList,
  processRazorpayRefund,
  getAdminPaymentStats,
  getMentorEarningsSummary,
};
