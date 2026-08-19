const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
    {
        booking: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Booking",
            required: true
        },

        reviewer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        reviewee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },

        comment: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

reviewSchema.index(
    { booking: 1, reviewer: 1 },
    { unique: true }
);

// Avoid recompiling the model when the server reloads.
module.exports =
    mongoose.models.Review ||
    mongoose.model("Review", reviewSchema);
// @teamcosmiccoders
