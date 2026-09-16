const { verifyAuthToken } = require("../config/auth")

const {
    deleteMessage,
    editMessage,
    findAccessibleConversation,
    markConversationRead,
    persistMessage,
} = require("../controllers/chatController")

function getSocketToken(socket) {
    const authToken =
        socket.handshake.auth?.token

    const header =
        socket.handshake.headers
            .authorization

    return (
        authToken ||
        (header?.startsWith("Bearer ")
            ? header.slice(7)
            : null)
    )
}

function ack(callback, payload) {
    if (typeof callback === "function") {
        callback(payload)
    }
}

function socketError(
    socket,
    message,
    callback
) {
    const payload = {
        ok: false,
        message,
    }

    ack(callback, payload)
    socket.emit(
        "chat_error",
        payload
    )
}

function makeResponse() {
    return {
        statusCode: 200,
        body: null,

        status(code) {
            this.statusCode = code
            return this
        },

        json(payload) {
            this.body = payload
            return this
        },
    }
}

function initializeChatSocket(io) {
    io.use((socket, next) => {
        try {
            const token =
                getSocketToken(socket)

            if (!token) {
                return next(
                    new Error(
                        "Authentication required"
                    )
                )
            }

            socket.user =
                verifyAuthToken(token)

            return next()
        } catch {
            return next(
                new Error(
                    "Invalid or expired token"
                )
            )
        }
    })

    io.on(
        "connection",
        (socket) => {
            socket.on(
                "join_conversation",
                async (
                    {
                        conversationId,
                    } = {},
                    callback
                ) => {
                    try {
                        const conversation =
                            await findAccessibleConversation(
                                conversationId,
                                socket.user.id
                            )

                        if (!conversation) {
                            return socketError(
                                socket,
                                "Conversation not found",
                                callback
                            )
                        }

                        await socket.join(
                            String(
                                conversation._id
                            )
                        )

                        return ack(
                            callback,
                            { ok: true }
                        )
                    } catch {
                        return socketError(
                            socket,
                            "Unable to join conversation",
                            callback
                        )
                    }
                }
            )

            socket.on(
                "leave_conversation",
                ({
                    conversationId,
                } = {}) => {
                    if (
                        conversationId
                    ) {
                        socket.leave(
                            String(
                                conversationId
                            )
                        )
                    }
                }
            )

            socket.on(
                "send_message",
                async (
                    {
                        conversationId,
                        content,
                    } = {},
                    callback
                ) => {
                    try {
                        const conversation =
                            await findAccessibleConversation(
                                conversationId,
                                socket.user.id
                            )

                        if (
                            !conversation
                        ) {
                            return socketError(
                                socket,
                                "Conversation not found",
                                callback
                            )
                        }

                        const message =
                            await persistMessage(
                                {
                                    conversation,
                                    senderId:
                                        socket.user
                                            .id,
                                    content,
                                }
                            )

                        io.to(
                            String(
                                conversation._id
                            )
                        ).emit(
                            "receive_message",
                            message
                        )

                        return ack(
                            callback,
                            {
                                ok: true,
                                message,
                            }
                        )
                    } catch (
                        error
                    ) {
                        return socketError(
                            socket,
                            error.statusCode
                                ? error.message
                                : "Unable to send message",
                            callback
                        )
                    }
                }
            )

            socket.on(
                "edit_message",
                async (
                    {
                        messageId,
                        content,
                    } = {},
                    callback
                ) => {
                    try {
                        const req = {
                            params: {
                                id: messageId,
                            },
                            body: {
                                content,
                            },
                            user:
                                socket.user,
                            app: {
                                get: () => io,
                            },
                        }

                        const res =
                            makeResponse()

                        await editMessage(
                            req,
                            res
                        )

                        if (
                            res.statusCode >=
                            400
                        ) {
                            return socketError(
                                socket,
                                res.body
                                    ?.message ||
                                    "Unable to edit message",
                                callback
                            )
                        }

                        return ack(
                            callback,
                            {
                                ok: true,
                                message:
                                    res.body
                                        .message,
                            }
                        )
                    } catch {
                        return socketError(
                            socket,
                            "Unable to edit message",
                            callback
                        )
                    }
                }
            )

            socket.on(
                "delete_message",
                async (
                    {
                        messageId,
                        mode = "me",
                    } = {},
                    callback
                ) => {
                    try {
                        const req = {
                            params: {
                                id: messageId,
                            },
                            body: {
                                mode,
                            },
                            user:
                                socket.user,
                            app: {
                                get: () => io,
                            },
                        }

                        const res =
                            makeResponse()

                        await deleteMessage(
                            req,
                            res
                        )

                        if (
                            res.statusCode >=
                            400
                        ) {
                            return socketError(
                                socket,
                                res.body
                                    ?.message ||
                                    "Unable to delete message",
                                callback
                            )
                        }

                        return ack(
                            callback,
                            {
                                ok: true,
                                message:
                                    res.body
                                        .message,
                                deleteMode:
                                    res.body
                                        .deleteMode,
                            }
                        )
                    } catch {
                        return socketError(
                            socket,
                            "Unable to delete message",
                            callback
                        )
                    }
                }
            )

            socket.on(
                "mark_read",
                async (
                    {
                        conversationId,
                    } = {},
                    callback
                ) => {
                    try {
                        const req = {
                            params: {
                                id: conversationId,
                            },
                            user:
                                socket.user,
                            app: {
                                get: () => io,
                            },
                        }

                        const res =
                            makeResponse()

                        await markConversationRead(
                            req,
                            res
                        )

                        return ack(
                            callback,
                            {
                                ok:
                                    res.statusCode <
                                    400,
                                messageIds:
                                    res.body
                                        ?.messageIds ||
                                    [],
                            }
                        )
                    } catch {
                        return socketError(
                            socket,
                            "Unable to mark messages as read",
                            callback
                        )
                    }
                }
            )

            for (
                const eventName of [
                    "typing_start",
                    "typing_stop",
                ]
            ) {
                socket.on(
                    eventName,
                    async ({
                        conversationId,
                    } = {}) => {
                        const conversation =
                            await findAccessibleConversation(
                                conversationId,
                                socket.user.id
                            )

                        if (
                            !conversation
                        ) {
                            return
                        }

                        socket
                            .to(
                                String(
                                    conversation._id
                                )
                            )
                            .emit(
                                eventName,
                                {
                                    conversationId:
                                        String(
                                            conversation._id
                                        ),
                                    userId:
                                        socket.user
                                            .id,
                                }
                            )
                    }
                )
            }
        }
    )
}

module.exports =
    initializeChatSocket
// @teamcosmiccoders
