const mongoose = require("mongoose");

const walletTransactionSchema = new mongoose.Schema(
    {
        wallet: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Wallet",
            required: true,
            index: true
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        type: {
            type: String,
            enum: [
                "topup",
                "session_payment",
                "session_earning",
                "refund",
                "settlement",
                "withdrawal"
            ],
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        balanceAfter: {
            type: Number,
            required: true
        },
        booking: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Booking"
        },
        // Mentor platform fee (3% deducted from mentor payout)
        mentorPlatformFee: {
            type: Number,
            default: 0
        },
        // Learner convenience fee (3% added to external UPI/direct payment, pure platform revenue)
        learnerConvenienceFee: {
            type: Number,
            default: 0
        },
        description: {
            type: String,
            default: "",
            trim: true
        },
        paymentMethod: {
            type: String,
            enum: ["wallet", "qr", "upi", "card", "direct", "system"],
            default: "wallet"
        },
        reference: {
            type: String,
            default: "",
            trim: true
        },
        status: {
            type: String,
            enum: ["pending", "completed", "failed"],
            default: "completed"
        }
    },
    {
        timestamps: true
    }
);

walletTransactionSchema.index({ user: 1, createdAt: -1 });

module.exports =
    mongoose.models.WalletTransaction ||
    mongoose.model("WalletTransaction", walletTransactionSchema);
