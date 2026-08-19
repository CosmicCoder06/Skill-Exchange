const User = require("../Backend Configuration/Models/UserSchema/user");

const getMentorDashboard = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select("-password -refreshToken");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.status(200).json({
            message: "Mentor dashboard data fetched successfully",
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
