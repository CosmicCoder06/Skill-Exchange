const mongoose = require("mongoose");


const bookingSchema = new mongoose.Schema(
    {
        mentor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },


        learner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },


        date: {
            type: String,
            required: true
        },


        time: {
            type: String,
            required: true
        },


        message: {
            type: String,
            default: ""
        },


        status: {
            type: String,
            enum: [
                "pending",
                "accepted",
                "rejected",
                "completed",
                "cancelled"
            ],
            default: "pending"
        }
    },


    {
        timestamps: true
    }
);


module.exports = mongoose.model(
    "Booking",
    bookingSchema
);