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

        status: {
            type: String,
            enum: [
                "pending",
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
