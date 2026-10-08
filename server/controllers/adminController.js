const mongoose = require("mongoose");
const User = require("../Backend Configuration/Models/UserSchema/user");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Booking = require("../models/Booking");
const Review = require("../models/Review");
const ActivityLog = require("../models/ActivityLog");
const { escapeRegex, fillDailySeries } = require("../Utils/adminAnalytics");

const SAFE_USER_FIELDS = "name email role isVerified isActive profileCompleted skillsToTeach skillsToLearn bio avatarUrl createdAt updatedAt";
const USER_ROLES = new Set(["learner", "mentor", "admin"]);

async function getStats(req, res) {
  try {
    const [
      totalUsers,
      mentors,
      learners,
      pendingVerification,
      awaitingPayments,
      totalSessions,
      recentMembers,
      pendingPayments,
      recentSessions,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "mentor" }),
      User.countDocuments({ role: "learner" }),
      User.countDocuments({ isVerified: { $ne: true } }),
      Booking.countDocuments({
        $or: [
          { paymentStatus: { $in: ["awaiting_payment", "payment_submitted", "unpaid", "pending_verification"] } },
          { "payment.status": { $in: ["awaiting_payment", "payment_submitted"] } },
        ],
        status: { $nin: ["completed", "cancelled"] },
      }),
      Booking.countDocuments(),
      User.find({ role: { $ne: "admin" } })
        .select(SAFE_USER_FIELDS)
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Booking.find({
        $or: [
          { paymentStatus: { $in: ["payment_submitted", "pending_verification"] } },
          { "payment.status": "payment_submitted" },
        ],
        status: { $nin: ["completed", "cancelled"] },
      })
        .populate("learner", "name email avatarUrl")
        .populate("mentor", "name email avatarUrl")
        .sort({ updatedAt: -1 })
        .limit(5)
        .lean(),
      Booking.find()
        .populate("learner", "name email avatarUrl")
        .populate("mentor", "name email avatarUrl")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    return res.json({
      stats: {
        totalUsers,
        mentors,
        learners,
        pendingVerification,
        awaitingPayments,
        totalSessions,
      },
      recentMembers,
      pendingPayments,
      recentSessions,
    });
  } catch (error) {
    console.error("getStats error:", error);
    return res.status(500).json({ message: "Unable to load admin stats" });
  }
}

async function getUserDetails(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(id).select("-password -refreshToken");
    if (!user) return res.status(404).json({ message: "User not found" });

    const [
      sessionsAsMentor,
      sessionsAsLearner,
      totalMentorSessions,
      completedMentorSessions,
      totalLearnerSessions,
      completedLearnerSessions,
    ] = await Promise.all([
      Booking.find({ mentor: id })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("learner", "name email avatarUrl")
        .lean(),
      Booking.find({ learner: id })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("mentor", "name email avatarUrl")
        .lean(),
      Booking.countDocuments({ mentor: id }),
      Booking.countDocuments({ mentor: id, status: "completed" }),
      Booking.countDocuments({ learner: id }),
      Booking.countDocuments({ learner: id, status: "completed" }),
    ]);

    return res.json({
      user,
      sessionsSummary: {
        totalSessions: totalMentorSessions + totalLearnerSessions,
        completedSessions: completedMentorSessions + completedLearnerSessions,
        asMentor: {
          total: totalMentorSessions,
          completed: completedMentorSessions,
          recent: sessionsAsMentor,
        },
        asLearner: {
          total: totalLearnerSessions,
          completed: completedLearnerSessions,
          recent: sessionsAsLearner,
        },
      },
    });
  } catch (error) {
    console.error("getUserDetails error:", error);
    return res.status(500).json({ message: "Unable to load user details" });
  }
}

async function listSessions(req, res) {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 100);
    const query = {};

    if (req.query.status && req.query.status !== "all") {
      query.status = req.query.status;
    }
    if (req.query.paymentStatus && req.query.paymentStatus !== "all") {
      query.$or = [
        { paymentStatus: req.query.paymentStatus },
        { "payment.status": req.query.paymentStatus },
      ];
    }

    const [sessions, total] = await Promise.all([
      Booking.find(query)
        .populate("learner", "name email avatarUrl")
        .populate("mentor", "name email avatarUrl")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Booking.countDocuments(query),
    ]);

    return res.json({
      sessions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(Math.ceil(total / limit), 1),
      },
    });
  } catch (error) {
    console.error("listSessions error:", error);
    return res.status(500).json({ message: "Unable to load sessions" });
  }
}

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
      bookings,
      completedBookings,
      reviews,
      deactivatedAccounts,
      deletedAccounts,
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
      Booking.countDocuments(),
      Booking.countDocuments({ status: "completed" }),
      Review.countDocuments(),
      User.countDocuments({ isActive: false }),
      ActivityLog.countDocuments({ action: "account.deleted" }),
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
        bookings,
        completedBookings,
        reviews,
        deactivatedAccounts,
        deletedAccounts,
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

    const currentUserId = req.user?.id || req.user?._id;
    if (currentUserId && mongoose.isValidObjectId(currentUserId)) {
      query._id = { $ne: new mongoose.Types.ObjectId(currentUserId) };
    }

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

    const editingSelf = String(req.user.id) === String(id) || String(req.user._id) === String(id);
    if (editingSelf && req.body.role !== undefined) {
      return res.status(400).json({ message: "You cannot change your own role" });
    }

    const updates = {};
    if (req.body.role !== undefined) {
      if (!USER_ROLES.has(req.body.role)) {
        return res.status(400).json({ message: "Invalid role. Role must be learner, mentor, or admin." });
      }
      updates.role = req.body.role;
    }
    if (typeof req.body.isVerified === "boolean") updates.isVerified = req.body.isVerified;
    if (typeof req.body.isActive === "boolean") updates.isActive = req.body.isActive;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No supported updates provided" });
    }

    if (
      editingSelf &&
      (
        updates.isVerified !== undefined ||
        updates.isActive === false
      )
    ) {
      return res.status(400).json({
        message: "You cannot change your own verification or admin access",
      });
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
    await ActivityLog.create({
      actor: req.user.id,
      action: "account.deleted",
      entityType: "User",
      entityId: user._id,
      metadata: { name: user.name, email: user.email, role: user.role },
    });
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

module.exports = {
  deleteUser,
  getOverview,
  getReports,
  getStats,
  getUserDetails,
  listSessions,
  listUsers,
  updateUser,
};
// @teamcosmiccoders
