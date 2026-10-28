/**
 * Resolves relative /api media URLs to full backend origin in production environments
 */
export function resolveImageUrl(url) {
  if (!url || typeof url !== "string") return "";
  if (url.startsWith("/api/")) {
    const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    const origin = apiBase.replace(/\/api\/?$/, "");
    return `${origin}${url}`;
  }
  return url;
}
