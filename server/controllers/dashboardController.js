const User = require("../Backend Configuration/Models/UserSchema/user");
const Booking = require("../models/Booking");
const Review = require("../models/Review");

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
        const [completedSessions, upcomingBookings, learnersTaught, ratingRows, monthlySessions, statusRows] = await Promise.all([
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
        ]);

        res.status(200).json({
            message: "Mentor dashboard data fetched successfully",
            dashboard: {
                role: user.role,
                name: user.name,
                email: user.email,
                skillsToTeach: user.skillsToTeach,
                completedSessions,
                upcomingBookings,
                learnersTaught: learnersTaught.length,
                averageRating: ratingRows[0]?.average || 0,
                ratingCount: ratingRows[0]?.total || 0,
                monthlySessions: monthlySessions.map((row) => ({ month: row._id, sessions: row.sessions, learners: row.learners.length })),
                statusBreakdown: statusRows.reduce((result, row) => ({ ...result, [row._id]: row.total }), {})
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
                profileCompleted: user.profileCompleted
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
