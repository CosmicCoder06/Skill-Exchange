const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        // Authorization header check
        if (
            !authHeader ||
            !authHeader.startsWith("Bearer ")
        ) {
            return res.status(401).json({
                message: "Token is missing or invalid",
            });
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                message: "Token is missing or invalid",
            });
        }

        // JWT secret
        const secret =
            process.env.JWT_ACCESS_SECRET ||
            process.env.JWT_SECRET;

        if (!secret) {
            console.error(
                "JWT_ACCESS_SECRET / JWT_SECRET is not configured"
            );

            return res.status(500).json({
                message: "JWT secret is not configured",
            });
        }

        // Verify JWT
        const decoded = jwt.verify(
            token,
            secret
        );

        // Normalize user ID from different possible token formats
        const userId =
            decoded.id ||
            decoded._id ||
            decoded.userId ||
            decoded.user?.id ||
            decoded.user?._id;

        if (!userId) {
            console.error(
                "Authentication failed: User ID not found in token",
                decoded
            );

            return res.status(401).json({
                message:
                    "User ID not found in authentication token",
            });
        }

        // Normalize role from different possible token formats
        const role =
            decoded.role ||
            decoded.user?.role ||
            decoded.userRole;

        // A role is needed only by routes which explicitly use `authorize`.
        // Keeping it optional here allows legacy but otherwise valid access
        // tokens to use role-neutral endpoints such as mentor discovery.
        const normalizedRole =
            role ? String(role).trim().toLowerCase() : null;

        // Attach authenticated user to request
        req.user = {
            ...decoded,
            id: userId,
            role: normalizedRole,
        };

        next();

    } catch (error) {
        console.error(
            "Authentication error:",
            error.message
        );

        return res.status(401).json({
            message:
                "Token is invalid or expired",
        });
    }
};

module.exports = verifyToken;
// @teamcosmiccoders
