const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true
        },
        balance: {
            type: Number,
            default: 0,
            min: 0
        },
        earnedBalance: {
            type: Number,
            default: 0,
            min: 0
        },
        topupBalance: {
            type: Number,
            default: 0,
            min: 0
        },
        currency: {
            type: String,
            default: "INR"
        }
    },
    {
        timestamps: true
    }
);

module.exports =
    mongoose.models.Wallet || mongoose.model("Wallet", walletSchema);
