const jwt = require("jsonwebtoken")

const JWT_SECRET = process.env.JWT_SECRET || "Avhi@JWT#98990$Avhi"

function verifyAuthToken(token) {
    return jwt.verify(token, JWT_SECRET)
}

module.exports = { JWT_SECRET, verifyAuthToken }

// @teamcosmiccoders
