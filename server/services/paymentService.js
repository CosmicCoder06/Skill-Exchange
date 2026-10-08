const QRCode = require('qrcode');
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
      screenshot: '',
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
 * Generate Platform QR code for Learner
 * upi://pay?pa=<PLATFORM_UPI_ID>&pn=<PLATFORM_NAME>&am=<amount>&cu=INR&tn=<bookingId>
 */
async function generateBookingQR(bookingId, userId, userRole) {
  const booking = await Booking.findById(bookingId).populate('mentor', 'name').populate('learner', 'name');
  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }

  // Authorization: learner of the booking or admin
  const isLearner = String(booking.learner?._id || booking.learner) === String(userId);
  const isAdmin = userRole === 'admin';
  if (!isLearner && !isAdmin) {
    const error = new Error('Unauthorized to access payment QR for this booking');
    error.statusCode = 403;
    throw error;
  }

  if (booking.status === 'completed' || booking.status === 'cancelled') {
    const error = new Error(`Cannot generate payment QR for a ${booking.status} session`);
    error.statusCode = 400;
    throw error;
  }

  const amount = Number(booking.payment?.amount || booking.grossAmountWithGst || booking.paymentAmount || 0);
  const platformUpiId = paymentConfig.getPlatformUpiId();
  const platformName = paymentConfig.getPlatformName();

  // Construct UPI standard link
  const upiString = `upi://pay?pa=${encodeURIComponent(platformUpiId)}&pn=${encodeURIComponent(
    platformName
  )}&am=${amount}&cu=INR&tn=${encodeURIComponent(String(bookingId))}`;

  // Fixed 240x240, white background, margin
  const qrCodeDataUrl = await QRCode.toDataURL(upiString, {
    width: 240,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  });

  return {
    bookingId: booking._id,
    amount,
    platformUpiId,
    platformName,
    mentorName: booking.mentor?.name || 'Mentor',
    paymentStatus: booking.payment?.status || booking.paymentStatus,
    upiString,
    qrCodeDataUrl,
    warning: 'Pay only to this platform QR. Never pay a mentor directly.'
  };
}

/**
 * Learner submits payment proof (UTR + screenshot)
 */
async function submitPayment(bookingId, userId, { utr, screenshot }) {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }

  // Authorization: must be learner of this booking
  if (String(booking.learner) !== String(userId)) {
    const error = new Error('Unauthorized: only the booking learner can submit payment');
    error.statusCode = 403;
    throw error;
  }

  // Reject if session is completed or cancelled
  if (booking.status === 'completed' || booking.status === 'cancelled') {
    const error = new Error(`Cannot submit payment for a ${booking.status} session`);
    error.statusCode = 400;
    throw error;
  }

  // Validate UTR: 12-digit numeric
  const cleanUtr = String(utr || '').trim();
  if (!/^\d{12}$/.test(cleanUtr)) {
    const error = new Error('Invalid UTR: Must be exactly 12 digits');
    error.statusCode = 400;
    throw error;
  }

  // Unique check across whole DB
  const existingWithUtr = await Booking.findOne({
    _id: { $ne: bookingId },
    'payment.utr': cleanUtr
  });
  if (existingWithUtr) {
    const error = new Error('This UTR has already been submitted for another booking');
    error.statusCode = 409;
    throw error;
  }

  // Validate screenshot: mandatory image, max 1MB
  if (!screenshot || typeof screenshot !== 'string') {
    const error = new Error('Payment screenshot is mandatory');
    error.statusCode = 400;
    throw error;
  }

  // Check base64 format and size (~1MB = ~1.4MB base64 string)
  const isDataUrl = /^data:image\/(png|jpeg|jpg|webp);base64,/i.test(screenshot);
  if (!isDataUrl && !/^https?:\/\//i.test(screenshot)) {
    const error = new Error('Screenshot must be a valid PNG, JPEG, or WebP image');
    error.statusCode = 400;
    throw error;
  }
  if (screenshot.length > 1500000) {
    const error = new Error('Screenshot image size exceeds 1MB limit');
    error.statusCode = 400;
    throw error;
  }

  // Update payment status
  const prevStatus = booking.payment?.status || booking.paymentStatus || 'awaiting_payment';
  if (!booking.payment) booking.payment = {};

  booking.payment.utr = cleanUtr;
  booking.payment.screenshot = screenshot;
  booking.payment.status = 'payment_submitted';
  booking.paymentStatus = 'payment_submitted';

  if (!booking.payment.logs) booking.payment.logs = [];
  booking.payment.logs.push({
    by: String(userId),
    from: prevStatus,
    to: 'payment_submitted',
    at: new Date(),
    note: `Learner submitted payment with UTR ${cleanUtr}`
  });

  await booking.save();
  return booking;
}

/**
 * Admin verifies payment (Approve or Reject)
 */
async function verifyPayment(bookingId, adminId, { approve, paytmTxnRef, rejectReason, matchedExact }) {
  const booking = await Booking.findById(bookingId).populate('mentor', 'name email').populate('learner', 'name email');
  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }

  const prevStatus = booking.payment?.status || booking.paymentStatus;
  if (!booking.payment) booking.payment = {};
  if (!booking.payment.logs) booking.payment.logs = [];

  if (approve) {
    // Checkbox mandatory: "Paytm me exact amount aur UTR mila"
    if (!matchedExact) {
      const error = new Error('Verification requires confirming exact amount and UTR match in Paytm Business');
      error.statusCode = 400;
      throw error;
    }

    booking.payment.status = 'confirmed';
    booking.paymentStatus = 'confirmed';
    booking.payment.paytmTxnRef = paytmTxnRef ? String(paytmTxnRef).trim() : '';
    booking.status = 'accepted'; // unlock session and notify mentor

    booking.payment.logs.push({
      by: String(adminId),
      from: prevStatus,
      to: 'confirmed',
      at: new Date(),
      note: `Payment verified by admin. Paytm Ref: ${paytmTxnRef || 'N/A'}`
    });
  } else {
    // Reject requires reason
    const reason = String(rejectReason || '').trim();
    if (!reason) {
      const error = new Error('Rejection reason is mandatory');
      error.statusCode = 400;
      throw error;
    }

    booking.payment.status = 'rejected';
    booking.paymentStatus = 'rejected';
    booking.payment.rejectReason = reason;

    booking.payment.logs.push({
      by: String(adminId),
      from: prevStatus,
      to: 'rejected',
      at: new Date(),
      note: `Payment rejected by admin: ${reason}`
    });
  }

  await booking.save();
  return booking;
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
  generateBookingQR,
  submitPayment,
  verifyPayment,
  markPaidOut,
  refund,
  exportLedgerCsv
};
