const User = require("../Backend Configuration/Models/UserSchema/user");

/**
 * Serve user avatar with HTTP caching headers
 * Decodes base64 data URIs into binary streams with Content-Type and Cache-Control
 */
const getUserAvatar = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("avatarUrl name").lean();

    if (!user || !user.avatarUrl) {
      // Default SVG fallback avatar
      const initial = (user?.name || "U").charAt(0).toUpperCase();
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
        <rect width="128" height="128" fill="#e2e8f0"/>
        <text x="64" y="74" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" font-size="52" font-weight="bold" fill="#475569" text-anchor="middle" dominant-baseline="middle">${initial}</text>
      </svg>`;
      res.setHeader("Content-Type", "image/svg+xml");
      res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
      return res.status(200).send(svg);
    }

    const avatar = String(user.avatarUrl).trim();

    // 1. Base64 data URI
    if (avatar.startsWith("data:image/")) {
      const match = avatar.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/s);
      if (match) {
        const contentType = match[1];
        const buffer = Buffer.from(match[2], "base64");
        res.setHeader("Content-Type", contentType);
        res.setHeader("Content-Length", buffer.length);
        res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
        return res.status(200).send(buffer);
      }
    }

    // 2. External HTTP/HTTPS URL
    if (avatar.startsWith("http://") || avatar.startsWith("https://")) {
      return res.redirect(302, avatar);
    }

    return res.status(404).json({ message: "Avatar format not recognized" });
  } catch (error) {
    console.error("getUserAvatar error:", error);
    return res.status(500).json({ message: "Unable to load avatar" });
  }
};

/**
 * Serve user cover image with HTTP caching headers
 */
const getUserCover = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("coverImageUrl").lean();

    if (!user || !user.coverImageUrl) {
      return res.status(404).json({ message: "Cover image not found" });
    }

    const cover = String(user.coverImageUrl).trim();

    // Base64 data URI
    if (cover.startsWith("data:image/")) {
      const match = cover.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/s);
      if (match) {
        const contentType = match[1];
        const buffer = Buffer.from(match[2], "base64");
        res.setHeader("Content-Type", contentType);
        res.setHeader("Content-Length", buffer.length);
        res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
        return res.status(200).send(buffer);
      }
    }

    // External URL
    if (cover.startsWith("http://") || cover.startsWith("https://")) {
      return res.redirect(302, cover);
    }

    return res.status(404).json({ message: "Cover image not found" });
  } catch (error) {
    console.error("getUserCover error:", error);
    return res.status(500).json({ message: "Unable to load cover image" });
  }
};

module.exports = {
  getUserAvatar,
  getUserCover
};
