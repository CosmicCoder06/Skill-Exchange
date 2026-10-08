const Booking = require('../models/Booking');
const paymentService = require('../services/paymentService');
const paymentConfig = require('../config/paymentConfig');

/**
 * Get all bookings with submitted payments awaiting admin verification
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
      warningNotice: "Paytm for Business app me amount aur UTR match karke hi approve karo. Note field par bharosa mat karo.",
      bookings
    });
  } catch (error) {
    console.error('getPendingPayments error:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch pending payments' });
  }
}

/**
 * Admin verifies payment (Approve with exact match check OR Reject with mandatory reason)
 */
async function verifyPayment(req, res) {
  try {
    const bookingId = req.params.id;
    const adminId = req.user._id || req.user.id;
    const { approve, matchedExact, paytmTxnRef, rejectReason } = req.body;

    const updated = await paymentService.verifyPayment(bookingId, adminId, {
      approve: Boolean(approve),
      matchedExact: Boolean(matchedExact),
      paytmTxnRef,
      rejectReason
    });

    res.json({
      success: true,
      message: approve ? 'Payment verified and session unlocked for mentor' : 'Payment rejected',
      booking: updated
    });
  } catch (error) {
    console.error('verifyPayment error:', error);
    res.status(error.statusCode || 500).json({ message: error.message || 'Verification failed' });
  }
}

/**
 * List completed sessions pending mentor payout
 */
async function getPayouts(req, res) {
  try {
    const bookings = await Booking.find({
      status: 'completed',
      $or: [
        { 'payment.status': 'confirmed' },
        { paymentStatus: 'confirmed' }
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
  getPendingPayments,
  verifyPayment,
  getPayouts,
  markPaidOut,
  refundBooking,
  exportLedger
};
