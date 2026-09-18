const User = require("../Backend Configuration/Models/UserSchema/user");
const Booking = require("../models/Booking");
const Review = require("../models/Review");
const Wallet = require("../models/Wallet");

const roundToTwo = (num) => Math.round((Number(num) || 0) * 100) / 100;

const getMentorDashboard = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select("-password -refreshToken");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const mentorId = user._id;
        const [
            completedSessions,
            upcomingBookings,
            learnersTaught,
            ratingRows,
            monthlySessions,
            statusRows,
            mentorWallet,
            mentorPaidBookings
        ] = await Promise.all([
            Booking.countDocuments({ mentor: mentorId, status: "completed" }),
            Booking.countDocuments({ mentor: mentorId, status: { $in: ["pending", "accepted"] }, date: { $gte: new Date().toISOString().slice(0, 10) } }),
            Booking.distinct("learner", { mentor: mentorId, status: "completed" }),
            Review.aggregate([{ $match: { reviewee: mentorId } }, { $group: { _id: null, average: { $avg: "$rating" }, total: { $sum: 1 } } }]),
            Booking.aggregate([
                { $match: { mentor: mentorId, status: "completed" } },
                { $group: { _id: { $substr: ["$date", 0, 7] }, sessions: { $sum: 1 }, learners: { $addToSet: "$learner" } } },
                { $sort: { _id: 1 } }, { $limit: 6 },
            ]),
            Booking.aggregate([{ $match: { mentor: mentorId } }, { $group: { _id: "$status", total: { $sum: 1 } } }]),
            Wallet.findOne({ user: mentorId }),
            Booking.find({ mentor: mentorId })
                .populate("learner", "name email")
                .sort({ createdAt: -1 })
                .limit(50)
        ]);

        const currentMonthPrefix = new Date().toISOString().slice(0, 7);
        let totalEarnings = 0;
        let pendingSettlement = 0;
        let thisMonthEarnings = 0;
        const history = [];

        (mentorPaidBookings || []).forEach((b) => {
            const base = Number(b.baseSessionAmount || b.paymentAmount || 0);
            const isFree = b.paymentMethod === "free" || base === 0;
            const gross = roundToTwo(b.grossAmountWithGst !== undefined && Number(b.grossAmountWithGst) > 0 ? b.grossAmountWithGst : (base > 0 ? base * 1.18 : 0));
            const fee = roundToTwo(b.mentorPlatformFee !== undefined && Number(b.mentorPlatformFee) > 0 ? b.mentorPlatformFee : (isFree ? 0 : gross * 0.03));
            const net = roundToTwo(b.mentorEarnings !== undefined && Number(b.mentorEarnings) > 0 ? b.mentorEarnings : Math.max(0, gross - fee));

            let statusLabel = "Free Session";
            let isCredited = false;

            if (isFree) {
                statusLabel = "Free Session";
            } else if (b.paymentStatus === "verified") {
                statusLabel = "Credited to Wallet";
                isCredited = true;
                totalEarnings += net;
                if (b.date && b.date.startsWith(currentMonthPrefix)) {
                    thisMonthEarnings += net;
                }
            } else if (b.status === "cancelled" || b.status === "rejected") {
                statusLabel = b.status === "cancelled" ? "Cancelled" : "Declined";
            } else if (b.paymentStatus === "pending_verification") {
                statusLabel = "Pending Verification";
                pendingSettlement += net;
            } else if (b.status === "accepted" || b.paymentStatus === "unpaid") {
                statusLabel = "Pending Settlement";
                pendingSettlement += net;
            } else {
                statusLabel = "Pending";
            }

            history.push({
                bookingId: b._id,
                date: b.date || "—",
                time: b.time || "—",
                duration: b.duration || 60,
                learnerName: b.learner?.name || "Learner",
                learnerEmail: b.learner?.email || "",
                grossFee: gross,
                platformFee: fee,
                netAmount: net,
                status: statusLabel,
                isCredited,
                paymentMethod: b.paymentMethod || "wallet"
            });
        });

        const walletBalance = mentorWallet ? mentorWallet.balance : 0;
        const earnedBalance = mentorWallet
            ? (mentorWallet.earnedBalance !== undefined ? mentorWallet.earnedBalance : mentorWallet.balance)
            : 0;
        const topupBalance = mentorWallet
            ? (mentorWallet.topupBalance !== undefined ? mentorWallet.topupBalance : 0)
            : 0;

        res.status(200).json({
            message: "Mentor dashboard data fetched successfully",
            dashboard: {
                role: user.role,
                name: user.name,
                email: user.email,
                skillsToTeach: user.skillsToTeach,
                teachingSkillLevels: user.teachingSkillLevels,
                completedSessions,
                upcomingBookings,
                learnersTaught: learnersTaught.length,
                averageRating: ratingRows[0]?.average || 0,
                ratingCount: ratingRows[0]?.total || 0,
                monthlySessions: monthlySessions.map((row) => ({ month: row._id, sessions: row.sessions, learners: row.learners.length })),
                statusBreakdown: statusRows.reduce((result, row) => ({ ...result, [row._id]: row.total }), {}),
                earnings: {
                    totalEarnings: roundToTwo(totalEarnings),
                    walletBalance: roundToTwo(walletBalance),
                    earnedBalance: roundToTwo(earnedBalance),
                    topupBalance: roundToTwo(topupBalance),
                    pendingSettlement: roundToTwo(pendingSettlement),
                    thisMonthEarnings: roundToTwo(thisMonthEarnings),
                    history
                }
            }
        });

    } catch (error) {
        console.error("Mentor dashboard error:", error);

        res.status(500).json({
            message: "Unable to fetch mentor dashboard"
        });
    }
};


