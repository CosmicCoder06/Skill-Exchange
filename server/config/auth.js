const jwt = require("jsonwebtoken")

const JWT_SECRET = process.env.JWT_SECRET || "Dikshant16121999Chakrayat@123"

function verifyAuthToken(token) {
    return jwt.verify(token, JWT_SECRET)
}

module.exports = { JWT_SECRET, verifyAuthToken }

