// Usage:
// router.post('/xyz', verifyToken, authorize('mentor', 'admin'), handler)

const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: "Is action ke liye permission nahi hai"
            });
        }

        next();
    };
};

module.exports = authorize;