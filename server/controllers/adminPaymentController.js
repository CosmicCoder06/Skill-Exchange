const Booking = require('../models/Booking');
const paymentService = require('../services/paymentService');
const paymentConfig = require('../config/paymentConfig');

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
          { "payment.status": { $in: ["paid", "confirmed", "verified"] } }
        ];
      } else if (status === "awaiting") {
        query.$or = [
          { paymentStatus: { $in: ["awaiting_payment", "unpaid", "pending_verification"] } },
          { "payment.status": { $in: ["awaiting_payment"] } }
        ];
        query.status = { $nin: ["completed", "cancelled", "rejected"] };
      } else if (status === "failed") {
        query.$or = [
          { paymentStatus: "failed" },
          { "payment.status": "failed" }
        ];
      } else {
        query.$or = [
          { paymentStatus: status },
          { "payment.status": status }
        ];
      }
    }

    let bookings = await Booking.find(query)
      .populate("learner", "name email avatarUrl")
      .populate("mentor", "name email avatarUrl")
      .sort({ createdAt: -1 })
      .lean();

    // Client search filter across learner, mentor, session id, and razorpay payment id
    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      bookings = bookings.filter(b => {
        const learnerName = b.learner?.name?.toLowerCase() || "";
        const learnerEmail = b.learner?.email?.toLowerCase() || "";
        const mentorName = b.mentor?.name?.toLowerCase() || "";
        const mentorEmail = b.mentor?.email?.toLowerCase() || "";
        const bookingId = String(b._id).toLowerCase();
        const rzpPaymentId = (b.razorpayPaymentId || b.payment?.razorpayPaymentId || "").toLowerCase();
        const rzpOrderId = (b.razorpayOrderId || b.payment?.razorpayOrderId || "").toLowerCase();

        return learnerName.includes(term) ||
          learnerEmail.includes(term) ||
          mentorName.includes(term) ||
          mentorEmail.includes(term) ||
          bookingId.includes(term) ||
          rzpPaymentId.includes(term) ||
          rzpOrderId.includes(term);
      });
    }

    const total = bookings.length;
    const paginated = bookings.slice((page - 1) * limit, page * limit);

    // Global Payment Stats for Admin
    const allBookings = await Booking.find().select("paymentStatus payment.status payment.amount baseSessionAmount paymentAmount grossAmountWithGst razorpayPaymentId status").lean();

    let totalCollected = 0;
    let paidCount = 0;
    let awaitingCount = 0;
    let failedCount = 0;

    for (const b of allBookings) {
      const st = b.payment?.status || b.paymentStatus;
      const amt = Number(b.payment?.amount || b.baseSessionAmount || b.grossAmountWithGst || b.paymentAmount || 0);

      if (["paid", "confirmed", "verified"].includes(st)) {
        paidCount++;
        totalCollected += amt;
      } else if (["awaiting_payment", "unpaid", "pending_verification"].includes(st) && !["completed", "cancelled", "rejected"].includes(b.status)) {
        awaitingCount++;
      } else if (st === "failed") {
        failedCount++;
      }
    }

    return res.json({
      success: true,
      payments: paginated,
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(Math.ceil(total / limit), 1)
      },
      stats: {
        totalCollected: Math.round(totalCollected * 100) / 100,
        paidCount,
        awaitingCount,
        failedCount
      }
    });
  } catch (error) {
    console.error("getAllPayments error:", error);
    return res.status(500).json({ message: error.message || "Failed to fetch platform payments." });
  }
}

/**
 * Get pending payments (legacy backward compatibility)
 */
async function getPendingPayments(req, res) {
  try {
    const bookings = await Booking.find({
      $or: [
        { 'payment.status': 'payment_submitted' },
        { paymentStatus: 'payment_submitted' }
      ]
    })
      .populate('learner', 'name email avatarUrl')
      .populate('mentor', 'name email avatarUrl')
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    console.error('getPendingPayments error:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch pending payments' });
  }
}

/**
 * Admin verifies payment (DEPRECATED: 410 Gone)
 */
async function verifyPayment(req, res) {
  return res.status(410).json({
    success: false,
    message: "Manual payment verification is deprecated. Payments are automatically verified via Razorpay checkout."
  });
}

/**
 * List completed sessions pending mentor payout
 */
async function getPayouts(req, res) {
  try {
    const bookings = await Booking.find({
      status: 'completed',
      $or: [
        { 'payment.status': { $in: ['confirmed', 'paid'] } },
        { paymentStatus: { $in: ['confirmed', 'paid'] } }
      ]
    })
      .populate('mentor', 'name email')
      .populate('learner', 'name email')
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    console.error('getPayouts error:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch payouts' });
  }
}

/**
 * Admin marks a payout as paid out to the mentor
 */
async function markPaidOut(req, res) {
  try {
    const bookingId = req.params.id;
    const adminId = req.user._id || req.user.id;
    const { payoutRef, note } = req.body;

    const updated = await paymentService.markPaidOut(bookingId, adminId, {
      payoutRef,
      note
    });

    res.json({
      success: true,
      message: 'Mentor payout marked as paid out',
      booking: updated
    });
  } catch (error) {
    console.error('markPaidOut error:', error);
    res.status(error.statusCode || 500).json({ message: error.message || 'Failed to mark payout' });
  }
}

/**
 * Admin marks a booking as refunded
 */
async function refundBooking(req, res) {
  try {
    const bookingId = req.params.id;
    const adminId = req.user._id || req.user.id;
    const { reason, ruleKey } = req.body;

    const updated = await paymentService.refund(bookingId, adminId, {
      reason,
      ruleKey
    });

    res.json({
      success: true,
      message: 'Booking marked as refunded',
      booking: updated
    });
  } catch (error) {
    console.error('refundBooking error:', error);
    res.status(error.statusCode || 500).json({ message: error.message || 'Failed to process refund' });
  }
}

/**
 * Export payment ledger as CSV
 */
async function exportLedger(req, res) {
  try {
    const csvData = await paymentService.exportLedgerCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="payment-ledger.csv"');
    res.status(200).send(csvData);
  } catch (error) {
    console.error('exportLedger error:', error);
    res.status(500).json({ message: error.message || 'Failed to export ledger' });
  }
}

module.exports = {
  getAllPayments,
  getPendingPayments,
  verifyPayment,
  getPayouts,
  markPaidOut,
  refundBooking,
  exportLedger
};
