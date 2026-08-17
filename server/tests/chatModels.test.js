const test = require("node:test")
const assert = require("node:assert/strict")
const mongoose = require("mongoose")
const Conversation = require("../models/Conversation")
const Message = require("../models/Message")

test("participant key is stable regardless of user order", () => {
    const firstUser = new mongoose.Types.ObjectId()
    const secondUser = new mongoose.Types.ObjectId()
    const booking = new mongoose.Types.ObjectId()

    const forward = Conversation.buildParticipantKey([firstUser, secondUser], booking)
    const reverse = Conversation.buildParticipantKey([secondUser, firstUser], booking)

    assert.equal(forward, reverse)
})

test("conversation requires two different participants", () => {
    const user = new mongoose.Types.ObjectId()
    const conversation = new Conversation({
        participants: [user, user],
        participantKey: Conversation.buildParticipantKey([user, user]),
    })

    const error = conversation.validateSync()
    assert.match(error.errors.participants.message, /two different participants/)
})

test("message trims content and rejects empty text", () => {
    const message = new Message({
        conversation: new mongoose.Types.ObjectId(),
        sender: new mongoose.Types.ObjectId(),
        content: "   ",
    })

    const error = message.validateSync()
    assert.equal(message.content, "")
    assert.ok(error.errors.content)
})
