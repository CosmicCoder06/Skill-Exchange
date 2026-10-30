const Wallet = require("../models/Wallet");
const WalletTransaction = require("../models/WalletTransaction");

function roundToTwo(num) {
    return Math.round((Number(num) + Number.EPSILON) * 100) / 100;
}

/**
 * Computes exact balances by replaying transaction records in chronological order.
 * Accepts either a userId (and queries WalletTransaction) or a raw array of transactions.
 * 
 * Rules:
 * - topup: adds to topupBalance
 * - session_earning: adds to earnedBalance
 * - withdrawal: deducts from earnedBalance only
 * - session_payment: deducts from topupBalance first, then falls back to earnedBalance
 * - refund: adds to topupBalance
 * - total balance = topupBalance + earnedBalance (sum of credits minus debits)
 */
async function computeBalancesFromLedger(transactionsOrUserId) {
    let transactions;
    if (typeof transactionsOrUserId === "string" || (transactionsOrUserId && transactionsOrUserId._bsontype)) {
        transactions = await WalletTransaction.find({ user: transactionsOrUserId }).sort({ createdAt: 1, _id: 1 });
    } else if (Array.isArray(transactionsOrUserId)) {
        transactions = [...transactionsOrUserId].sort((a, b) => {
            const timeA = new Date(a.createdAt || 0).getTime();
            const timeB = new Date(b.createdAt || 0).getTime();
            return timeA - timeB;
        });
    } else {
        return null;
    }

    if (!transactions || transactions.length === 0) {
        return null;
    }

    let topupBalance = 0;
    let earnedBalance = 0;

    for (const tx of transactions) {
        const amt = roundToTwo(tx.amount);
        const type = tx.type;

        if (type === "topup") {
            topupBalance = roundToTwo(topupBalance + Math.abs(amt));
        } else if (type === "session_earning") {
            earnedBalance = roundToTwo(earnedBalance + Math.abs(amt));
        } else if (type === "withdrawal") {
            earnedBalance = Math.max(0, roundToTwo(earnedBalance - Math.abs(amt)));
        } else if (type === "session_payment") {
            const spend = Math.abs(amt);
            const deductFromTopup = Math.min(topupBalance, spend);
            topupBalance = roundToTwo(topupBalance - deductFromTopup);
            const remainingSpend = roundToTwo(spend - deductFromTopup);
            if (remainingSpend > 0) {
                earnedBalance = Math.max(0, roundToTwo(earnedBalance - remainingSpend));
            }
        } else if (type === "refund") {
            topupBalance = roundToTwo(topupBalance + Math.abs(amt));
        } else {
            // Generic/other transactions
            if (amt > 0) {
                topupBalance = roundToTwo(topupBalance + amt);
            } else {
                const spend = Math.abs(amt);
                const deductFromTopup = Math.min(topupBalance, spend);
                topupBalance = roundToTwo(topupBalance - deductFromTopup);
                const remainingSpend = roundToTwo(spend - deductFromTopup);
                if (remainingSpend > 0) {
                    earnedBalance = Math.max(0, roundToTwo(earnedBalance - remainingSpend));
                }
            }
        }
    }

    const balance = roundToTwo(topupBalance + earnedBalance);
    return {
        balance,
        topupBalance,
        earnedBalance
    };
}

/**
 * Finds or creates a user's wallet and synchronizes its stored balances with the transaction ledger.
 */
async function getOrCreateReconciledWallet(userId) {
    let wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
        wallet = await Wallet.create({
            user: userId,
            balance: 0,
            earnedBalance: 0,
            topupBalance: 0,
            currency: "INR"
        });
    }

    const ledger = await computeBalancesFromLedger(userId);
    let dirty = false;

    if (ledger !== null) {
        if (wallet.balance !== ledger.balance ||
            wallet.topupBalance !== ledger.topupBalance ||
            wallet.earnedBalance !== ledger.earnedBalance) {
            wallet.balance = ledger.balance;
            wallet.topupBalance = ledger.topupBalance;
            wallet.earnedBalance = ledger.earnedBalance;
            dirty = true;
        }
    } else {
        if (wallet.earnedBalance === undefined || wallet.earnedBalance === null) {
            wallet.earnedBalance = 0;
            dirty = true;
        }
        if (wallet.topupBalance === undefined || wallet.topupBalance === null) {
            wallet.topupBalance = 0;
            dirty = true;
        }
        if (wallet.balance > 0 && wallet.earnedBalance === 0 && wallet.topupBalance === 0) {
            wallet.earnedBalance = wallet.balance;
            dirty = true;
        }
        const combined = roundToTwo(wallet.earnedBalance + wallet.topupBalance);
        if (wallet.balance !== combined) {
            wallet.balance = combined;
            dirty = true;
        }
    }

    if (dirty) {
        await wallet.save();
    }

    return wallet;
}

module.exports = {
    roundToTwo,
    computeBalancesFromLedger,
    getOrCreateReconciledWallet
};
