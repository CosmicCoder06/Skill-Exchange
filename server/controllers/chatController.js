const mongoose = require("mongoose")
const Conversation = require("../models/Conversation")
const Message = require("../models/Message")
const User = require("../Backend Configuration/Models/UserSchema/user")

const PARTICIPANT_FIELDS =
    "name email role avatarUrl"

function isParticipant(
    conversation,
    userId
) {
    return conversation.participants.some(
        (participant) => {
            const participantId =
                participant._id || participant

            return (
                String(participantId) ===
                String(userId)
            )
        }
    )
}

async function findAccessibleConversation(
    conversationId,
    userId
) {
    if (
        !mongoose.isValidObjectId(
            conversationId
        )
    ) {
        return null
    }

    const conversation =
        await Conversation.findById(
            conversationId
        )

    if (
        !conversation ||
        !isParticipant(
            conversation,
            userId
        )
    ) {
        return null
    }

    return conversation
}

async function listConversations(
    req,
    res
) {
    try {
        const conversations =
            await Conversation.find({
                participants:
                    req.user.id,
                hiddenFor: {
                    $ne: req.user.id,
                },
            })
                .populate(
                    "participants",
                    PARTICIPANT_FIELDS
                )
                .populate({
                    path: "lastMessage",
                    populate: {
                        path: "sender",
                        select:
                            PARTICIPANT_FIELDS,
                    },
                })
                .sort({
                    lastActivityAt: -1,
                })
                .lean()

        const unreadIds =
            await Message.find({
                conversation: {
                    $in: conversations.map(
                        (item) => item._id
                    ),
                },
                sender: {
                    $ne: req.user.id,
                },
                readBy: {
                    $ne: req.user.id,
                },
                deletedFor: {
                    $ne: req.user.id,
                },
            }).distinct(
                "conversation"
            )

        const unreadSet =
            new Set(
                unreadIds.map(String)
            )

        return res.json({
            conversations:
                conversations.map(
                    (conversation) => ({
                        ...conversation,
                        __unread:
                            unreadSet.has(
                                String(
                                    conversation._id
                                )
                            ),
                    })
                ),
        })
    } catch (error) {
        console.error(
            "listConversations:",
            error
        )

        return res
            .status(500)
            .json({
                message:
                    "Unable to fetch conversations",
            })
    }
}

async function createConversation(
    req,
    res
) {
    try {
        const {
            participantId,
            bookingId = null,
        } = req.body

        if (
            !mongoose.isValidObjectId(
                participantId
            )
        ) {
            return res
                .status(400)
                .json({
                    message:
                        "A valid participantId is required",
                })
        }

        if (
            String(participantId) ===
            String(req.user.id)
        ) {
            return res
                .status(400)
                .json({
                    message:
                        "You cannot start a chat with yourself",
                })
        }

        if (
            bookingId &&
            !mongoose.isValidObjectId(
                bookingId
            )
        ) {
            return res
                .status(400)
                .json({
                    message:
                        "bookingId must be a valid ID",
                })
        }

        const participantExists =
            await User.exists({
                _id: participantId,
            })

        if (!participantExists) {
            return res
                .status(404)
                .json({
                    message:
                        "Participant not found",
                })
        }

        const participants = [
            req.user.id,
            participantId,
        ]

        const participantKey =
            Conversation.buildParticipantKey(
                participants,
                bookingId
            )

        let conversation =
            await Conversation.findOne({
                participantKey,
            })

        let created = false

        if (!conversation) {
            try {
                conversation =
                    await Conversation.create({
                        participants,
                        bookingId,
                        participantKey,
                    })

                created = true
            } catch (error) {
                if (
                    error.code !==
                    11000
                ) {
                    throw error
                }

                conversation =
                    await Conversation.findOne(
                        {
                            participantKey,
                        }
                    )
            }
        }

        await Conversation.updateOne(
            {
                _id:
                    conversation._id,
            },
            {
                $pull: {
                    hiddenFor:
                        req.user.id,
                },
            }
        )

        conversation =
            await Conversation.findById(
                conversation._id
            )
                .populate(
                    "participants",
                    PARTICIPANT_FIELDS
                )
                .populate({
                    path: "lastMessage",
                    populate: {
                        path: "sender",
                        select:
                            PARTICIPANT_FIELDS,
                    },
                })

        return res
            .status(
                created ? 201 : 200
            )
            .json({
                conversation,
            })
    } catch (error) {
        console.error(
            "createConversation:",
            error
        )

        return res
            .status(500)
            .json({
                message:
                    "Unable to create conversation",
            })
    }
}

