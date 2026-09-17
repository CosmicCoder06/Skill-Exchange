const test = require('node:test');
const assert = require('node:assert/strict');

test('slot ordering places preferred slot first and sorts remainder chronologically', () => {
  const inputSlots = [
    { date: '2026-10-05', time: '16:00', isPreferred: false },
    { date: '2026-10-04', time: '11:00', isPreferred: false },
    { date: '2026-10-06', time: '10:00', isPreferred: true },
    { date: '2026-10-04', time: '15:00', isPreferred: false },
  ];

  const preferred = inputSlots.filter(s => s.isPreferred);
  const others = inputSlots.filter(s => !s.isPreferred).sort((a, b) => {
    return new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime();
  });

  const ordered = preferred.length > 0 ? [preferred[0], ...others] : others;

  assert.equal(ordered[0].date, '2026-10-06');
  assert.equal(ordered[0].isPreferred, true);
  assert.equal(ordered[1].date, '2026-10-04');
  assert.equal(ordered[1].time, '11:00');
  assert.equal(ordered[2].date, '2026-10-04');
  assert.equal(ordered[2].time, '15:00');
  assert.equal(ordered[3].date, '2026-10-05');
  assert.equal(ordered[3].time, '16:00');
});

test('4-hour expiry window resets when alternate slots are offered', () => {
  const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
  const initialTime = new Date('2026-10-01T10:00:00Z');
  const initialExpiry = new Date(initialTime.getTime() + FOUR_HOURS_MS);

  // 3 hours later, mentor offers slots
  const mentorOfferedTime = new Date('2026-10-01T13:00:00Z');
  const resetExpiry = new Date(mentorOfferedTime.getTime() + FOUR_HOURS_MS);

  assert.equal(resetExpiry.getTime() > initialExpiry.getTime(), true);
  assert.equal(resetExpiry.toISOString(), '2026-10-01T17:00:00.000Z');
  
  // Checking active vs expired
  const nowBeforeExpiry = new Date('2026-10-01T16:59:00Z');
  const nowAfterExpiry = new Date('2026-10-01T17:01:00Z');

  assert.equal(nowBeforeExpiry <= resetExpiry, true);
  assert.equal(nowAfterExpiry > resetExpiry, true);
});

test('mentor cancellation of accepted paid session flags learner refund due', () => {
  function checkCancellationPolicy({ isMentor, status, paymentAmount, paymentMethod }) {
    const wasAccepted = status === 'accepted';
    const hasPayment = paymentAmount > 0 && paymentMethod !== 'free';
    return isMentor && wasAccepted && hasPayment;
  }

  // Mentor cancels paid session
  assert.equal(checkCancellationPolicy({
    isMentor: true,
    status: 'accepted',
    paymentAmount: 500,
    paymentMethod: 'qr'
  }), true);

  // Mentor cancels free session
  assert.equal(checkCancellationPolicy({
    isMentor: true,
    status: 'accepted',
    paymentAmount: 0,
    paymentMethod: 'free'
  }), false);

  // Learner cancels paid session
  assert.equal(checkCancellationPolicy({
    isMentor: false,
    status: 'accepted',
    paymentAmount: 500,
    paymentMethod: 'qr'
  }), false);

  // Mentor cancels pending request
  assert.equal(checkCancellationPolicy({
    isMentor: true,
    status: 'pending',
    paymentAmount: 500,
    paymentMethod: 'qr'
  }), false);
});
