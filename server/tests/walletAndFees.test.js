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

test('dual-balance wallet rules: top-up-first deduction and earned-balance-only withdrawals', () => {
  // Scenario: Learner has both topupBalance and earnedBalance
  const roundToTwo = (num) => Math.round((Number(num) + Number.EPSILON) * 100) / 100;

  let wallet = {
    earnedBalance: 300,
    topupBalance: 500,
    balance: 800
  };

  // 1. Top-up: adds directly to topupBalance
  const topupAmount = 200;
  wallet.topupBalance = roundToTwo(wallet.topupBalance + topupAmount);
  wallet.balance = roundToTwo(wallet.earnedBalance + wallet.topupBalance);
  assert.equal(wallet.topupBalance, 700);
  assert.equal(wallet.earnedBalance, 300);
  assert.equal(wallet.balance, 1000);

  // 2. Paying for a session of ₹800: deducts from topupBalance first, then earnedBalance
  const sessionCost = 800;
  let remaining = sessionCost;
  const deductTopup = Math.min(wallet.topupBalance, remaining);
  wallet.topupBalance = roundToTwo(wallet.topupBalance - deductTopup);
  remaining = roundToTwo(remaining - deductTopup);
  assert.equal(deductTopup, 700);
  assert.equal(wallet.topupBalance, 0);
  assert.equal(remaining, 100);

  if (remaining > 0) {
    wallet.earnedBalance = roundToTwo(wallet.earnedBalance - remaining);
  }
  wallet.balance = roundToTwo(wallet.earnedBalance + wallet.topupBalance);
  assert.equal(wallet.earnedBalance, 200);
  assert.equal(wallet.balance, 200);

  // 3. Withdrawal validation: can only withdraw up to earnedBalance
  const attemptWithdrawMoreThanEarned = 250;
  const canWithdraw = attemptWithdrawMoreThanEarned <= wallet.earnedBalance;
  assert.equal(canWithdraw, false);

  // 4. Withdrawal of valid amount from earnedBalance
  const validWithdraw = 150;
  assert.equal(validWithdraw <= wallet.earnedBalance, true);
  wallet.earnedBalance = roundToTwo(wallet.earnedBalance - validWithdraw);
  wallet.balance = roundToTwo(wallet.earnedBalance + wallet.topupBalance);
  assert.equal(wallet.earnedBalance, 50);
  assert.equal(wallet.topupBalance, 0);
  assert.equal(wallet.balance, 50);

  // 5. Mentor session earning credited strictly to earnedBalance
  const mentorEarning = 450;
  wallet.earnedBalance = roundToTwo(wallet.earnedBalance + mentorEarning);
  wallet.balance = roundToTwo(wallet.earnedBalance + wallet.topupBalance);
  assert.equal(wallet.earnedBalance, 500);
  assert.equal(wallet.topupBalance, 0);
  assert.equal(wallet.balance, 500);
});

test('computeBalancesFromLedger accurately reconstructs balance from transaction history (fixes ₹0 bug)', async () => {
  const { computeBalancesFromLedger } = require('../Utils/walletHelper');

  // Case 1: The user's exact reported scenario
  // Top-up of +₹500 followed by session payment of -₹23.60
  const userLedger = [
    {
      type: 'topup',
      amount: 500,
      createdAt: new Date('2026-09-18T10:00:00Z')
    },
    {
      type: 'session_payment',
      amount: -23.6,
      createdAt: new Date('2026-09-18T10:30:00Z')
    }
  ];

  const result1 = await computeBalancesFromLedger(userLedger);
  assert.ok(result1 !== null);
  // Total balance MUST NOT be 0; must be exactly ₹476.40
  assert.equal(result1.balance, 476.4);
  assert.equal(result1.topupBalance, 476.4);
  assert.equal(result1.earnedBalance, 0);

  // Case 2: Full dual-balance ledger lifecycle with earnings, cross-deduction, and withdrawal
  const fullLedger = [
    {
      type: 'topup',
      amount: 500,
      createdAt: new Date('2026-09-18T08:00:00Z')
    },
    {
      type: 'session_payment',
      amount: -23.6,
      createdAt: new Date('2026-09-18T09:00:00Z')
    },
    {
      type: 'session_earning',
      amount: 1144.6,
      createdAt: new Date('2026-09-18T10:00:00Z')
    },
    {
      type: 'session_payment',
      amount: -500, // Debits 476.4 from topup (exhausts it), remaining 23.6 from earnedBalance
      createdAt: new Date('2026-09-18T11:00:00Z')
    },
    {
      type: 'withdrawal',
      amount: -500, // Debits strictly from earnedBalance
      createdAt: new Date('2026-09-18T12:00:00Z')
    }
  ];

  const result2 = await computeBalancesFromLedger(fullLedger);
  assert.ok(result2 !== null);
  assert.equal(result2.topupBalance, 0);
  assert.equal(result2.earnedBalance, 621);
  assert.equal(result2.balance, 621);

  // Case 3: Empty ledger returns null so caller uses defaults
  const emptyResult = await computeBalancesFromLedger([]);
  assert.equal(emptyResult, null);
});


