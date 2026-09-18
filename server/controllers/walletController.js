const Wallet = require("../models/Wallet");
const WalletTransaction = require("../models/WalletTransaction");
const { recordActivity } = require("../Utils/activityLogger");
const { roundToTwo, getOrCreateReconciledWallet, computeBalancesFromLedger } = require("../Utils/walletHelper");

const getCurrentUserId = (req) => String(req.user._id || req.user.id);

// GET WALLET BALANCE & TRANSACTIONS
const getWallet = async (req, res) => {
    try {
        const userId = getCurrentUserId(req);

        // Always fetch or create a wallet that is fully reconciled with the transaction ledger
        const wallet = await getOrCreateReconciledWallet(userId);

        const transactions = await WalletTransaction.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(50);

        return res.json({
            wallet,
            transactions
        });
    } catch (error) {
        console.error("Get wallet error:", error);
        return res.status(500).json({ message: "Unable to load wallet" });
    }
};

// TOPUP WALLET (Instant simulated/demo top-up, no external gateway)
const topupWallet = async (req, res) => {
    try {
        const userId = getCurrentUserId(req);
        const amount = Number(req.body.amount);
        const reference = req.body.reference || req.body.paymentReference || `TOPUP-${Date.now().toString().slice(-6)}`;

        if (!amount || Number.isNaN(amount) || amount < 50) {
            return res.status(400).json({ message: "Top-up amount must be at least ₹50" });
        }

        const wallet = await getOrCreateReconciledWallet(userId);

        // Top-up adds directly to topupBalance (for session payments)
        wallet.topupBalance = roundToTwo(wallet.topupBalance + amount);
        wallet.balance = roundToTwo(wallet.earnedBalance + wallet.topupBalance);
        await wallet.save();

        const transaction = await WalletTransaction.create({
            wallet: wallet._id,
            user: userId,
            type: "topup",
            amount: roundToTwo(amount),
            balanceAfter: wallet.balance,
            paymentMethod: "direct",
            reference: String(reference).trim(),
            description: `Wallet top-up (+₹${roundToTwo(amount).toLocaleString("en-IN")})`
        });

        recordActivity({
            actor: userId,
            action: "wallet.topup",
            entityType: "Wallet",
            entityId: wallet._id,
            metadata: {
                amount: roundToTwo(amount),
                topupBalance: wallet.topupBalance,
                earnedBalance: wallet.earnedBalance,
                newBalance: wallet.balance
            }
        });

        return res.json({
            message: `Successfully added ₹${roundToTwo(amount).toLocaleString("en-IN")} to your wallet!`,
            wallet,
            transaction
        });
    } catch (error) {
        console.error("Topup wallet error:", error);
        return res.status(500).json({ message: "Unable to complete top-up" });
    }
};

// REQUEST WITHDRAWAL / PAYOUT (Restricted to earnedBalance only)
const requestWithdrawal = async (req, res) => {
    try {
        const userId = getCurrentUserId(req);
        const amount = Number(req.body.amount);
        const upiId = String(req.body.upiId || "").trim();

        if (!amount || Number.isNaN(amount) || amount < 100) {
            return res.status(400).json({ message: "Minimum withdrawal amount is ₹100" });
        }

        if (!upiId || !upiId.includes("@")) {
            return res.status(400).json({ message: "Please enter a valid UPI ID (e.g. name@upi)" });
        }

        const wallet = await getOrCreateReconciledWallet(userId);

        // Strict enforcement: Withdrawal allowed only from earnedBalance
        if (wallet.earnedBalance < amount) {
            return res.status(400).json({
                message: "You can only withdraw earnings from completed sessions. Top-up balance is for session payments only and is non-withdrawable."
            });
        }

        // Deduct solely from earnedBalance
        wallet.earnedBalance = roundToTwo(wallet.earnedBalance - amount);
        wallet.balance = roundToTwo(wallet.earnedBalance + wallet.topupBalance);
        await wallet.save();

        const transaction = await WalletTransaction.create({
            wallet: wallet._id,
            user: userId,
            type: "withdrawal",
            amount: -roundToTwo(amount),
            balanceAfter: wallet.balance,
            paymentMethod: "upi",
            reference: `WTHDRW-${Date.now().toString().slice(-6)}`,
            description: `Payout withdrawal request to UPI: ${upiId}`
        });

        recordActivity({
            actor: userId,
            action: "wallet.withdrawal",
            entityType: "Wallet",
            entityId: wallet._id,
            metadata: {
                amount: roundToTwo(amount),
                upiId,
                earnedBalance: wallet.earnedBalance,
                newBalance: wallet.balance
            }
        });

        return res.json({
            message: `Withdrawal request of ₹${roundToTwo(amount).toLocaleString("en-IN")} submitted successfully!`,
            wallet,
            transaction
        });
    } catch (error) {
        console.error("Withdrawal error:", error);
        return res.status(500).json({ message: "Unable to process withdrawal request" });
    }
};

module.exports = {
    getWallet,
    topupWallet,
    requestWithdrawal
};
