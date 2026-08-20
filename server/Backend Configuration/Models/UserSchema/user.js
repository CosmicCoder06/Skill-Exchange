const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
    {
        // =========================
        // AUTH FIELDS
        // =========================

        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
        },

        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^\S+@\S+\.\S+$/,
                "Please enter a valid email",
            ],
        },

        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: 6,
            select: false,
        },

        role: {
            type: String,
            enum: [
                "learner",
                "mentor",
                "admin",
            ],
            default: "learner",
        },

        refreshToken: {
            type: String,
            select: false,
        },

        isVerified: {
            type: Boolean,
            default: false,
        },

        /*
         * Admin account status.
         *
         * true  = normal account
         * false = suspended account
         */
        isActive: {
            type: Boolean,
            default: true,
        },

        deactivationReason: {
            type: String,
            default: "",
            trim: true,
        },

        // =========================
        // PROFILE FIELDS
        // =========================

        bio: {
            type: String,
            default: "",
            trim: true,
        },

        skillsToTeach: {
            type: [String],
            default: [],
        },

        teachingSkillLevels: {
            type: Map,
            of: String,
            default: {},
        },

        skillsToLearn: {
            type: [String],
            default: [],
        },

        availability: {
            type: [String],
            default: [],
        },

        hourlyRate: {
            type: Number,
            default: 0,
            min: 0,
        },

        // Profile picture
        avatarUrl: {
            type: String,
            default: "",
            trim: true,
        },

        /*
         * Kept for compatibility with
         * older profile documents.
         *
         * It is not required by the
         * current Complete Profile UI.
         */
        coverImageUrl: {
            type: String,
            default: "",
            trim: true,
        },

        profileCompleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// =========================
// PASSWORD HASHING
// =========================

userSchema.pre("save", async function () {
    if (!this.isModified("password")) {
        return;
    }

    const salt =
        await bcrypt.genSalt(10);

    this.password =
        await bcrypt.hash(
            this.password,
            salt
        );
});

// =========================
// PASSWORD COMPARISON
// =========================

userSchema.methods.comparePassword =
    async function (enteredPassword) {
        return bcrypt.compare(
            enteredPassword,
            this.password
        );
    };

// =========================
// SAFE MONGOOSE MODEL
// =========================

module.exports =
    mongoose.models.User ||
    mongoose.model(
        "User",
        userSchema
    );
// @teamcosmiccoders