const getLearnerDashboard = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select("-password -refreshToken");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const learnerId = user._id;
        const [
            completedBookings,
            upcomingSessions,
            mentorsConnected,
            monthlyLearning,
            learnerWallet
        ] = await Promise.all([
            Booking.find({ learner: learnerId, status: "completed" })
                .populate("mentor", "name email avatarUrl skillsToTeach"),
            Booking.countDocuments({
                learner: learnerId,
                status: { $in: ["pending", "accepted", "slots_offered"] }
            }),
            Booking.distinct("mentor", { learner: learnerId, status: "completed" }),
            Booking.aggregate([
                { $match: { learner: learnerId, status: "completed" } },
                { $group: { _id: { $substr: ["$date", 0, 7] }, sessions: { $sum: 1 }, duration: { $sum: "$duration" } } },
                { $sort: { _id: 1 } },
                { $limit: 6 }
            ]),
            Wallet.findOne({ user: learnerId })
        ]);

        const sessionsAttended = completedBookings.length;
        const totalLearningMinutes = completedBookings.reduce((sum, b) => sum + (Number(b.duration) || 60), 0);
        const learningHours = roundToTwo(totalLearningMinutes / 60);

        const skillsExploredSet = new Set(user.skillsToLearn || []);
        completedBookings.forEach((b) => {
            (b.mentor?.skillsToTeach || []).forEach((s) => {
                if (s && typeof s === "string") skillsExploredSet.add(s.trim());
            });
        });
        const skillsExploredCount = skillsExploredSet.size;

        res.status(200).json({
            message: "Learner dashboard data fetched successfully",
            dashboard: {
                role: user.role,
                name: user.name,
                email: user.email,
                bio: user.bio,
                skillsToTeach: user.skillsToTeach,
                skillsToLearn: user.skillsToLearn,
                availability: user.availability,
                hourlyRate: user.hourlyRate,
                avatarUrl: user.avatarUrl,
                profileCompleted: user.profileCompleted,
                sessionsAttended,
                upcomingSessions,
                mentorsConnected: mentorsConnected.length,
                learningHours,
                skillsExploredCount,
                monthlyLearning: monthlyLearning.map((row) => ({
                    month: row._id,
                    sessions: row.sessions,
                    hours: roundToTwo((row.duration || 60) / 60)
                })),
                walletBalance: learnerWallet ? roundToTwo(learnerWallet.balance) : 0,
                earnedBalance: learnerWallet ? roundToTwo(learnerWallet.earnedBalance || 0) : 0,
                topupBalance: learnerWallet ? roundToTwo(learnerWallet.topupBalance || 0) : 0
            }
        });

    } catch (error) {
        console.error("Learner dashboard error:", error);

        res.status(500).json({
            message: "Unable to fetch learner dashboard"
        });
    }
};


module.exports = {
    getMentorDashboard,
    getLearnerDashboard
};
// @teamcosmiccoders
