// const mongoose = require("mongoose");


// const bookingSchema = new mongoose.Schema(
//     {
//         mentor: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: "User",
//             required: true
//         },


//         learner: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: "User",
//             required: true
//         },


//         date: {
//             type: String,
//             required: true
//         },


//         time: {
//             type: String,
//             required: true
//         },


//         message: {
//             type: String,
//             default: ""
//         },


//         status: {
//             type: String,
//             enum: [
//                 "pending",
//                 "accepted",
//                 "rejected",
//                 "completed",
//                 "cancelled"
//             ],
//             default: "pending"
//         }
//     },


//     {
//         timestamps: true
//     }
// );


// module.exports = mongoose.model(
//     "Booking",
//     bookingSchema
// );


const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
    {
        meetingUrl: { type: String, default: '', maxlength: 200 },
        paymentAmount: { type: Number, min: 0 },
        baseSessionAmount: { type: Number, default: 0, min: 0 },
        gstAmount: { type: Number, default: 0, min: 0 },
        grossAmountWithGst: { type: Number, default: 0, min: 0 },
        paymentMethod: { type: String, enum: ['free', 'pay_later', 'qr', 'wallet', 'upi', 'card', 'upi_card'] },
        paymentStatus: {
            type: String,
            enum: [
                'awaiting_payment',
                'payment_submitted',
                'confirmed',
                'rejected',
                'refunded',
                'paid_out',
                // legacy backward compatibility
                'not_required',
                'awaiting_approval',
                'unpaid',
                'pending_verification',
                'verified',
                'declined',
                'cancelled'
            ],
            default: 'awaiting_payment'
        },
        paymentReference: { type: String, maxlength: 64, default: '' },
        learnerConvenienceFee: { type: Number, default: 0, min: 0 },
        mentorPlatformFee: { type: Number, default: 0, min: 0 },
        mentorEarnings: { type: Number, default: 0, min: 0 },
        totalAmountPaid: { type: Number, default: 0, min: 0 },
        duration: {
            type: Number,
            required: true,
            default: 60,
            min: 15,
            max: 480
        },
        payment: {
            status: {
                type: String,
                enum: ['awaiting_payment', 'payment_submitted', 'confirmed', 'rejected', 'refunded', 'paid_out'],
                default: 'awaiting_payment'
            },
            amount: { type: Number, default: 0, min: 0 },
            platformFeePercent: { type: Number, default: 10 },
            platformFee: { type: Number, default: 0, min: 0 },
            mentorPayout: { type: Number, default: 0, min: 0 },
            utr: { type: String, default: '', trim: true },
            screenshot: { type: String, default: '' },
            paytmTxnRef: { type: String, default: '', trim: true },
            rejectReason: { type: String, default: '' },
            refundReason: { type: String, default: '' },
            payoutRef: { type: String, default: '' },
            logs: [
                {
                    by: { type: String, default: 'system' },
                    from: { type: String, default: '' },
                    to: { type: String, default: '' },
                    at: { type: Date, default: Date.now },
                    note: { type: String, default: '' }
                }
            ]
        },
        mentor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        learner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        date: {
            type: String,
            required: true,
            trim: true
        },

        time: {
            type: String,
            required: true,
            trim: true
        },

        message: {
            type: String,
            default: "",
            trim: true,
            maxlength: 1000
        },

        suggestedSlots: [
            {
                date: { type: String, required: true, trim: true },
                time: { type: String, required: true, trim: true },
                isPreferred: { type: Boolean, default: false }
            }
        ],
        actionExpiresAt: {
            type: Date,
            index: true
        },
        lastActionAt: {
            type: Date,
            default: Date.now
        },
        cancellationReason: {
            type: String,
            default: "",
            trim: true,
            maxlength: 500
        },
        cancelledBy: {
            type: String,
            enum: ["mentor", "learner", "system"]
        },
        status: {
            type: String,
            enum: [
                "pending",
                "approved",
                "slots_offered",
                "accepted",
                "rejected",
                "completed",
                "cancelled"
            ],
            default: "pending",
            index: true
        }
    },
    {
        timestamps: true
    }
);

bookingSchema.index({
    mentor: 1,
    date: 1,
    time: 1
});

bookingSchema.index({
    learner: 1,
    date: 1,
    time: 1
});

module.exports =
    mongoose.models.Booking ||
    mongoose.model("Booking", bookingSchema);
