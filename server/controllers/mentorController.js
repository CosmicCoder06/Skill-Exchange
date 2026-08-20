const User = require("../Backend Configuration/Models/UserSchema/user");

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const listMentors = async (req, res) => {
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 12, 1), 50);
  const query = { role: "mentor", isActive: true };
  const filters = [];

  if (req.query.skill?.trim()) {
    filters.push({ skillsToTeach: new RegExp(escapeRegex(req.query.skill.trim()), "i") });
  }
  if (req.query.availability?.trim()) {
    filters.push({ availability: new RegExp(escapeRegex(req.query.availability.trim()), "i") });
  }
  if (req.query.q?.trim()) {
    const search = new RegExp(escapeRegex(req.query.q.trim()), "i");
    filters.push({ $or: [{ name: search }, { bio: search }, { skillsToTeach: search }] });
  }
  if (filters.length) query.$and = filters;

  try {
    const [mentors, total] = await Promise.all([
      User.find(query)
        .select("name role bio skillsToTeach availability hourlyRate avatarUrl profileCompleted")
        .sort({ profileCompleted: -1, updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(query),
    ]);
    return res.json({ mentors, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    return res.status(500).json({ message: "Unable to search mentors" });
  }
};

module.exports = { listMentors };
