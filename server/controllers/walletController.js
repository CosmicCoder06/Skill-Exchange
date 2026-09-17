const Wallet = require("../models/Wallet");
const WalletTransaction = require("../models/WalletTransaction");
const { recordActivity } = require("../Utils/activityLogger");

const getCurrentUserId = (req) => String(req.user._id || req.user.id);

function roundToTwo(num) {
    return Math.round((Number(num) + Number.EPSILON) * 100) / 100;
}

const ensureWalletBalances = async (wallet) => {
    let dirty = false;
    if (wallet.earnedBalance === undefined || wallet.earnedBalance === null) {
        wallet.earnedBalance = 0;
        dirty = true;
    }
    if (wallet.topupBalance === undefined || wallet.topupBalance === null) {
        wallet.topupBalance = 0;
        dirty = true;
    }
    // Legacy wallet migration: if wallet had balance > 0 but earned/topup both 0, attribute to earnedBalance
    if (wallet.balance > 0 && wallet.earnedBalance === 0 && wallet.topupBalance === 0) {
        wallet.earnedBalance = wallet.balance;
        dirty = true;
    }
    const combined = roundToTwo(wallet.earnedBalance + wallet.topupBalance);
    if (wallet.balance !== combined) {
        wallet.balance = combined;
        dirty = true;
    }
    if (dirty) {
        await wallet.save();
    }
    return wallet;
};

// GET WALLET BALANCE & TRANSACTIONS
const getWallet = async (req, res) => {
    try {
        const userId = getCurrentUserId(req);

        let wallet = await Wallet.findOne({ user: userId });
        if (!wallet) {
            wallet = await Wallet.create({
                user: userId,
                balance: 0,
                earnedBalance: 0,
                topupBalance: 0,
                currency: "INR"
            });
        } else {
            await ensureWalletBalances(wallet);
        }

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

        let wallet = await Wallet.findOne({ user: userId });
        if (!wallet) {
            wallet = await Wallet.create({
                user: userId,
                balance: 0,
                earnedBalance: 0,
                topupBalance: 0,
                currency: "INR"
            });
        } else {
            await ensureWalletBalances(wallet);
        }

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

        let wallet = await Wallet.findOne({ user: userId });
        if (!wallet) {
            wallet = await Wallet.create({
                user: userId,
                balance: 0,
                earnedBalance: 0,
                topupBalance: 0,
                currency: "INR"
            });
        } else {
            await ensureWalletBalances(wallet);
        }

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
