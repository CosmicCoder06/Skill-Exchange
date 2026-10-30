const mongoose = require("mongoose")

const conversationSchema =
    new mongoose.Schema(
        {
            participants: {
                type: [
                    {
                        type:
                            mongoose.Schema.Types.ObjectId,
                        ref: "User",
                    },
                ],
                required: true,
                validate: {
                    validator(
                        participants
                    ) {
                        if (
                            participants.length !==
                            2
                        ) {
                            return false
                        }

                        return (
                            new Set(
                                participants.map(
                                    String
                                )
                            ).size === 2
                        )
                    },

                    message:
                        "A conversation must have two different participants",
                },
            },

            bookingId: {
                type:
                    mongoose.Schema.Types.ObjectId,
                ref: "Booking",
                default: null,
            },

            participantKey: {
                type: String,
                required: true,
                unique: true,
                select: false,
            },

            lastMessage: {
                type:
                    mongoose.Schema.Types.ObjectId,
                ref: "Message",
                default: null,
            },

            lastActivityAt: {
                type: Date,
                default: Date.now,
            },

            hiddenFor: [
                {
                    type:
                        mongoose.Schema.Types.ObjectId,
                    ref: "User",
                },
            ],
        },
        { timestamps: true }
    )

conversationSchema.index({
    participants: 1,
    lastActivityAt: -1,
})

conversationSchema.statics.buildParticipantKey =
    function buildParticipantKey(
        participantIds,
        bookingId
    ) {
        const users =
            participantIds
                .map(String)
                .sort()
                .join(":")

        return `${users}:${
            bookingId
                ? String(bookingId)
                : "direct"
        }`
    }

module.exports =
    mongoose.models.Conversation ||
    mongoose.model(
        "Conversation",
        conversationSchema
    )
// @teamcosmiccoders
