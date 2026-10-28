const Booking = require('../models/Booking');
const User = require('../Backend Configuration/Models/UserSchema/user');
const paymentConfig = require('../config/paymentConfig');

/**
 * Calculate session amount securely on the server
 */
function calculateBookingAmounts(mentorHourlyRate, durationMinutes) {
  const rate = Number(mentorHourlyRate) || 0;
  const duration = Number(durationMinutes) || 60;
  const amount = Math.round((rate * (duration / 60)) * 100) / 100;
  const platformFeePercent = paymentConfig.platformFeePercent;
  const platformFee = Math.round((amount * (platformFeePercent / 100)) * 100) / 100;
  const mentorPayout = Math.max(0, Math.round((amount - platformFee) * 100) / 100);

  return {
    amount,
    platformFeePercent,
    platformFee,
    mentorPayout
  };
}

/**
 * Initialize payment snapshot on booking creation
 */
function createPayment(mentorHourlyRate, durationMinutes) {
  const { amount, platformFeePercent, platformFee, mentorPayout } = calculateBookingAmounts(
    mentorHourlyRate,
    durationMinutes
  );

  const isFree = amount <= 0;
  const initialStatus = isFree ? 'confirmed' : 'awaiting_payment';

  return {
    paymentStatus: initialStatus,
    payment: {
      status: initialStatus,
      amount,
      platformFeePercent,
      platformFee,
      mentorPayout,
      utr: '',
      paytmTxnRef: '',
      rejectReason: '',
      refundReason: '',
      payoutRef: '',
      logs: [
        {
          by: 'system',
          from: '',
          to: initialStatus,
          at: new Date(),
          note: isFree ? 'Free session - auto confirmed' : 'Booking created - awaiting payment'
        }
      ]
    }
  };
}

/**
 * Mark mentor payout completed
 */
async function markPaidOut(bookingId, adminId, { payoutRef, note }) {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }

  const prevStatus = booking.payment?.status || booking.paymentStatus;
  if (!booking.payment) booking.payment = {};
  if (!booking.payment.logs) booking.payment.logs = [];

  booking.payment.status = 'paid_out';
  booking.paymentStatus = 'paid_out';
  booking.payment.payoutRef = payoutRef ? String(payoutRef).trim() : '';

  booking.payment.logs.push({
    by: String(adminId),
    from: prevStatus,
    to: 'paid_out',
    at: new Date(),
    note: note || `Mentor payout marked as paid out. Ref: ${payoutRef || 'N/A'}`
  });

  await booking.save();
  return booking;
}

/**
 * Process refund
 */
async function refund(bookingId, adminId, { reason, ruleKey }) {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }

  const prevStatus = booking.payment?.status || booking.paymentStatus;
  if (!booking.payment) booking.payment = {};
  if (!booking.payment.logs) booking.payment.logs = [];

  const finalReason = reason || (ruleKey && paymentConfig.refundRules[ruleKey]?.description) || 'Session cancelled/refunded';

  booking.payment.status = 'refunded';
  booking.paymentStatus = 'refunded';
  booking.payment.refundReason = finalReason;
  booking.status = 'cancelled';

  booking.payment.logs.push({
    by: String(adminId),
    from: prevStatus,
    to: 'refunded',
    at: new Date(),
    note: `Refund processed by admin: ${finalReason}`
  });

  await booking.save();
  return booking;
}

/**
 * Export ledger as CSV
 */
async function exportLedgerCsv() {
  const bookings = await Booking.find({})
    .populate('learner', 'name email')
    .populate('mentor', 'name email')
    .sort({ createdAt: -1 });

  const headers = [
    'Booking ID',
    'Date',
    'Time',
    'Learner Name',
    'Learner Email',
    'Mentor Name',
    'Mentor Email',
    'Session Amount (INR)',
    'Platform Fee %',
    'Platform Fee (INR)',
    'Mentor Payout (INR)',
    'Payment Status',
    'Booking Status',
    'UTR',
    'Paytm Txn Ref',
    'Payout Ref',
    'Reject/Refund Reason',
    'Created At'
  ];

  const escapeCsv = (val) => {
    const str = String(val ?? '');
    return `"${str.replace(/"/g, '""')}"`;
  };

  const rows = bookings.map((b) => [
    escapeCsv(b._id),
    escapeCsv(b.date),
    escapeCsv(b.time),
    escapeCsv(b.learner?.name || 'N/A'),
    escapeCsv(b.learner?.email || 'N/A'),
    escapeCsv(b.mentor?.name || 'N/A'),
    escapeCsv(b.mentor?.email || 'N/A'),
    escapeCsv(b.payment?.amount || b.grossAmountWithGst || 0),
    escapeCsv(b.payment?.platformFeePercent || paymentConfig.platformFeePercent),
    escapeCsv(b.payment?.platformFee || 0),
    escapeCsv(b.payment?.mentorPayout || 0),
    escapeCsv(b.payment?.status || b.paymentStatus || 'awaiting_payment'),
    escapeCsv(b.status),
    escapeCsv(b.payment?.utr || ''),
    escapeCsv(b.payment?.paytmTxnRef || ''),
    escapeCsv(b.payment?.payoutRef || ''),
    escapeCsv(b.payment?.rejectReason || b.payment?.refundReason || ''),
    escapeCsv(b.createdAt ? new Date(b.createdAt).toISOString() : '')
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

module.exports = {
  calculateBookingAmounts,
  createPayment,
  markPaidOut,
  refund,
  exportLedgerCsv
};
