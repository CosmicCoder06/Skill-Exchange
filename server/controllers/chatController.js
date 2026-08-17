const mongoose = require("mongoose")
const Conversation = require("../models/Conversation")
const Message = require("../models/Message")
const User = require("../Backend Configuration/Models/UserSchema/user")

const PARTICIPANT_FIELDS = "name email role"

function isParticipant(conversation, userId) {
    return conversation.participants.some((participant) => {
        const participantId = participant._id || participant
        return String(participantId) === String(userId)
    })
}

async function findAccessibleConversation(conversationId, userId) {
    if (!mongoose.isValidObjectId(conversationId)) return null

    const conversation = await Conversation.findById(conversationId)
    if (!conversation || !isParticipant(conversation, userId)) return null

    return conversation
}

async function listConversations(req, res) {
    try {
        const conversations = await Conversation.find({ participants: req.user.id })
            .populate("participants", PARTICIPANT_FIELDS)
            .populate({
                path: "lastMessage",
                populate: { path: "sender", select: PARTICIPANT_FIELDS },
            })
            .sort({ lastActivityAt: -1 })
            .lean()

        return res.json({ conversations })
    } catch (error) {
        return res.status(500).json({ message: "Unable to fetch conversations" })
    }
}

async function createConversation(req, res) {
    try {
        const { participantId, bookingId = null } = req.body

        if (!mongoose.isValidObjectId(participantId)) {
            return res.status(400).json({ message: "A valid participantId is required" })
        }
        if (String(participantId) === String(req.user.id)) {
            return res.status(400).json({ message: "You cannot start a chat with yourself" })
        }
        if (bookingId && !mongoose.isValidObjectId(bookingId)) {
            return res.status(400).json({ message: "bookingId must be a valid ID" })
        }

        const participantExists = await User.exists({ _id: participantId })
        if (!participantExists) {
            return res.status(404).json({ message: "Participant not found" })
        }

        const participants = [req.user.id, participantId]
        const participantKey = Conversation.buildParticipantKey(participants, bookingId)

        let conversation = await Conversation.findOne({ participantKey })
        let created = false

        if (!conversation) {
            try {
                conversation = await Conversation.create({
                    participants,
                    bookingId,
                    participantKey,
                })
                created = true
            } catch (error) {
                if (error.code !== 11000) throw error
                conversation = await Conversation.findOne({ participantKey })
            }
        }

        conversation = await Conversation.findById(conversation._id)
            .populate("participants", PARTICIPANT_FIELDS)
            .populate("lastMessage")

        return res.status(created ? 201 : 200).json({ conversation })
    } catch (error) {
        return res.status(500).json({ message: "Unable to create conversation" })
    }
}

async function getMessages(req, res) {
    try {
        const conversation = await findAccessibleConversation(
            req.params.id,
            req.user.id,
        )
        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" })
        }

        const requestedLimit = Number.parseInt(req.query.limit, 10) || 50
        const limit = Math.min(Math.max(requestedLimit, 1), 100)
        const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1)
        const query = { conversation: conversation._id }

        const [messages, total] = await Promise.all([
            Message.find(query)
                .populate("sender", PARTICIPANT_FIELDS)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            Message.countDocuments(query),
        ])

        return res.json({
            messages: messages.reverse(),
            pagination: {
                page,
                limit,
                total,
                hasMore: page * limit < total,
            },
        })
    } catch (error) {
        return res.status(500).json({ message: "Unable to fetch messages" })
    }
}

async function persistMessage({ conversation, senderId, content }) {
    const cleanContent = typeof content === "string" ? content.trim() : ""
    if (!cleanContent) {
        const error = new Error("Message cannot be empty")
        error.statusCode = 400
        throw error
    }
    if (cleanContent.length > 2000) {
        const error = new Error("Message cannot exceed 2000 characters")
        error.statusCode = 400
        throw error
    }

    const message = await Message.create({
        conversation: conversation._id,
        sender: senderId,
        content: cleanContent,
        readBy: [senderId],
    })

    conversation.lastMessage = message._id
    conversation.lastActivityAt = message.createdAt
    await conversation.save()

    return Message.findById(message._id)
        .populate("sender", PARTICIPANT_FIELDS)
        .lean()
}

async function sendMessage(req, res) {
    try {
        const conversation = await findAccessibleConversation(
            req.params.id,
            req.user.id,
        )
        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" })
        }

        const message = await persistMessage({
            conversation,
            senderId: req.user.id,
            content: req.body.content,
        })

        const io = req.app.get("io")
        if (io) io.to(String(conversation._id)).emit("receive_message", message)

        return res.status(201).json({ message })
    } catch (error) {
        return res
            .status(error.statusCode || 500)
            .json({ message: error.statusCode ? error.message : "Unable to send message" })
    }
}

module.exports = {
    createConversation,
    findAccessibleConversation,
    getMessages,
    isParticipant,
    listConversations,
    persistMessage,
    sendMessage,
}

