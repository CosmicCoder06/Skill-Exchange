const express = require("express");
const verifyToken = require("../Backend Configuration/Configuration Folders/Middleware Configuration/authMiddleware");
const authorize = require("../Backend Configuration/Configuration Folders/Middleware Configuration/roleSpecificMiddleware");
const {
  deleteUser,
  getOverview,
  getReports,
  getStats,
  getUserDetails,
  listSessions,
  listUsers,
  updateUser,
} = require("../controllers/adminController");
const {
  getAllPayments,
  getPendingPayments,
  verifyPayment,
  getPayouts,
  settlePayouts,
  getPayoutHistory,
  getRefunds,
  processRefund,
  markPaidOut,
  refundBooking,
  exportLedger,
} = require("../controllers/adminPaymentController");

const router = express.Router();

router.use("/admin", verifyToken, authorize("admin"));
router.get("/admin/overview", getOverview);
router.get("/admin/stats", getStats);
router.get("/admin/users", listUsers);
router.get("/admin/users/:id", getUserDetails);
router.patch("/admin/users/:id", updateUser);
router.delete("/admin/users/:id", deleteUser);
router.get("/admin/sessions", listSessions);
router.get("/admin/reports", getReports);

// Platform Razorpay Payment & Payout Administration
router.get("/admin/payments", getAllPayments);
router.get("/admin/payments/pending", getPendingPayments);
router.post("/admin/payments/:id/verify", verifyPayment);
router.get("/admin/payments/payouts", getPayouts);
router.post("/admin/payouts/settle", settlePayouts);
router.get("/admin/payouts/history", getPayoutHistory);
router.get("/admin/refunds", getRefunds);
router.post("/admin/refunds/:id", processRefund);
router.post("/admin/payments/:id/payout", markPaidOut);
router.post("/admin/payments/:id/refund", refundBooking);
router.get("/admin/payments/ledger.csv", exportLedger);

module.exports = router;
