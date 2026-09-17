function roundToTwo(num) {
  return Math.round((Number(num) + Number.EPSILON) * 100) / 100;
}

function calculateSessionAmount(hourlyRate, durationInMinutes = 60) {
  const rate = Number(hourlyRate) || 0;
  const mins = Number(durationInMinutes) || 60;
  return roundToTwo((rate * mins) / 60);
}

function calculateFees(amount, paymentMethod) {
  const baseSessionAmount = Math.max(0, Number(amount) || 0);
  if (baseSessionAmount === 0) {
    return {
      baseSessionAmount: 0,
      gstAmount: 0,
      grossAmountWithGst: 0,
      mentorPlatformFee: 0,
      mentorEarnings: 0,
      learnerConvenienceFee: 0,
      totalAmountPaid: 0
    };
  }

  // GST is 18% of the base session rate
  const gstAmount = roundToTwo(baseSessionAmount * 0.18);
  // Full fee including GST
  const grossAmountWithGst = roundToTwo(baseSessionAmount + gstAmount);

  // Mentor platform fee is 3% of the full fee (Session Fee + GST)
  const mentorPlatformFee = roundToTwo(grossAmountWithGst * 0.03);
  // Net payout = Full Fee (with GST) - Mentor Platform Fee
  const mentorEarnings = roundToTwo(grossAmountWithGst - mentorPlatformFee);

  // Learner convenience fee: 0 for wallet or free, 3% of full fee (with GST) for UPI/Card/QR/Direct
  const learnerConvenienceFee = (paymentMethod === 'wallet' || paymentMethod === 'free')
    ? 0
    : roundToTwo(grossAmountWithGst * 0.03);
  const totalAmountPaid = roundToTwo(grossAmountWithGst + learnerConvenienceFee);

  return {
    baseSessionAmount,
    gstAmount,
    grossAmountWithGst,
    mentorPlatformFee,
    mentorEarnings,
    learnerConvenienceFee,
    totalAmountPaid
  };
}

function paymentDetails(mentor, body, duration = 60) {
  const durationMins = Number(body?.duration || duration) || 60;
  const baseAmount = calculateSessionAmount(mentor?.hourlyRate, durationMins);
  const fees = calculateFees(baseAmount, body?.paymentMethod || 'pay_later');

  // Existing booking clients or requests created before payment step
  if (body.quotedAmount === undefined && body.paymentMethod === undefined && body.paymentReference === undefined) {
    const isRequest = body.isRequest === true;
    return {
      paymentAmount: baseAmount,
      paymentMethod: baseAmount === 0 ? 'free' : 'pay_later',
      paymentStatus: baseAmount === 0 ? 'not_required' : (isRequest ? 'awaiting_approval' : 'unpaid'),
      paymentReference: '',
      ...fees
    };
  }

  // Wallet payment
  if (body.paymentMethod === 'wallet') {
    if (Number(body.quotedAmount) !== baseAmount && Number(body.quotedAmount) !== fees.grossAmountWithGst) {
      throw new Error('Mentor pricing changed. Refresh and review the amount before booking.');
    }
    const walletFees = calculateFees(baseAmount, 'wallet');
    return {
      paymentAmount: baseAmount,
      paymentMethod: 'wallet',
      paymentStatus: 'verified',
      paymentReference: body.paymentReference || `WALLET-${Date.now()}`,
      ...walletFees
    };
  }

  // Direct UPI / Card payment
  if (body.paymentMethod === 'upi' || body.paymentMethod === 'upi_card' || body.paymentMethod === 'card') {
    const upiFees = calculateFees(baseAmount, 'upi');
    if (
      body.quotedAmount !== undefined &&
      Number(body.quotedAmount) !== baseAmount &&
      Number(body.quotedAmount) !== upiFees.grossAmountWithGst &&
      Number(body.quotedAmount) !== upiFees.totalAmountPaid
    ) {
      throw new Error('Mentor pricing changed. Refresh and review the amount before booking.');
    }
    const reference = typeof body.paymentReference === 'string' && body.paymentReference.trim()
      ? body.paymentReference.trim()
      : `UPI-${Date.now()}`;
    return {
      paymentAmount: baseAmount,
      paymentMethod: body.paymentMethod,
      paymentStatus: 'verified',
      paymentReference: reference,
      ...upiFees
    };
  }

  // For QR payments, verify that the quoted amount matches the mentor's actual dynamic rate
  if (body.paymentMethod === 'qr') {
    if (
      Number(body.quotedAmount) !== baseAmount &&
      Number(body.quotedAmount) !== fees.grossAmountWithGst &&
      Number(body.quotedAmount) !== fees.totalAmountPaid
    ) {
      throw new Error('Mentor pricing changed. Refresh and review the amount before booking.');
    }
    if (!mentor.paymentQr) throw new Error('Choose an available payment option.');
    const reference = typeof body.paymentReference === 'string' ? body.paymentReference.trim() : '';
    if (!/^[A-Za-z0-9-]{6,64}$/.test(reference)) throw new Error('Enter a valid transaction reference (6–64 letters or numbers).');
    const qrFees = calculateFees(baseAmount, 'qr');
    return {
      paymentAmount: baseAmount,
      paymentMethod: 'qr',
      paymentStatus: 'pending_verification',
      paymentReference: reference,
      ...qrFees
    };
  }

  if (baseAmount === 0) return {
    paymentAmount: 0,
    paymentMethod: 'free',
    paymentStatus: 'not_required',
    paymentReference: '',
    baseSessionAmount: 0,
    gstAmount: 0,
    grossAmountWithGst: 0,
    mentorPlatformFee: 0,
    mentorEarnings: 0,
    learnerConvenienceFee: 0,
    totalAmountPaid: 0
  };

  return {
    paymentAmount: baseAmount,
    paymentMethod: 'pay_later',
    paymentStatus: 'unpaid',
    paymentReference: '',
    ...fees
  };
}

module.exports = { paymentDetails, calculateSessionAmount, calculateFees, roundToTwo };

