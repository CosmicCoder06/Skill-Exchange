/**
 * Client service to query the Matcher API (/api/matches)
 */

export async function fetchMatches({
  api = import.meta.env?.VITE_API_URL || "/api",
  token,
  skill = "",
  minRating = "",
  maxPrice = "",
  availableOnly = false,
  timing = "",
  refresh = false,
  page = 1,
  limit = 10,
  request = fetch
} = {}) {
  if (!token) {
    throw new Error("Please sign in to find matching mentors.");
  }

  const query = new URLSearchParams();
  if (skill?.trim()) query.set("skill", skill.trim());
  if (minRating) query.set("minRating", String(minRating));
  if (maxPrice !== "" && maxPrice !== null && !isNaN(maxPrice)) query.set("maxPrice", String(maxPrice));
  if (availableOnly) query.set("availableOnly", "true");
  if (timing && timing !== "Any") query.set("timing", timing.trim());
  if (refresh) query.set("refresh", "true");
  if (page) query.set("page", String(page));
  if (limit) query.set("limit", String(limit));

  const url = `${api}/matches?${query.toString()}`;
  const response = await request(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

  if (response.status === 429) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Rate limit reached. Please wait a moment before refreshing matches.");
  }

  if (response.status === 401) {
    throw new Error("Your session has expired. Please sign in again.");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Unable to load mentor matches. Please try again.");
  }

  return response.json();
}
