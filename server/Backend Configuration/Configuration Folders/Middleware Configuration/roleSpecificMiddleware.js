// Usage:
// router.post('/xyz', verifyToken, authorize('mentor', 'admin'), handler)

const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                message: "User is not authenticated",
            });
        }

        const userRole =
            String(req.user.role || "")
                .trim()
                .toLowerCase();

        const normalizedAllowedRoles =
            allowedRoles.map((role) =>
                String(role)
                    .trim()
                    .toLowerCase()
            );

        if (
            !userRole ||
            !normalizedAllowedRoles.includes(userRole)
        ) {
            console.error(
                "Authorization failed:",
                {
                    userRole,
                    allowedRoles:
                        normalizedAllowedRoles,
                    userId: req.user.id,
                }
            );

            return res.status(403).json({
                message:
                    "Is action ke liye permission nahi hai",
            });
        }

        next();
    };
};

module.exports = authorize;
// @teamcosmiccoders
