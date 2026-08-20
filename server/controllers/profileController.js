const User = require("../Backend Configuration/Models/UserSchema/user");
const { recordActivity } = require("../Utils/activityLogger");

const hasValue = (value) =>
    typeof value === "string" && value.trim().length > 0;

const hasSkill = (skills) =>
    Array.isArray(skills) &&
    skills.some(
        (skill) =>
            typeof skill === "string" &&
            skill.trim().length > 0
    );

const cleanStringList = (value) => {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .filter((item) => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean);
};

const calculateProfileComplete = (profile) =>
    Boolean(
        hasValue(profile.bio) &&
        hasSkill(profile.skillsToTeach) &&
        (profile.role === "mentor" || hasSkill(profile.skillsToLearn))
    );


// ===============================
// GET MY PROFILE
// ===============================

const getMyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select("-password -refreshToken");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const profileComplete =
            user.profileCompleted ||
            calculateProfileComplete(user);

        res.status(200).json({
            profile: user,
            profileComplete
        });

    } catch (error) {
        console.error("Get profile error:", error);

        res.status(500).json({
            message: "Unable to fetch profile"
        });
    }
};


// ===============================
// UPDATE PROFILE
// ===============================

const updateProfile = async (req, res) => {
    try {
        const {
            bio,
            skillsToTeach,
            teachingSkillLevels,
            skillsToLearn,
            availability,
            hourlyRate,
            avatarUrl,
            coverImageUrl
        } = req.body;

        // -------------------------
        // Validate bio
        // -------------------------

        if (
            bio !== undefined &&
            (
                typeof bio !== "string" ||
                !bio.trim()
            )
        ) {
            return res.status(400).json({
                message: "Bio cannot be empty."
            });
        }

        // -------------------------
        // Validate teaching skills
        // -------------------------

        if (
            skillsToTeach !== undefined &&
            !Array.isArray(skillsToTeach)
        ) {
            return res.status(400).json({
                message: "Teaching skills must be an array."
            });
        }

        // -------------------------
        // Validate learning skills
        // -------------------------

        if (
            req.user.role !== "mentor" &&
            skillsToLearn !== undefined &&
            !Array.isArray(skillsToLearn)
        ) {
            return res.status(400).json({
                message: "Learning skills must be an array."
            });
        }

        const cleanedSkillsToTeach =
            skillsToTeach !== undefined
                ? cleanStringList(skillsToTeach)
                : undefined;

        if (teachingSkillLevels !== undefined && (
            !teachingSkillLevels || Array.isArray(teachingSkillLevels) || typeof teachingSkillLevels !== "object"
        )) {
            return res.status(400).json({ message: "Teaching skill levels must be an object." });
        }

        const cleanedSkillsToLearn =
            skillsToLearn !== undefined
                ? cleanStringList(skillsToLearn)
                : undefined;

        // -------------------------
        // Profile completion rules
        // -------------------------

        if (
            skillsToTeach !== undefined &&
            cleanedSkillsToTeach.length === 0
        ) {
            return res.status(400).json({
                message: "Add at least one skill you can teach."
            });
        }

        if (
            req.user.role !== "mentor" &&
            skillsToLearn !== undefined &&
            cleanedSkillsToLearn.length === 0
        ) {
            return res.status(400).json({
                message: "Add at least one skill you want to learn."
            });
        }

        // -------------------------
        // Validate availability
        // -------------------------

        if (
            availability !== undefined &&
            !Array.isArray(availability)
        ) {
            return res.status(400).json({
                message: "Availability must be an array."
            });
        }

        const cleanedAvailability =
            availability !== undefined
                ? cleanStringList(availability)
                : undefined;

        // -------------------------
        // Validate hourly rate
        // -------------------------

        if (hourlyRate !== undefined) {
            const numericRate = Number(hourlyRate);

            if (
                !Number.isFinite(numericRate) ||
                numericRate < 0
            ) {
                return res.status(400).json({
                    message:
                        "Hourly rate must be a valid non-negative number."
                });
            }
        }

        const updates = {};

        if (bio !== undefined) {
            updates.bio = bio.trim();
        }

        if (cleanedSkillsToTeach !== undefined) {
            updates.skillsToTeach =
                cleanedSkillsToTeach;
        }

        if (teachingSkillLevels !== undefined) {
            const allowedLevels = new Set(["Beginner", "Intermediate", "Advanced", "Expert"]);
            const validSkills = new Set((cleanedSkillsToTeach || existingUser.skillsToTeach || []).map((skill) => String(skill).toLowerCase()));
            updates.teachingSkillLevels = Object.fromEntries(
                Object.entries(teachingSkillLevels)
                    .filter(([skill, level]) => validSkills.has(String(skill).toLowerCase()) && allowedLevels.has(level))
            );
        }

        if (existingUser.role === "mentor") {
            updates.skillsToLearn = [];
        } else if (cleanedSkillsToLearn !== undefined) {
            updates.skillsToLearn =
                cleanedSkillsToLearn;
        }

        if (cleanedAvailability !== undefined) {
            updates.availability =
                cleanedAvailability;
        }

        if (hourlyRate !== undefined) {
            updates.hourlyRate =
                Number(hourlyRate);
        }

        if (avatarUrl !== undefined) {
            updates.avatarUrl =
                typeof avatarUrl === "string"
                    ? avatarUrl.trim()
                    : "";
        }

        if (coverImageUrl !== undefined) {
            updates.coverImageUrl =
                typeof coverImageUrl === "string"
                    ? coverImageUrl.trim()
                    : "";
        }

        // -------------------------
        // Get existing profile
        // -------------------------

        const existingUser =
            await User.findById(req.user.id);

        if (!existingUser) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const profileForCompletion = {
            ...existingUser.toObject(),
            ...updates
        };

        const profileComplete =
            calculateProfileComplete(
                profileForCompletion
            );

        updates.profileCompleted =
            profileComplete;

        // -------------------------
        // Save with Mongoose
        // validation enabled
        // -------------------------

        const user =
            await User.findByIdAndUpdate(
                req.user.id,
                updates,
                {
                    new: true,
                    runValidators: true
                }
            ).select("-password -refreshToken");

        recordActivity({ actor: req.user.id, action: "profile.updated", entityType: "User", entityId: user._id });

        res.status(200).json({
            message: "Profile updated successfully",
            profile: user,
            profileComplete:
                user.profileCompleted
        });

    } catch (error) {
        console.error(
            "Profile update error:",
            error
        );

        if (error.name === "ValidationError") {
            return res.status(400).json({
                message: "Invalid profile data.",
                error: error.message
            });
        }

        res.status(500).json({
            message: "Profile update failed"
        });
    }
};


// ===============================
// GET OTHER USER PROFILE
// ===============================

const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select("-password -refreshToken");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.status(200).json({
            profile: user
        });

    } catch (error) {
        console.error(
            "Get user profile error:",
            error
        );

        res.status(500).json({
            message: "Unable to fetch profile"
        });
    }
};

const deactivateMyAccount = async (req, res) => {
    try {
        const reason = String(req.body?.reason || "").trim();
        if (!reason) return res.status(400).json({ message: "A deactivation reason is required" });

        await User.findByIdAndUpdate(req.user.id, {
            isActive: false,
            deactivationReason: reason,
            refreshToken: null
        });

        recordActivity({ actor: req.user.id, action: "account.deactivated", entityType: "User", entityId: req.user.id });

        return res.status(200).json({ message: "Account deactivated" });
    } catch (error) {
        return res.status(500).json({ message: "Unable to deactivate account" });
    }
};


module.exports = {
    getMyProfile,
    updateProfile,
    getUserProfile,
    deactivateMyAccount
};
