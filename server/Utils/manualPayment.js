function paymentDetails(mentor, body) {
  const amount = Number(mentor.hourlyRate) || 0;
  // Existing clients can still request sessions without the new payment form.
  if (body.quotedAmount === undefined && body.paymentMethod === undefined && body.paymentReference === undefined) {
    return { paymentAmount: amount, paymentMethod: amount === 0 ? 'free' : 'pay_later', paymentStatus: amount === 0 ? 'not_required' : 'unpaid', paymentReference: '' };
  }
  // For QR payments, verify that the quoted amount matches the mentor's actual rate
  if (body.paymentMethod === 'qr') {
    if (Number(body.quotedAmount) !== amount) throw new Error('Mentor pricing changed. Refresh and review the amount before booking.');
    if (!mentor.paymentQr) throw new Error('Choose an available payment option.');
    const reference = typeof body.paymentReference === 'string' ? body.paymentReference.trim() : '';
    if (!/^[A-Za-z0-9-]{6,64}$/.test(reference)) throw new Error('Enter a valid transaction reference (6–64 letters or numbers).');
    return { paymentAmount: amount, paymentMethod: 'qr', paymentStatus: 'pending_verification', paymentReference: reference };
  }
  if (amount === 0) return { paymentAmount: 0, paymentMethod: 'free', paymentStatus: 'not_required', paymentReference: '' };
  return { paymentAmount: amount, paymentMethod: 'pay_later', paymentStatus: 'unpaid', paymentReference: '' };
}
module.exports = { paymentDetails };
