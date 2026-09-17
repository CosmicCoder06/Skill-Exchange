const mongoose = require("mongoose")
const Conversation = require("../models/Conversation")
const Message = require("../models/Message")
const Booking = require("../models/Booking")
const User = require("../Backend Configuration/Models/UserSchema/user")

const PARTICIPANT_FIELDS =
    "name email role avatarUrl"

async function getActiveSessionInfo(participantA, participantB, bookingId = null) {
    try {
        const query = {
            status: "accepted"
        }

        if (bookingId && mongoose.isValidObjectId(bookingId)) {
            query._id = bookingId
        } else if (participantA && participantB) {
            query.$or = [
                { mentor: participantA, learner: participantB },
                { mentor: participantB, learner: participantA }
            ]
        } else {
            return { isActive: false, activeSession: null, mostRecentPastSessionEnd: 0 }
        }

        const bookings = await Booking.find(query).sort({ date: -1, time: -1 })
        const now = Date.now()

        let activeSession = null
        let mostRecentPastSessionEnd = 0

        for (const b of bookings) {
            if (!b.date || !b.time) continue
            const start = new Date(`${b.date}T${b.time}`).getTime()
            if (Number.isNaN(start)) continue
            const durationMins = Number(b.duration) || 60
            const end = start + durationMins * 60 * 1000

            if (now >= start && now <= end) {
                activeSession = {
                    bookingId: b._id,
                    date: b.date,
                    time: b.time,
                    duration: durationMins,
                    endTime: end
                }
                break
            }

            if (now > end && end > mostRecentPastSessionEnd) {
                mostRecentPastSessionEnd = end
            }
        }

        return {
            isActive: Boolean(activeSession),
            activeSession,
            mostRecentPastSessionEnd
        }
    } catch (err) {
        console.error("getActiveSessionInfo error:", err)
        return { isActive: false, activeSession: null, mostRecentPastSessionEnd: 0 }
    }
}

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

        // Admin accounts are intentionally not part of the member messaging
        // experience. Hide legacy conversations too, not only new ones.
        const memberConversations =
            conversations.filter(
                (conversation) =>
                    conversation.participants.every(
                        (participant) =>
                            participant &&
                            participant.role !== "admin"
                    )
            )

        return res.json({
            conversations:
                memberConversations.map(
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

        const [senderIsMember, participantExists] =
            await Promise.all([
                User.exists({
                    _id: req.user.id,
                    role: { $ne: "admin" },
                    isActive: true,
                }),
                User.exists({
                    _id: participantId,
                    role: { $ne: "admin" },
                    isActive: true,
                }),
            ])

        if (!senderIsMember) {
            return res
                .status(403)
                .json({
                    message:
                        "Admin accounts are not available for member messaging",
                })
        }

        if (!participantExists) {
            return res
                .status(404)
                .json({
                    message:
                        "Participant is not available for messaging",
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

        const participantIds = conversation.participants.map((p) => String(p._id || p));
        const otherParticipantId = participantIds.find((id) => id !== String(req.user.id)) || participantIds[0];
        const sessionInfo = await getActiveSessionInfo(req.user.id, otherParticipantId, conversation.bookingId);

        const messageFilter = {
            conversation: conversation._id,
            inActiveSession: { $ne: true }
        };
        if (sessionInfo.mostRecentPastSessionEnd > 0) {
            messageFilter.createdAt = { $gt: new Date(sessionInfo.mostRecentPastSessionEnd) };
        }
        const currentFreeCount = await Message.countDocuments(messageFilter);

        return res.json({
            messages,
            isSessionActive: sessionInfo.isActive,
            activeSession: sessionInfo.activeSession,
            freeMessageCount: currentFreeCount,
            maxFreeMessages: 5,
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

    const participantIds = conversation.participants.map((p) => String(p._id || p));
    const otherParticipantId = participantIds.find((id) => id !== String(senderId)) || participantIds[0];
    const sessionInfo = await getActiveSessionInfo(senderId, otherParticipantId, conversation.bookingId);

    if (!sessionInfo.isActive) {
        const messageFilter = {
            conversation: conversation._id,
            inActiveSession: { $ne: true }
        };
        if (sessionInfo.mostRecentPastSessionEnd > 0) {
            messageFilter.createdAt = { $gt: new Date(sessionInfo.mostRecentPastSessionEnd) };
        }

        const messageCount = await Message.countDocuments(messageFilter);

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
            inActiveSession: Boolean(sessionInfo.isActive),
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
