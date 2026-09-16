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