async function getMessages(
    req,
    res
) {
    try {
        const conversation =
            await findAccessibleConversation(
                req.params.id,
                req.user.id
            )

        if (!conversation) {
            return res
                .status(404)
                .json({
                    message:
                        "Conversation not found",
                })
        }

        const messages =
            await Message.find({
                conversation:
                    conversation._id,
                deletedFor: {
                    $ne: req.user.id,
                },
            })
                .populate(
                    "sender",
                    PARTICIPANT_FIELDS
                )
                .sort({
                    createdAt: 1,
                })
                .limit(100)
                .lean()

        return res.json({
            messages,
        })
    } catch (error) {
        console.error(
            "getMessages:",
            error
        )

        return res
            .status(500)
            .json({
                message:
                    "Unable to fetch messages",
            })
    }
}

async function persistMessage({
    conversation,
    senderId,
    content,
}) {
    const cleanContent =
        typeof content === "string"
            ? content.trim()
            : ""

    if (!cleanContent) {
        const error =
            new Error(
                "Message cannot be empty"
            )
        error.statusCode = 400
        throw error
    }

    if (
        cleanContent.length >
        2000
    ) {
        const error =
            new Error(
                "Message cannot exceed 2000 characters"
            )
        error.statusCode = 400
        throw error
    }

    if (!conversation.bookingId) {
        const messageCount =
            await Message.countDocuments({
                conversation:
                    conversation._id,
            })

        if (messageCount >= 5) {
            const error =
                new Error(
                    "You've reached the 5-message limit. Book a session with this user to continue chatting."
                )
            error.statusCode = 403
            throw error
        }
    }

    const message =
        await Message.create({
            conversation:
                conversation._id,
            sender: senderId,
            content: cleanContent,
            readBy: [senderId],
        })

    conversation.lastMessage =
        message._id
    conversation.lastActivityAt =
        message.createdAt
    conversation.hiddenFor = []

    await conversation.save()

    return Message.findById(
        message._id
    )
        .populate(
            "sender",
            PARTICIPANT_FIELDS
        )
        .lean()
}

async function sendMessage(
    req,
    res
) {
    try {
        const conversation =
            await findAccessibleConversation(
                req.params.id,
                req.user.id
            )

        if (!conversation) {
            return res
                .status(404)
                .json({
                    message:
                        "Conversation not found",
                })
        }

        const message =
            await persistMessage({
                conversation,
                senderId:
                    req.user.id,
                content:
                    req.body.content,
            })

        const io =
            req.app.get("io")

        if (io) {
            io.to(
                String(
                    conversation._id
                )
            ).emit(
                "receive_message",
                message
            )
        }

        return res
            .status(201)
            .json({ message })
    } catch (error) {
        return res
            .status(
                error.statusCode ||
                    500
            )
            .json({
                message:
                    error.statusCode
                        ? error.message
                        : "Unable to send message",
            })
    }
}

async function markConversationRead(
    req,
    res
) {
    try {
        const conversation =
            await findAccessibleConversation(
                req.params.id,
                req.user.id
            )

        if (!conversation) {
            return res
                .status(404)
                .json({
                    message:
                        "Conversation not found",
                })
        }

        const unread =
            await Message.find({
                conversation:
                    conversation._id,
                sender: {
                    $ne: req.user.id,
                },
                readBy: {
                    $ne: req.user.id,
                },
                deletedFor: {
                    $ne: req.user.id,
                },
            }).select("_id")

        if (unread.length) {
            await Message.updateMany(
                {
                    _id: {
                        $in:
                            unread.map(
                                (item) =>
                                    item._id
                            ),
                    },
                },
                {
                    $addToSet: {
                        readBy:
                            req.user.id,
                    },
                }
            )
        }

        const io =
            req.app.get("io")

        if (
            io &&
            unread.length
        ) {
            io.to(
                String(
                    conversation._id
                )
            ).emit(
                "messages_read",
                {
                    conversationId:
                        String(
                            conversation._id
                        ),
                    userId:
                        String(
                            req.user.id
                        ),
                }
            )
        }

        return res.json({
            messageIds:
                unread.map(
                    (item) =>
                        String(
                            item._id
                        )
                ),
        })
    } catch (error) {
        console.error(
            "markConversationRead:",
            error
        )

        return res
            .status(500)
            .json({
                message:
                    "Unable to mark messages as read",
            })
    }
}

