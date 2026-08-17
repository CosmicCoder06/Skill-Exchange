const { verifyAuthToken } = require("../config/auth")
const {
    findAccessibleConversation,
    persistMessage,
} = require("../controllers/chatController")

function getSocketToken(socket) {
    const authToken = socket.handshake.auth?.token
    const header = socket.handshake.headers.authorization
    return authToken || (header?.startsWith("Bearer ") ? header.slice(7) : null)
}

function acknowledge(callback, payload) {
    if (typeof callback === "function") callback(payload)
}

function emitChatError(socket, message, callback) {
    const payload = { ok: false, message }
    acknowledge(callback, payload)
    socket.emit("chat_error", payload)
}

function initializeChatSocket(io) {
    io.use((socket, next) => {
        try {
            const token = getSocketToken(socket)
            if (!token) return next(new Error("Authentication required"))
            socket.user = verifyAuthToken(token)
            return next()
        } catch (error) {
            return next(new Error("Invalid or expired token"))
        }
    })

    io.on("connection", (socket) => {
        socket.on("join_conversation", async ({ conversationId } = {}, callback) => {
            try {
                const conversation = await findAccessibleConversation(
                    conversationId,
                    socket.user.id,
                )
                if (!conversation) {
                    return emitChatError(socket, "Conversation not found", callback)
                }

                await socket.join(String(conversation._id))
                return acknowledge(callback, { ok: true })
            } catch (error) {
                return emitChatError(socket, "Unable to join conversation", callback)
            }
        })

        socket.on("leave_conversation", ({ conversationId } = {}) => {
            if (conversationId) socket.leave(String(conversationId))
        })

        socket.on("send_message", async ({ conversationId, content } = {}, callback) => {
            try {
                const conversation = await findAccessibleConversation(
                    conversationId,
                    socket.user.id,
                )
                if (!conversation) {
                    return emitChatError(socket, "Conversation not found", callback)
                }

                const message = await persistMessage({
                    conversation,
                    senderId: socket.user.id,
                    content,
                })
                io.to(String(conversation._id)).emit("receive_message", message)
                return acknowledge(callback, { ok: true, message })
            } catch (error) {
                return emitChatError(
                    socket,
                    error.statusCode ? error.message : "Unable to send message",
                    callback,
                )
            }
        })

        for (const eventName of ["typing_start", "typing_stop"]) {
            socket.on(eventName, async ({ conversationId } = {}) => {
                try {
                    const conversation = await findAccessibleConversation(
                        conversationId,
                        socket.user.id,
                    )
                    if (!conversation) return

                    socket.to(String(conversation._id)).emit(eventName, {
                        conversationId: String(conversation._id),
                        userId: socket.user.id,
                    })
                } catch (error) {
                    socket.emit("chat_error", {
                        ok: false,
                        message: "Unable to update typing status",
                    })
                }
            })
        }
    })
}

module.exports = initializeChatSocket

