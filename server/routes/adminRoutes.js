const express = require("express");
const verifyToken = require("../Backend Configuration/Configuration Folders/Middleware Configuration/authMiddleware");
const authorize = require("../Backend Configuration/Configuration Folders/Middleware Configuration/roleSpecificMiddleware");
const {
  deleteUser,
  getOverview,
  getReports,
  listUsers,
  updateUser,
} = require("../controllers/adminController");

const router = express.Router();

router.use(verifyToken, authorize("admin"));
router.get("/admin/overview", getOverview);
router.get("/admin/users", listUsers);
router.patch("/admin/users/:id", updateUser);
router.delete("/admin/users/:id", deleteUser);
router.get("/admin/reports", getReports);

module.exports = router;

// @teamcosmiccoders
