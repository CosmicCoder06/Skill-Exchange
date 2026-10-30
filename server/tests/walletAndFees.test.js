const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateFees, calculateSessionAmount, calculatePaymentDetails } = require('../Utils/feeCalculator');

test('calculateFees applies 0% platform fee, 0% tax, 0% extra charges with 100% mentor earnings', () => {
  // Case 1: Small session: Base fee ₹10
  const smallSession = calculateFees(10, 'wallet');
  assert.equal(smallSession.baseSessionAmount, 10);
  assert.equal(smallSession.gstAmount, 0);                 // 0% GST
  assert.equal(smallSession.grossAmountWithGst, 10);       // Session Fee only
  assert.equal(smallSession.mentorPlatformFee, 0);         // 0% platform fee
  assert.equal(smallSession.mentorEarnings, 10);           // Mentor receives full session fee
  assert.equal(smallSession.learnerConvenienceFee, 0);     // 0% convenience fee
  assert.equal(smallSession.totalAmountPaid, 10);          // Learner pays session fee only

  // Case 2: Base fee ₹1,000 paid via Wallet
  const walletFees = calculateFees(1000, 'wallet');
  assert.equal(walletFees.baseSessionAmount, 1000);
  assert.equal(walletFees.gstAmount, 0);
  assert.equal(walletFees.grossAmountWithGst, 1000);
  assert.equal(walletFees.learnerConvenienceFee, 0);        // 0% extra fee for learner
  assert.equal(walletFees.mentorPlatformFee, 0);           // 0% platform fee
  assert.equal(walletFees.mentorEarnings, 1000);           // Net credited to mentor: full ₹1,000
  assert.equal(walletFees.totalAmountPaid, 1000);          // Learner pays session fee only

  // Case 3: Base fee ₹1,000 paid via Direct UPI / Card / Razorpay
  const upiFees = calculateFees(1000, 'upi');
  assert.equal(upiFees.baseSessionAmount, 1000);
  assert.equal(upiFees.gstAmount, 0);
  assert.equal(upiFees.grossAmountWithGst, 1000);
  assert.equal(upiFees.learnerConvenienceFee, 0);          // 0% convenience fee
  assert.equal(upiFees.mentorPlatformFee, 0);              // 0% mentor platform fee
  assert.equal(upiFees.mentorEarnings, 1000);              // Full session price to mentor
  assert.equal(upiFees.totalAmountPaid, 1000);             // Exact session price

  // Key Guarantee: Mentor earnings must equal total amount paid across all payment methods
  assert.equal(walletFees.mentorEarnings, upiFees.mentorEarnings);
  assert.equal(walletFees.totalAmountPaid, walletFees.mentorEarnings);
  assert.equal(upiFees.totalAmountPaid, upiFees.mentorEarnings);

  // Case 4: Multiple rates (₹250, ₹500, ₹750)
  [250, 500, 750, 1500].forEach((rate) => {
    const fees = calculateFees(rate, 'razorpay');
    assert.equal(fees.totalAmountPaid, rate);
    assert.equal(fees.mentorEarnings, rate);
    assert.equal(fees.gstAmount, 0);
    assert.equal(fees.mentorPlatformFee, 0);
    assert.equal(fees.learnerConvenienceFee, 0);
  });
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

test('payment API rejects attempts to manipulate session price from frontend', () => {
  const mentor = { hourlyRate: 600 };
  
  // Valid request: session rate for 60 mins is ₹600
  const valid = calculatePaymentDetails(mentor, {
    quotedAmount: 600,
    paymentMethod: 'wallet'
  }, 60);
  assert.equal(valid.totalAmountPaid, 600);
  assert.equal(valid.mentorEarnings, 600);

  // Manipulated request: client attempts to pay ₹100 instead of ₹600
  assert.throws(
    () => calculatePaymentDetails(mentor, {
      quotedAmount: 100,
      paymentMethod: 'wallet'
    }, 60),
    /pricing changed/
  );

  // Manipulated request via UPI/card: client attempts to tamper amount
  assert.throws(
    () => calculatePaymentDetails(mentor, {
      quotedAmount: 200,
      paymentMethod: 'upi',
      paymentReference: 'UPI-TEST-123'
    }, 60),
    /pricing changed/
  );
});

test('wallet balance settlement and topup math with zero fees', () => {
  let learnerBalance = 0;

  // 1. Learner tops up ₹1,500
  const topupAmount = 1500;
  learnerBalance += topupAmount;
  assert.equal(learnerBalance, 1500);

  // 2. Learner books 45-minute session at ₹800/hr
  const baseSessionAmount = calculateSessionAmount(800, 45); // ₹600 base
  assert.equal(baseSessionAmount, 600);

  const fees = calculateFees(baseSessionAmount, 'wallet');
  assert.equal(fees.gstAmount, 0);
  assert.equal(fees.grossAmountWithGst, 600);
  assert.equal(fees.totalAmountPaid, 600);
  assert.equal(fees.mentorPlatformFee, 0);
  assert.equal(fees.mentorEarnings, 600);

  // 3. Check sufficient balance
  assert.equal(learnerBalance >= fees.totalAmountPaid, true);

  // 4. Deduct session fee from learner (no extra tax or convenience fee)
  learnerBalance -= fees.totalAmountPaid;
  assert.equal(learnerBalance, 900); // 1500 - 600 = 900

  // 5. Mentor receives 100% of session earnings (0% platform fee deduction)
  let mentorBalance = 0;
  mentorBalance += fees.mentorEarnings;
  assert.equal(fees.mentorPlatformFee, 0);
  assert.equal(fees.mentorEarnings, 600);
  assert.equal(mentorBalance, 600);
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
