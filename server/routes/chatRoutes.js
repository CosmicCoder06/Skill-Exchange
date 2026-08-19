const express = require("express")
const verifyToken = require("../Backend Configuration/Configuration Folders/Middleware Configuration/authMiddleware")

const {
    createConversation,
    deleteConversation,
    deleteMessage,
    editMessage,
    getMessages,
    listConversations,
    markConversationRead,
    sendMessage,
} = require("../controllers/chatController")

const router = express.Router()

router.use(verifyToken)

router
    .route("/conversations")
    .get(listConversations)
    .post(createConversation)

router
    .route("/conversations/:id/messages")
    .get(getMessages)
    .post(sendMessage)

router.patch(
    "/conversations/:id/read",
    markConversationRead
)

router.delete(
    "/conversations/:id",
    deleteConversation
)

router.patch(
    "/messages/:id",
    editMessage
)

router.delete(
    "/messages/:id",
    deleteMessage
)

module.exports = router
// @teamcosmiccoders
