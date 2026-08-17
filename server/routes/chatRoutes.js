const express = require("express")
const verifyToken = require("../Backend Configuration/Configuration Folders/Middleware Configuration/authMiddleware")
const {
    createConversation,
    getMessages,
    listConversations,
    sendMessage,
} = require("../controllers/chatController")

const router = express.Router()

router.use(verifyToken)
router.route("/conversations").get(listConversations).post(createConversation)
router.route("/conversations/:id/messages").get(getMessages).post(sendMessage)

module.exports = router

