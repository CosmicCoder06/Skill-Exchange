const test = require('node:test');
const assert = require('node:assert/strict');
const { paymentDetails } = require('../Utils/manualPayment');
test('existing booking clients remain compatible without payment fields', () => {
 assert.equal(paymentDetails({ hourlyRate: 500 }, {}).paymentStatus, 'unpaid');
 assert.equal(paymentDetails({ hourlyRate: 0 }, {}).paymentStatus, 'not_required');
 assert.throws(() => paymentDetails({ hourlyRate: 500 }, { paymentMethod: 'qr' }), /pricing changed/);
});
test('QR submission stays unverified and uses the server price', () => {
 const result = paymentDetails({ hourlyRate: 500, paymentQr: 'image' }, { quotedAmount:500, paymentMethod:'qr', paymentReference:'123456789012', paymentStatus:'verified', paymentAmount:1 });
 assert.equal(result.paymentStatus,'pending_verification'); assert.equal(result.paymentAmount,500);
 assert.throws(()=>paymentDetails({hourlyRate:500,paymentQr:'image'},{quotedAmount:1,paymentMethod:'qr',paymentReference:'123456789012'}), /pricing changed/);
});
test('QR must exist and transaction reference must be valid',()=>{
 assert.throws(()=>paymentDetails({hourlyRate:100},{quotedAmount:100,paymentMethod:'qr',paymentReference:'123456789012'}),/available/);
 assert.throws(()=>paymentDetails({hourlyRate:100,paymentQr:'image'},{quotedAmount:100,paymentMethod:'qr',paymentReference:''}),/reference/);
});
test('free and deferred payments are never marked verified',()=>{
 assert.equal(paymentDetails({hourlyRate:0},{quotedAmount:0}).paymentStatus,'not_required');
 assert.equal(paymentDetails({hourlyRate:100},{quotedAmount:100,paymentMethod:'pay_later'}).paymentStatus,'unpaid');
});
test('UPI / Card payment accurately verifies and calculates 3% learner convenience fee', () => {
 const result = paymentDetails({ hourlyRate: 10 }, { quotedAmount: 10, paymentMethod: 'upi', paymentReference: 'UPI-TEST-123' }, 60);
 assert.equal(result.paymentStatus, 'verified');
 assert.equal(result.paymentMethod, 'upi');
 assert.equal(result.baseSessionAmount, 10);
 assert.equal(result.gstAmount, 1.8);
 assert.equal(result.grossAmountWithGst, 11.8);
 assert.equal(result.learnerConvenienceFee, 0.35); // 3% of 11.80
 assert.equal(result.totalAmountPaid, 12.15);      // 11.80 + 0.35
 assert.equal(result.mentorPlatformFee, 0.35);    // 3% of 11.80
 assert.equal(result.mentorEarnings, 11.45);       // 11.80 - 0.35
 assert.equal(result.paymentReference, 'UPI-TEST-123');
});
test('Wallet payment accurately verifies with 0% extra convenience fee', () => {
 const result = paymentDetails({ hourlyRate: 10 }, { quotedAmount: 10, paymentMethod: 'wallet' }, 60);
 assert.equal(result.paymentStatus, 'verified');
 assert.equal(result.paymentMethod, 'wallet');
 assert.equal(result.baseSessionAmount, 10);
 assert.equal(result.gstAmount, 1.8);
 assert.equal(result.grossAmountWithGst, 11.8);
 assert.equal(result.learnerConvenienceFee, 0);   // 0% extra
 assert.equal(result.totalAmountPaid, 11.8);      // No extra charge
 assert.equal(result.mentorPlatformFee, 0.35);    // 3% of 11.80
 assert.equal(result.mentorEarnings, 11.45);       // 11.80 - 0.35
});
