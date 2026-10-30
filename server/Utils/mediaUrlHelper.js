/**
 * Helper to transform internal base64 user media strings into lightweight endpoint URLs
 */

function sanitizeUserMedia(user) {
  if (!user || typeof user !== "object") return user;

  const copy = Array.isArray(user) ? [...user] : { ...user };
  const userId = copy._id ? copy._id.toString() : null;

  if (userId) {
    if (typeof copy.avatarUrl === "string" && copy.avatarUrl.startsWith("data:image")) {
      copy.avatarUrl = `/api/users/${userId}/avatar`;
    }
    if (typeof copy.coverImageUrl === "string" && copy.coverImageUrl.startsWith("data:image")) {
      copy.coverImageUrl = `/api/users/${userId}/cover`;
    }
  }

  return copy;
}

module.exports = {
  sanitizeUserMedia
};
