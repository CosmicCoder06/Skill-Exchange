import { useEffect, useState } from "react";
import { Wallet as WalletIcon, ArrowDownLeft, ArrowUpRight, PlusCircle, CheckCircle2, History, SendHorizontal, AlertCircle } from "lucide-react";
import Modal from "../common/Modal";
import "./WalletModal.css";

export default function WalletModal({ token, onClose, onBalanceUpdated, initialTab = "topup" }) {
    const [balance, setBalance] = useState(0);
    const [earnedBalance, setEarnedBalance] = useState(0);
    const [topupBalance, setTopupBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(initialTab); // "topup" | "withdraw"
    
    // Top-up form state
    const [topupAmount, setTopupAmount] = useState(500);
    
    // Withdrawal form state
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [upiId, setUpiId] = useState("");
    
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const quickTopupPresets = [500, 1000, 2000, 5000];

    useEffect(() => {
        if (!token) return;
        fetchWalletData();
    }, [token]);

    async function fetchWalletData() {
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/wallet`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to load wallet");
            setBalance(data.wallet?.balance || 0);
            setEarnedBalance(data.wallet?.earnedBalance !== undefined ? data.wallet.earnedBalance : (data.wallet?.balance || 0));
            setTopupBalance(data.wallet?.topupBalance || 0);
            setTransactions(data.transactions || []);
            if (onBalanceUpdated) {
                onBalanceUpdated(data.wallet?.balance || 0);
            }
        } catch (err) {
            console.error("Wallet fetch error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleTopup() {
        const amt = Number(topupAmount);
        if (!amt || amt < 50) {
            setError("Please enter a top-up amount of at least ₹50");
            return;
        }

        setSubmitting(true);
        setError("");
        setSuccessMsg("");

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/wallet/topup`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    amount: amt
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Top-up failed");

            setBalance(data.wallet?.balance || 0);
            setEarnedBalance(data.wallet?.earnedBalance !== undefined ? data.wallet.earnedBalance : 0);
            setTopupBalance(data.wallet?.topupBalance || 0);
            setSuccessMsg(`Successfully added ₹${amt.toLocaleString("en-IN")} to your Top-Up balance!`);
            if (onBalanceUpdated) {
                onBalanceUpdated(data.wallet?.balance || 0);
            }
            await fetchWalletData();
        } catch (err) {
            console.error("Topup error:", err);
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    async function handleWithdraw() {
        const amt = Number(withdrawAmount);
        if (!amt || amt < 100) {
            setError("Minimum withdrawal amount is ₹100");
            return;
        }
        if (amt > earnedBalance) {
            setError("You can only withdraw earnings from completed sessions. Top-up balance is for session payments only and is non-withdrawable.");
            return;
        }
        if (!upiId || !upiId.includes("@")) {
            setError("Please enter a valid UPI ID (e.g., username@okhdfcbank)");
            return;
        }

        setSubmitting(true);
        setError("");
        setSuccessMsg("");

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/wallet/withdraw`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    amount: amt,
                    upiId: upiId.trim()
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Withdrawal request failed");

            setBalance(data.wallet?.balance || 0);
            setEarnedBalance(data.wallet?.earnedBalance !== undefined ? data.wallet.earnedBalance : 0);
            setTopupBalance(data.wallet?.topupBalance || 0);
            setSuccessMsg(`Payout request of ₹${amt.toLocaleString("en-IN")} sent successfully to ${upiId.trim()}!`);
            setWithdrawAmount("");
            if (onBalanceUpdated) {
                onBalanceUpdated(data.wallet?.balance || 0);
            }
            await fetchWalletData();
        } catch (err) {
            console.error("Withdrawal error:", err);
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Skill Exchange Wallet"
            eyebrow="WALLET & BILLING"
            subtitle="Load funds, avoid convenience fees, and manage payouts."
            icon={<WalletIcon size={20} color="#176b4e" />}
            maxWidth="md"
            footer={
                <button type="button" className="btn-close-footer" onClick={onClose}>
                    Close
                </button>
            }
        >
            <div className="wallet-modal-body">
                {error && (
                    <div className="wallet-alert error">
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}
                {successMsg && (
                    <div className="wallet-alert success">
                        <CheckCircle2 size={16} />
                        <span>{successMsg}</span>
                    </div>
                )}

                {/* BALANCE SUMMARY CARD */}
                <div className="wallet-balance-card">
                    <div className="balance-header-row">
                        <span className="balance-label">Available Wallet Balance</span>
                        <span className="balance-live-dot">● Live Balance</span>
                    </div>
                    <div className="balance-amount-row">
                        <span className="currency-symbol">₹</span>
                        <span className="balance-number">{balance.toLocaleString("en-IN")}</span>
                    </div>

                    <div className="balance-dual-breakdown">
                        <div className="dual-balance-item earned">
                            <div className="dual-top-row">
                                <span className="dual-label">Earned Balance</span>
                                <span className="dual-status-badge withdrawable">✓ Withdrawable</span>
                            </div>
                            <strong className="dual-amount">₹{earnedBalance.toLocaleString("en-IN")}</strong>
                            <span className="dual-desc">Credited from completed sessions</span>
                        </div>

                        <div className="dual-balance-item topup">
                            <div className="dual-top-row">
                                <span className="dual-label">Top-Up Balance</span>
                                <span className="dual-status-badge session-only">Session Payments Only</span>
                            </div>
                            <strong className="dual-amount">₹{topupBalance.toLocaleString("en-IN")}</strong>
                            <span className="dual-desc">Manually loaded funds (non-withdrawable)</span>
                        </div>
                    </div>

                    <div className="balance-perk-badge">
                        <span className="perk-star">★</span>
                        <span>0% Convenience Fee on all session bookings with wallet</span>
                    </div>
                </div>

                {/* TAB SWITCHER */}
                <div className="wallet-mode-tabs" role="tablist">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={activeTab === "topup"}
                        className={`wallet-tab-btn ${activeTab === "topup" ? "active" : ""}`}
                        onClick={() => {
                            setActiveTab("topup");
                            setError("");
                            setSuccessMsg("");
                        }}
                    >
                        <PlusCircle size={15} />
                        <span>Top Up Wallet</span>
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={activeTab === "withdraw"}
                        className={`wallet-tab-btn ${activeTab === "withdraw" ? "active" : ""}`}
                        onClick={() => {
                            setActiveTab("withdraw");
                            setError("");
                            setSuccessMsg("");
                        }}
                    >
                        <SendHorizontal size={15} />
                        <span>Request Payout</span>
                    </button>
                </div>

                {/* TAB 1: TOPUP SECTION */}
                {activeTab === "topup" && (
                    <div className="wallet-action-section">
                        <div className="action-section-header">
                            <h3>Add Funds to Wallet</h3>
                            <p className="topup-hint">Select a preset amount or enter a custom sum to load instantly.</p>
                        </div>

                        <div className="topup-presets-row">
                            {quickTopupPresets.map((preset) => {
                                const isSelected = Number(topupAmount) === preset;
                                return (
                                    <button
                                        key={preset}
                                        type="button"
                                        className={`preset-chip ${isSelected ? "active" : ""}`}
                                        onClick={() => {
                                            setTopupAmount(preset);
                                            setError("");
                                            setSuccessMsg("");
                                        }}
                                    >
                                        +₹{preset.toLocaleString("en-IN")}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="custom-amount-row">
                            <div className="input-with-currency">
                                <span className="input-rupee-sign">₹</span>
                                <input
                                    type="number"
                                    min="50"
                                    max="100000"
                                    value={topupAmount}
                                    onChange={(e) => {
                                        setTopupAmount(e.target.value);
                                        setError("");
                                        setSuccessMsg("");
                                    }}
                                    placeholder="Enter amount"
                                    className="topup-amount-input"
                                />
                            </div>
                            <button
                                type="button"
                                className="btn-action-submit"
                                disabled={submitting || !topupAmount || Number(topupAmount) < 50}
                                onClick={handleTopup}
                            >
                                {submitting ? "Processing…" : `Add ₹${(Number(topupAmount) || 0).toLocaleString("en-IN")}`}
                            </button>
                        </div>
                    </div>
                )}

                {/* TAB 2: WITHDRAWAL SECTION */}
                {activeTab === "withdraw" && (
                    <div className="wallet-action-section">
                        <div className="action-section-header">
                            <h3>Withdraw to Bank via UPI</h3>
                            <p className="topup-hint">Withdraw earned funds directly to your verified UPI ID (Min: ₹100).</p>
                            <div className="withdraw-limit-banner">
                                <span className="limit-label">Withdrawable Earned Balance:</span>
                                <strong className="limit-val">₹{earnedBalance.toLocaleString("en-IN")}</strong>
                            </div>
                        </div>

                        <div className="withdraw-inputs-container">
                            <div className="input-field-group">
                                <label className="input-field-label">UPI ID / VPA</label>
                                <input
                                    type="text"
                                    placeholder="e.g. mentor@oksbi or mobile@upi"
                                    value={upiId}
                                    onChange={(e) => {
                                        setUpiId(e.target.value);
                                        setError("");
                                    }}
                                    className="wallet-text-input"
                                />
                            </div>

                            <div className="input-field-group">
                                <div className="input-label-row">
                                    <label className="input-field-label">Withdrawal Amount</label>
                                    <button
                                        type="button"
                                        className="btn-max-amount"
                                        onClick={() => {
                                            setWithdrawAmount(earnedBalance);
                                            setError("");
                                        }}
                                        disabled={earnedBalance < 100}
                                    >
                                        Max (₹{earnedBalance.toLocaleString("en-IN")})
                                    </button>
                                </div>
                                <div className="custom-amount-row">
                                    <div className="input-with-currency">
                                        <span className="input-rupee-sign">₹</span>
                                        <input
                                            type="number"
                                            min="100"
                                            max={earnedBalance}
                                            value={withdrawAmount}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setWithdrawAmount(val);
                                                if (Number(val) > earnedBalance) {
                                                    setError("You can only withdraw earnings from completed sessions. Top-up balance is for session payments only and is non-withdrawable.");
                                                } else {
                                                    setError("");
                                                }
                                            }}
                                            placeholder="Enter amount (min ₹100)"
                                            className="topup-amount-input"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        className="btn-action-submit withdraw"
                                        disabled={submitting || !withdrawAmount || Number(withdrawAmount) < 100 || Number(withdrawAmount) > earnedBalance || !upiId}
                                        onClick={handleWithdraw}
                                    >
                                        {submitting ? "Sending…" : `Withdraw ₹${(Number(withdrawAmount) || 0).toLocaleString("en-IN")}`}
                                    </button>
                                </div>
                                {earnedBalance < 100 && (
                                    <p className="min-withdraw-note">
                                        * You need at least ₹100 in Earned Balance to request a payout.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* TRANSACTION HISTORY */}
                <div className="wallet-transactions-section">
                    <div className="tx-section-header">
                        <h3><History size={16} /> Transaction History</h3>
                        <span className="tx-count">{transactions.length} entries</span>
                    </div>

                    {loading ? (
                        <div className="tx-loading-spinner">Loading transaction ledger…</div>
                    ) : transactions.length === 0 ? (
                        <div className="empty-transactions-box">
                            <p>No transactions yet. Top up your wallet or complete sessions to see activity.</p>
                        </div>
                    ) : (
                        <div className="transactions-list">
                            {transactions.map((tx) => {
                                const isCredit = tx.amount > 0;
                                return (
                                    <div key={tx._id} className="transaction-row-card">
                                        <div className="tx-left">
                                            <div className={`tx-icon-circle ${isCredit ? "credit" : "debit"}`}>
                                                {isCredit ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                                            </div>
                                            <div className="tx-info-block">
                                                <strong className="tx-description">
                                                    {tx.description || (isCredit ? "Wallet Credit" : "Session Payment")}
                                                </strong>
                                                <span className="tx-date">
                                                    {new Date(tx.createdAt).toLocaleDateString("en-IN", {
                                                        day: "numeric",
                                                        month: "short",
                                                        hour: "2-digit",
                                                        minute: "2-digit"
                                                    })}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="tx-right">
                                            <span className={`tx-amount-badge ${isCredit ? "credit" : "debit"}`}>
                                                {isCredit ? "+" : "-"}₹{Math.abs(tx.amount).toLocaleString("en-IN")}
                                            </span>
                                            <span className="tx-balance-after">
                                                Bal: ₹{tx.balanceAfter.toLocaleString("en-IN")}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
