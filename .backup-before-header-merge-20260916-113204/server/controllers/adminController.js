const mongoose = require("mongoose");
const User = require("../Backend Configuration/Models/UserSchema/user");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const { escapeRegex, fillDailySeries } = require("../Utils/adminAnalytics");

const SAFE_USER_FIELDS = "name email role isVerified isActive profileCompleted skillsToTeach createdAt updatedAt";
const USER_ROLES = new Set(["learner", "mentor", "admin"]);

async function getOverview(req, res) {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      mentors,
      learners,
      activeUsers,
      verifiedUsers,
      completedProfiles,
      conversations,
      messages,
      newUsers30d,
      activeConversations30d,
      recentUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "mentor" }),
      User.countDocuments({ role: "learner" }),
      User.countDocuments({ isActive: { $ne: false } }),
      User.countDocuments({ isVerified: true }),
      User.countDocuments({ profileCompleted: true }),
      Conversation.countDocuments(),
      Message.countDocuments(),
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Conversation.countDocuments({ lastActivityAt: { $gte: thirtyDaysAgo } }),
      User.find().select(SAFE_USER_FIELDS).sort({ createdAt: -1 }).limit(6).lean(),
    ]);

    return res.json({
      stats: {
        totalUsers,
        mentors,
        learners,
        activeUsers,
        verifiedUsers,
        completedProfiles,
        conversations,
        messages,
        newUsers30d,
        activeConversations30d,
      },
      recentUsers,
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load admin overview" });
  }
}

async function listUsers(req, res) {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 25, 1), 100);
    const query = {};

    if (req.query.search?.trim()) {
      const search = new RegExp(escapeRegex(req.query.search.trim()), "i");
      query.$or = [{ name: search }, { email: search }];
    }
    if (req.query.role && USER_ROLES.has(req.query.role)) query.role = req.query.role;
    if (req.query.status === "active") query.isActive = { $ne: false };
    if (req.query.status === "suspended") query.isActive = false;

    const [users, total] = await Promise.all([
      User.find(query)
        .select(SAFE_USER_FIELDS)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    return res.json({
      users,
      pagination: { page, limit, total, pages: Math.max(Math.ceil(total / limit), 1) },
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load users" });
  }
}

async function updateUser(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const target = await User.findById(id);
    if (!target) return res.status(404).json({ message: "User not found" });

    const updates = {};
    if (req.body.role !== undefined) {
      if (!USER_ROLES.has(req.body.role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      updates.role = req.body.role;
    }
    if (typeof req.body.isVerified === "boolean") updates.isVerified = req.body.isVerified;
    if (typeof req.body.isActive === "boolean") updates.isActive = req.body.isActive;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No supported updates provided" });
    }

    const editingSelf = String(req.user.id) === String(id);
    if (editingSelf && ((updates.role && updates.role !== "admin") || updates.isActive === false)) {
      return res.status(400).json({ message: "You cannot remove your own admin access" });
    }

    const user = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).select(SAFE_USER_FIELDS);

    return res.json({ message: "User updated successfully", user });
  } catch (error) {
    return res.status(500).json({ message: "Unable to update user" });
  }
}

async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    if (String(req.user.id) === String(id)) {
      return res.status(400).json({ message: "You cannot delete your own admin account" });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const conversationIds = await Conversation.find({ participants: id }).distinct("_id");
    await Promise.all([
      Message.deleteMany({
        $or: [{ sender: id }, { conversation: { $in: conversationIds } }],
      }),
      Conversation.deleteMany({ _id: { $in: conversationIds } }),
      User.findByIdAndDelete(id),
    ]);

    return res.json({ message: "User and related chat data deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Unable to delete user" });
  }
}

async function getReports(req, res) {
  try {
    const now = new Date();
    const sixMonthsAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);
    sevenDaysAgo.setUTCHours(0, 0, 0, 0);

    const [roleBreakdown, userGrowth, topSkills, messageRows, complete, incomplete] = await Promise.all([
      User.aggregate([{ $group: { _id: "$role", total: { $sum: 1 } } }, { $sort: { total: -1 } }]),
      User.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, total: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      User.aggregate([
        { $unwind: "$skillsToTeach" },
        { $match: { skillsToTeach: { $type: "string", $ne: "" } } },
        { $group: { _id: { $toLower: "$skillsToTeach" }, total: { $sum: 1 } } },
        { $sort: { total: -1 } },
        { $limit: 6 },
      ]),
      Message.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, total: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      User.countDocuments({ profileCompleted: true }),
      User.countDocuments({ profileCompleted: { $ne: true } }),
    ]);

    return res.json({
      roleBreakdown,
      userGrowth,
      topSkills,
      messageActivity: fillDailySeries(messageRows, 7, now),
      profileCompletion: { complete, incomplete },
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load platform reports" });
  }
}

module.exports = { deleteUser, getOverview, getReports, listUsers, updateUser };
