const express = require("express");
const router = express.Router();
const authMiddleware = require("../Backend Configuration/Configuration Folders/Middleware Configuration/authMiddleware");
const { getWallet, topupWallet, requestWithdrawal } = require("../controllers/walletController");

router.get("/wallet", authMiddleware, getWallet);
router.post("/wallet/topup", authMiddleware, topupWallet);
router.post("/wallet/withdraw", authMiddleware, requestWithdrawal);

module.exports = router;
