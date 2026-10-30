export async function loadLiveMentors(api, token, request = fetch) {
  if (!token) throw new Error('Please sign in to find mentors.');
  let currentUserId;
  try { currentUserId = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).id; } catch { /* API validates the token. */ }
  const mentors = [];
  let page = 1;
  let totalPages;
  do {
    const response = await request(`${api}/mentors?limit=50&page=${page}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error(response.status === 401 ? 'Your session expired. Please sign in again.' : 'Unable to load registered mentors. Please try again.');
    const data = await response.json();
    if (!Array.isArray(data.mentors)) throw new Error('Invalid mentor response. Please try again.');
    mentors.push(...data.mentors);
    totalPages = data.totalPages || 1;
    page += 1;
  } while (page <= totalPages);
  return mentors.filter(user => String(user._id) !== String(currentUserId)).map(user => ({
    id: user._id, name: user.name, bio: user.bio || '', skillsTeach: user.skillsToTeach || [],
    availability: Array.isArray(user.availability) ? user.availability.join(' / ') : user.availability || '',
    hourlyRate: Number(user.hourlyRate) || 0, rating: Number.isFinite(user.rating) ? user.rating : 4.5,
    avatar: user.avatarUrl || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48"%3E%3Crect width="48" height="48" fill="%23d7e2da"/%3E%3C/svg%3E',
    title: (user.skillsToTeach || []).slice(0, 2).join(', ') || 'Mentor', company: 'Skill Exchange',
  }));
}
