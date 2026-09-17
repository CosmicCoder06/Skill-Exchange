const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateFees, calculateSessionAmount } = require('../Utils/manualPayment');

test('calculateFees accurately includes 18% GST and calculates 3% mentor fee on GST-inclusive amount', () => {
  // Case 1: The user's exact example: Base fee ₹10
  const smallSession = calculateFees(10, 'wallet');
  assert.equal(smallSession.baseSessionAmount, 10);
  assert.equal(smallSession.gstAmount, 1.8);        // 18% GST
  assert.equal(smallSession.grossAmountWithGst, 11.8); // Session Fee + GST
  assert.equal(smallSession.mentorPlatformFee, 0.35);  // 3% of ₹11.80 = ₹0.35 (NOT ₹0!)
  assert.equal(smallSession.mentorEarnings, 11.45);     // Net payout = ₹11.80 - ₹0.35
  assert.equal(smallSession.learnerConvenienceFee, 0);  // 0% extra for wallet
  assert.equal(smallSession.totalAmountPaid, 11.8);

  // Case 2: Base fee ₹1,000 paid via Wallet
  const walletFees = calculateFees(1000, 'wallet');
  assert.equal(walletFees.baseSessionAmount, 1000);
  assert.equal(walletFees.gstAmount, 180);
  assert.equal(walletFees.grossAmountWithGst, 1180);
  assert.equal(walletFees.learnerConvenienceFee, 0);   // 0% extra fee for learner
  assert.equal(walletFees.mentorPlatformFee, 35.4);    // 3% of 1180
  assert.equal(walletFees.mentorEarnings, 1144.6);     // Net credited to mentor
  assert.equal(walletFees.totalAmountPaid, 1180);      // Learner pays GST-inclusive fee

  // Case 3: Base fee ₹1,000 paid via Direct UPI / Card / QR
  const upiFees = calculateFees(1000, 'qr');
  assert.equal(upiFees.baseSessionAmount, 1000);
  assert.equal(upiFees.gstAmount, 180);
  assert.equal(upiFees.grossAmountWithGst, 1180);
  assert.equal(upiFees.learnerConvenienceFee, 35.4);   // 3% convenience fee paid by learner
  assert.equal(upiFees.mentorPlatformFee, 35.4);       // 3% mentor fee
  assert.equal(upiFees.mentorEarnings, 1144.6);       // Net credited to mentor (IDENTICAL to wallet!)
  assert.equal(upiFees.totalAmountPaid, 1215.4);      // 1180 + 35.4

  // Key Guarantee: Mentor earnings must NOT be affected by learner convenience fee
  assert.equal(walletFees.mentorEarnings, upiFees.mentorEarnings);
});

test('calculateFees handles free sessions gracefully', () => {
  const freeFees = calculateFees(0, 'wallet');
  assert.equal(freeFees.baseSessionAmount, 0);
  assert.equal(freeFees.gstAmount, 0);
  assert.equal(freeFees.grossAmountWithGst, 0);
  assert.equal(freeFees.learnerConvenienceFee, 0);
  assert.equal(freeFees.mentorPlatformFee, 0);
  assert.equal(freeFees.mentorEarnings, 0);
  assert.equal(freeFees.totalAmountPaid, 0);
});

test('wallet balance settlement and topup math with GST', () => {
  let learnerBalance = 0;

  // 1. Learner tops up ₹1,500
  const topupAmount = 1500;
  learnerBalance += topupAmount;
  assert.equal(learnerBalance, 1500);

  // 2. Learner books 45-minute session at ₹800/hr
  const baseSessionAmount = calculateSessionAmount(800, 45); // ₹600 base
  assert.equal(baseSessionAmount, 600);

  const fees = calculateFees(baseSessionAmount, 'wallet');
  // GST 18% of 600 = 108. Total with GST = 708
  assert.equal(fees.gstAmount, 108);
  assert.equal(fees.grossAmountWithGst, 708);
  assert.equal(fees.totalAmountPaid, 708);

  // 3. Check sufficient balance
  assert.equal(learnerBalance >= fees.totalAmountPaid, true);

  // 4. Deduct session fee with GST from learner (no extra convenience fee)
  learnerBalance -= fees.totalAmountPaid;
  assert.equal(learnerBalance, 792);

  // 5. Mentor receives earnings net of 3% platform fee
  let mentorBalance = 0;
  mentorBalance += fees.mentorEarnings;
  assert.equal(fees.mentorPlatformFee, 21.24); // 3% of 708
  assert.equal(fees.mentorEarnings, 686.76);   // 708 - 21.24
  assert.equal(mentorBalance, 686.76);
});
