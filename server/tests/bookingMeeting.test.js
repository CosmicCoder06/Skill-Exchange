const test = require('node:test');
const assert = require('node:assert/strict');
const { withMeeting, normalizeMeetUrl } = require('../Utils/bookingMeeting');
test('only real-format Google Meet links are accepted', () => {
 assert.equal(normalizeMeetUrl('https://meet.google.com/abc-defg-hij?authuser=0'), 'https://meet.google.com/abc-defg-hij');
 for (const value of ['https://meet.jit.si/room', 'https://meet.google.com.evil.com/abc-defg-hij', 'http://meet.google.com/abc-defg-hij', 'https://meet.google.com/new', 'javascript:alert(1)', 'https://user@meet.google.com/abc-defg-hij', null]) assert.equal(normalizeMeetUrl(value), null);
});
test('only accepted sessions expose saved Google Meet links, no generated fake rooms', () => {
 const booking = { _id:'test', status:'accepted', meetingUrl:'https://meet.google.com/abc-defg-hij' };
 assert.equal(withMeeting(booking).meetingUrl, booking.meetingUrl);
 assert.equal(withMeeting({...booking, meetingUrl:''}).meetingUrl, null);
 for(const status of ['pending','cancelled','rejected','completed']) assert.equal(withMeeting({...booking,status}).meetingUrl,null);
});
