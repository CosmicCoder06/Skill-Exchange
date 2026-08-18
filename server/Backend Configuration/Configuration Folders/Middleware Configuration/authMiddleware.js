const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
    try {

        const authHeader = req.headers.authorization;

        if (
            !authHeader ||
            !authHeader.startsWith("Bearer ")
        ) {
            return res.status(401).json({
                message: "Token is missing or invalid"
            });
        }


        const token = authHeader.split(" ")[1];


        const secret =
            process.env.JWT_ACCESS_SECRET ||
            process.env.JWT_SECRET;


        if (!secret) {
            return res.status(500).json({
                message: "JWT secret is not configured"
            });
        }


        const decoded = jwt.verify(
            token,
            secret
        );


        /*
         * Different parts of the project may use
         * different names for the user ID.
         *
         * Normalize them into req.user.id
         */

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
                message: "User ID not found in authentication token"
            });

        }


        req.user = {
            ...decoded,
            id: userId
        };


        next();


    } catch (error) {

        console.error(
            "Authentication error:",
            error.message
        );


        return res.status(401).json({
            message: "Token is invalid or expired"
        });

    }
};


module.exports = verifyToken;