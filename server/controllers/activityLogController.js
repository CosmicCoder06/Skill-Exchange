const ActivityLog = require("../models/ActivityLog");

const listActivityLogs = async (req, res) => {
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 50, 1), 100);
  const logs = await ActivityLog.find()
    .populate("actor", "name email role")
    .sort({ createdAt: -1 })
    .limit(limit);
  return res.json({ logs });
};

module.exports = { listActivityLogs };
