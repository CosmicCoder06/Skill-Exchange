const Booking = require("../models/Booking");
const paymentService = require("../services/paymentService");
const payoutService = require("../services/payoutService");

/**
 * Get all platform payments with pagination, search, status filters, and summary stats
 */
async function getAllPayments(req, res) {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 100);
    const { status, search } = req.query;

    const query = {};

    if (status && status !== "all") {
      if (status === "paid") {
        query.$or = [
          { paymentStatus: { $in: ["paid", "confirmed", "verified"] } },
          { "payment.status": { $in: ["paid", "confirmed", "verified"] } },
        ];
        query.status = { $ne: "cancelled" };
      } else if (status === "awaiting") {
        query.$or = [
          { paymentStatus: { $in: ["awaiting_payment", "unpaid"] } },
          { "payment.status": { $in: ["awaiting_payment"] } },
        ];
        query.status = { $nin: ["completed", "cancelled", "rejected"] };
      } else if (status === "failed") {
        query.$or = [{ paymentStatus: "failed" }, { "payment.status": "failed" }];
      } else if (status === "refunded") {
        query.$or = [{ paymentStatus: "refunded" }, { "payment.status": "refunded" }];
      } else if (status === "paid_out") {
        query.$or = [{ payoutStatus: "paid" }, { paymentStatus: "paid_out" }, { "payment.status": "paid_out" }];
      } else {
        query.$or = [{ paymentStatus: status }, { "payment.status": status }];
      }
    }

    let bookings = await Booking.find(query)
      .select("-payment.screenshot -payment.logs")
      .populate("learner", "name email avatarUrl")
      .populate("mentor", "name email avatarUrl")
      .sort({ createdAt: -1 })
      .lean();

    // Client search filter across learner, mentor, session id, and razorpay payment id
    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      bookings = bookings.filter((b) => {
        const learnerName = b.learner?.name?.toLowerCase() || "";
        const learnerEmail = b.learner?.email?.toLowerCase() || "";
        const mentorName = b.mentor?.name?.toLowerCase() || "";
        const mentorEmail = b.mentor?.email?.toLowerCase() || "";
        const bookingId = String(b._id).toLowerCase();
        const rzpPaymentId = (b.razorpayPaymentId || b.payment?.razorpayPaymentId || "").toLowerCase();
        const rzpOrderId = (b.razorpayOrderId || b.payment?.razorpayOrderId || "").toLowerCase();

        return (
          learnerName.includes(term) ||
          learnerEmail.includes(term) ||
          mentorName.includes(term) ||
          mentorEmail.includes(term) ||
          bookingId.includes(term) ||
          rzpPaymentId.includes(term) ||
          rzpOrderId.includes(term)
        );
      });
    }

    const total = bookings.length;
    const paginated = bookings.slice((page - 1) * limit, page * limit);

    // Global Payment Stats from shared payoutService
    const stats = await payoutService.getAdminPaymentStats();

    return res.json({
      success: true,
      payments: paginated,
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(Math.ceil(total / limit), 1),
      },
      stats,
    });
  } catch (error) {
    console.error("getAllPayments error:", error);
    return res.status(500).json({ message: error.message || "Failed to fetch platform payments." });
  }
}

/**
 * List completed sessions pending mentor payout (grouped by mentor)
 */
async function getPayouts(req, res) {
  try {
    const mentorGroups = await payoutService.getPendingPayoutsGroupedByMentor();
    const totalPendingCount = mentorGroups.reduce((acc, g) => acc + g.sessionsCount, 0);
    const totalPendingAmount = mentorGroups.reduce((acc, g) => acc + g.netPayoutTotal, 0);

    return res.json({
      success: true,
      count: totalPendingCount,
      totalAmount: totalPendingAmount,
      mentorGroups,
    });
  } catch (error) {
    console.error("getPayouts error:", error);
    return res.status(500).json({ message: error.message || "Failed to fetch payouts" });
  }
}

/**
 * Settle mentor payouts in batch (per mentor or selected sessions)
 */
async function settlePayouts(req, res) {
  try {
    const adminId = req.user?._id || req.user?.id;
    const { bookingIds, reference, note } = req.body;

    const result = await payoutService.settleMentorPayouts({
      bookingIds,
      reference,
      note,
      adminId,
    });

    return res.json({
      success: true,
      message: `Successfully settled ${result.settledCount} session payout(s).`,
      result,
    });
  } catch (error) {
    console.error("settlePayouts error:", error);
    return res.status(error.statusCode || 500).json({ message: error.message || "Failed to settle payouts" });
  }
}

/**
 * View payout history log
 */
async function getPayoutHistory(req, res) {
  try {
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 50, 1), 200);
    const history = await payoutService.getPayoutHistory(limit);

    return res.json({
      success: true,
      count: history.length,
      history,
    });
  } catch (error) {
    console.error("getPayoutHistory error:", error);
    return res.status(500).json({ message: error.message || "Failed to fetch payout history" });
  }
}

/**
 * List sessions eligible for or pending refunds
 */
async function getRefunds(req, res) {
  try {
    const refunds = await payoutService.getRefundEligibleBookings();

    return res.json({
      success: true,
      count: refunds.length,
      refunds,
    });
  } catch (error) {
    console.error("getRefunds error:", error);
    return res.status(500).json({ message: error.message || "Failed to fetch refund candidates" });
  }
}

/**
 * Process a refund (via Razorpay API for online payments, or ledger note for legacy)
 */
async function processRefund(req, res) {
  try {
    const adminId = req.user?._id || req.user?.id;
    const bookingId = req.params.id;
    const { amount, reason } = req.body;

    const result = await payoutService.processRefund({
      bookingId,
      amount,
      reason,
      adminId,
    });

    return res.json({
      success: true,
      message: "Refund processed successfully.",
      result,
    });
  } catch (error) {
    console.error("processRefund error:", error);
    return res.status(error.statusCode || 500).json({ message: error.message || "Failed to process refund" });
  }
}

/**
 * Mark mentor payout manually for a single booking
 */
async function markPaidOut(req, res) {
  try {
    const adminId = req.user?._id || req.user?.id;
    const { id } = req.params;
    const { payoutRef, note } = req.body;

    const booking = await paymentService.markPaidOut(id, adminId, { payoutRef, note });
    res.json({
      success: true,
      message: "Mentor payout marked as completed",
      booking,
    });
  } catch (error) {
    console.error("markPaidOut error:", error);
    res.status(error.statusCode || 500).json({ message: error.message || "Failed to mark paid out" });
  }
}

/**
 * Refund a single booking directly
 */
async function refundBooking(req, res) {
  try {
    const adminId = req.user?._id || req.user?.id;
    const { id } = req.params;
    const { reason, ruleKey } = req.body;

    const booking = await paymentService.refund(id, adminId, { reason, ruleKey });
    res.json({
      success: true,
      message: "Session refunded successfully",
      booking,
    });
  } catch (error) {
    console.error("refundBooking error:", error);
    res.status(error.statusCode || 500).json({ message: error.message || "Failed to refund session" });
  }
}

/**
 * Export complete payment ledger to CSV
 */
async function exportLedger(req, res) {
  try {
    const csvData = await paymentService.exportLedgerCsv();
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="payment-ledger.csv"');
    res.status(200).send(csvData);
  } catch (error) {
    console.error("exportLedger error:", error);
    res.status(500).json({ message: error.message || "Failed to export ledger" });
  }
}

module.exports = {
  getAllPayments,
  getPayouts,
  settlePayouts,
  getPayoutHistory,
  getRefunds,
  processRefund,
  markPaidOut,
  refundBooking,
  exportLedger,
};