async function editMessage(
    req,
    res
) {
    try {
        const message =
            await Message.findById(
                req.params.id
            )

        if (!message) {
            return res
                .status(404)
                .json({
                    message:
                        "Message not found",
                })
        }

        if (
            String(
                message.sender
            ) !==
            String(req.user.id)
        ) {
            return res
                .status(403)
                .json({
                    message:
                        "You can only edit your own messages",
                })
        }

        if (message.deleted) {
            return res
                .status(400)
                .json({
                    message:
                        "Deleted messages cannot be edited",
                })
        }

        const conversation =
            await findAccessibleConversation(
                message.conversation,
                req.user.id
            )

        if (!conversation) {
            return res
                .status(404)
                .json({
                    message:
                        "Conversation not found",
                })
        }

        const content =
            typeof req.body.content ===
            "string"
                ? req.body.content.trim()
                : ""

        if (!content) {
            return res
                .status(400)
                .json({
                    message:
                        "Message cannot be empty",
                })
        }

        message.content =
            content
        message.edited = true
        message.editedAt =
            new Date()

        await message.save()

        const updated =
            await Message.findById(
                message._id
            )
                .populate(
                    "sender",
                    PARTICIPANT_FIELDS
                )
                .lean()

        const io =
            req.app.get("io")

        if (io) {
            io.to(
                String(
                    conversation._id
                )
            ).emit(
                "message_updated",
                updated
            )
        }

        return res.json({
            message: updated,
        })
    } catch (error) {
        console.error(
            "editMessage:",
            error
        )

        return res
            .status(500)
            .json({
                message:
                    "Unable to edit message",
            })
    }
}

async function deleteMessage(
    req,
    res
) {
    try {
        const message =
            await Message.findById(
                req.params.id
            )

        if (!message) {
            return res
                .status(404)
                .json({
                    message:
                        "Message not found",
                })
        }

        const conversation =
            await findAccessibleConversation(
                message.conversation,
                req.user.id
            )

        if (!conversation) {
            return res
                .status(404)
                .json({
                    message:
                        "Conversation not found",
                })
        }

        const mode =
            req.body?.mode ===
            "everyone"
                ? "everyone"
                : "me"

        if (
            mode === "everyone"
        ) {
            if (
                String(
                    message.sender
                ) !==
                String(
                    req.user.id
                )
            ) {
                return res
                    .status(403)
                    .json({
                        message:
                            "Only the sender can delete for everyone",
                    })
            }

            const seenByOther =
                message.readBy.some(
                    (id) =>
                        String(id) !==
                        String(
                            req.user.id
                        )
                )

            if (seenByOther) {
                return res
                    .status(409)
                    .json({
                        message:
                            "This message has already been seen",
                    })
            }

            message.content =
                ""
            message.deleted =
                true
            message.deletedAt =
                new Date()
        } else {
            message.deletedFor =
                message.deletedFor || []

            message.deletedFor.push(
                req.user.id
            )
        }

        await message.save()

        const updated =
            await Message.findById(
                message._id
            )
                .populate(
                    "sender",
                    PARTICIPANT_FIELDS
                )
                .lean()

        const io =
            req.app.get("io")

        if (io) {
            io.to(
                String(
                    conversation._id
                )
            ).emit(
                "message_deleted",
                updated
            )
        }

        return res.json({
            message: updated,
            deleteMode: mode,
        })
    } catch (error) {
        console.error(
            "deleteMessage:",
            error
        )

        return res
            .status(500)
            .json({
                message:
                    "Unable to delete message",
            })
    }
}

async function deleteConversation(
    req,
    res
) {
    try {
        const conversation =
            await findAccessibleConversation(
                req.params.id,
                req.user.id
            )

        if (!conversation) {
            return res
                .status(404)
                .json({
                    message:
                        "Conversation not found",
                })
        }

        await Conversation.updateOne(
            {
                _id:
                    conversation._id,
            },
            {
                $addToSet: {
                    hiddenFor:
                        req.user.id,
                },
            }
        )

        return res.json({
            ok: true,
        })
    } catch (error) {
        return res
            .status(500)
            .json({
                message:
                    "Unable to delete chat",
            })
    }
}

module.exports = {
    createConversation,
    deleteConversation,
    deleteMessage,
    editMessage,
    findAccessibleConversation,
    getMessages,
    isParticipant,
    listConversations,
    markConversationRead,
    persistMessage,
    sendMessage,
}
// @teamcosmiccoders
