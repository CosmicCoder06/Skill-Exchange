const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Token is missing or invalid"
            });
        }

        const token = authHeader.split(" ")[1];

        const secret =
            process.env.JWT_ACCESS_SECRET ||
            process.env.JWT_SECRET;

        const decoded = jwt.verify(token, secret);

        req.user = decoded;

        next();

    } catch (error) {
        console.error("Authentication error:", error.message);

        return res.status(401).json({
            message: "Token is invalid or expired"
        });
    }
};

module.exports = verifyToken;