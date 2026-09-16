const mongoose = require("mongoose")

const messageSchema =
    new mongoose.Schema(
        {
            conversation: {
                type:
                    mongoose.Schema.Types.ObjectId,
                ref: "Conversation",
                required: true,
                index: true,
            },

            sender: {
                type:
                    mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },

            content: {
                type: String,
                required: true,
                trim: true,
                maxlength: 2000,
            },

            readBy: [
                {
                    type:
                        mongoose.Schema.Types.ObjectId,
                    ref: "User",
                },
            ],

            edited: {
                type: Boolean,
                default: false,
            },

            editedAt: {
                type: Date,
                default: null,
            },

            deleted: {
                type: Boolean,
                default: false,
            },

            deletedAt: {
                type: Date,
                default: null,
            },

            deletedFor: [
                {
                    type:
                        mongoose.Schema.Types.ObjectId,
                    ref: "User",
                },
            ],
        },
        { timestamps: true }
    )

messageSchema.index({
    conversation: 1,
    createdAt: -1,
})

module.exports =
    mongoose.models.Message ||
    mongoose.model(
        "Message",
        messageSchema
    )
