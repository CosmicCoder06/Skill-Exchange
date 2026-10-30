function normalizeMeetUrl(value) {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:' || url.hostname !== 'meet.google.com' || url.port || url.username || url.password || !/^\/[a-z]{3}-[a-z]{4}-[a-z]{3}\/?$/.test(url.pathname)) return null;
    return `https://meet.google.com${url.pathname.replace(/\/$/, '')}`;
  } catch { return null; }
}
function withMeeting(booking) {
  const result = typeof booking.toObject === 'function' ? booking.toObject() : { ...booking };
  return { ...result, meetingUrl: result.status === 'accepted' ? normalizeMeetUrl(result.meetingUrl) : null };
}
module.exports = { withMeeting, normalizeMeetUrl };
