import { useEffect, useState, useMemo } from "react";
import { Wallet, ArrowUpRight, PlusCircle, CheckCircle2, Clock, Search, Filter, ArrowDownLeft, ExternalLink } from "lucide-react";
import WalletModal from "../../Components/wallet/WalletModal";
import "./MentorDashboard.css";

const levelPercent = { Beginner: 25, Intermediate: 50, Advanced: 75, Expert: 100 };

function MentorDashboard({ token, onHome, onBookings }) {
    const [dashboard, setDashboard] = useState(null);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("studio"); // "studio" | "earnings"
    
    // Wallet modal state
    const [isWalletOpen, setIsWalletOpen] = useState(false);
    const [walletInitialTab, setWalletInitialTab] = useState("topup");

    // Earnings ledger filters
    const [statusFilter, setStatusFilter] = useState("all"); // "all" | "credited" | "pending"
    const [searchQuery, setSearchQuery] = useState("");

    async function loadDashboard() {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/dashboard/mentor`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Unable to load mentor dashboard");
            setDashboard(data.dashboard);
        } catch (loadError) {
            setError(loadError.message);
        }
    }

    useEffect(() => {
        if (token) loadDashboard();
    }, [token]);

    const earnings = dashboard?.earnings || {
        totalEarnings: 0,
        walletBalance: 0,
        pendingSettlement: 0,
        thisMonthEarnings: 0,
        history: []
    };

    const filteredHistory = useMemo(() => {
        const list = earnings.history || [];
        return list.filter((item) => {
            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "credited" && item.isCredited) ||
                (statusFilter === "pending" && !item.isCredited);

            const q = searchQuery.trim().toLowerCase();
            const matchesQuery =
                !q ||
                item.learnerName?.toLowerCase().includes(q) ||
                item.learnerEmail?.toLowerCase().includes(q) ||
                item.date?.toLowerCase().includes(q);

            return matchesStatus && matchesQuery;
        });
    }, [earnings.history, statusFilter, searchQuery]);

    if (error) return <main className="mentor-studio mentor-state"><h2>Unable to load teaching studio</h2><p>{error}</p></main>;
    if (!dashboard) return <main className="mentor-studio mentor-state"><p>Preparing your teaching studio…</p></main>;

    const skills = dashboard.skillsToTeach || [];
    const skillLevels = dashboard.teachingSkillLevels || {};
    const status = dashboard.statusBreakdown || {};
    const months = dashboard.monthlySessions || [];
    const maxSessions = Math.max(...months.map((item) => item.sessions), 1);

    const historyAllCount = earnings.history?.length || 0;
    const historyCreditedCount = earnings.history?.filter((i) => i.isCredited).length || 0;
    const historyPendingCount = earnings.history?.filter((i) => !i.isCredited).length || 0;

    return (
        <main className="mentor-studio">
            {/* HERO HEADER */}
            <section className="mentor-hero">
                <div>
                    <p className="mentor-kicker">TEACHING STUDIO & EARNINGS / {new Date().getFullYear()}</p>
                    <h1>
                        {activeTab === "studio" ? (
                            <>Make every session<br /><em>count.</em></>
                        ) : (
                            <>Your teaching revenue<br /><em>& payouts.</em></>
                        )}
                    </h1>
                    <p className="mentor-lede">
                        {activeTab === "studio"
                            ? "A live view of your teaching practice, learner reach and mentoring rhythm."
                            : "Track session earnings, monitor 3% platform deductions, and withdraw funds directly to your bank via UPI."}
                    </p>

                    {/* VIEW SWITCHER TABS */}
                    <div className="mentor-view-switcher" role="tablist">
                        <button
                            type="button"
                            role="tab"
                            aria-selected={activeTab === "studio"}
                            className={`mentor-tab-pill ${activeTab === "studio" ? "active" : ""}`}
                            onClick={() => setActiveTab("studio")}
                        >
                            Studio Overview
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={activeTab === "earnings"}
                            className={`mentor-tab-pill ${activeTab === "earnings" ? "active" : ""}`}
                            onClick={() => setActiveTab("earnings")}
                        >
                            Earnings & Payouts
                            {earnings.walletBalance > 0 && (
                                <span className="mentor-tab-badge">₹{earnings.walletBalance.toLocaleString("en-IN")}</span>
                            )}
                        </button>
                    </div>
                </div>

                <div className="mentor-hero-actions">
                    {activeTab === "earnings" ? (
                        <div className="mentor-wallet-quick-actions">
                            <button
                                type="button"
                                onClick={() => {
                                    setWalletInitialTab("withdraw");
                                    setIsWalletOpen(true);
                                }}
                                className="mentor-action-primary"
                                disabled={earnings.walletBalance < 100}
                                title={earnings.walletBalance < 100 ? "Minimum withdrawal is ₹100" : "Request UPI Withdrawal"}
                            >
                                Request Payout <span>↗</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setWalletInitialTab("topup");
                                    setIsWalletOpen(true);
                                }}
                                className="mentor-action-secondary"
                            >
                                <Wallet size={15} /> Open Wallet
                            </button>
                        </div>
                    ) : (
                        <>
                            <button onClick={onBookings} className="mentor-action-primary">
                                Open sessions <span>↗</span>
                            </button>
                            <button onClick={onHome} className="mentor-action-link">Home</button>
                        </>
                    )}
                </div>
            </section>

            {/* TAB 1: STUDIO VIEW */}
            {activeTab === "studio" && (
                <>
                    <section className="mentor-scoreline" aria-label="Teaching statistics">
                        <div><strong>{dashboard.learnersTaught || 0}</strong><span>Learners<br />taught</span></div>
                        <div><strong>{dashboard.completedSessions || 0}</strong><span>Sessions<br />completed</span></div>
                        <div><strong>{dashboard.averageRating ? Number(dashboard.averageRating).toFixed(1) : "—"}</strong><span>Average<br />rating</span></div>
                        <div
                            className="scoreline-earnings-shortcut"
                            onClick={() => setActiveTab("earnings")}
                            title="View full earnings dashboard"
                            role="button"
                            tabIndex={0}
                        >
                            <strong>₹{(earnings.totalEarnings || 0).toLocaleString("en-IN")}</strong>
                            <span>Lifetime<br />Earnings ↗</span>
                        </div>
                    </section>

                    <section className="mentor-workbench">
                        <div className="mentor-skill-field">
                            <div className="mentor-section-heading"><p>01 / TEACHING RANGE</p><h2>Your skill depth</h2></div>
                            <div className="mentor-skill-bars">
                                {skills.length ? skills.map((skill) => {
                                    const level = skillLevels[skill] || skillLevels[skill.toLowerCase()] || "Beginner";
                                    return <div className="mentor-skill-row" key={skill}>
                                        <div><strong>{skill}</strong><span>{level}</span></div>
                                        <div className="mentor-skill-track"><i style={{ width: `${levelPercent[level] || 25}%` }} /></div>
                                    </div>;
                                }) : <p className="mentor-empty">Add teaching skills from your profile to map your expertise.</p>}
                            </div>
                        </div>

                        <div className="mentor-flow-field">
                            <div className="mentor-section-heading"><p>02 / SESSION FLOW</p><h2>From request to impact</h2></div>
                            <div className="mentor-flow-line">
                                <div><b>{status.pending || 0}</b><span>New requests</span></div><i />
                                <div><b>{status.accepted || 0}</b><span>Confirmed</span></div><i />
                                <div className="flow-complete"><b>{status.completed || 0}</b><span>Delivered</span></div>
                            </div>
                            <p className="mentor-flow-note">{dashboard.ratingCount || 0} learner ratings collected after completed sessions.</p>
                        </div>
                    </section>

                    <section className="mentor-rhythm">
                        <div className="mentor-section-heading"><p>03 / MONTHLY RHYTHM</p><h2>Teaching momentum</h2></div>
                        <div className="mentor-rhythm-chart">
                            {months.length ? months.map((item) => <div className="mentor-rhythm-bar" key={item.month}>
                                <strong>{item.sessions}</strong><i style={{ height: `${Math.max((item.sessions / maxSessions) * 100, 9)}%` }} /><span>{item.month.slice(5)}</span><small>{item.learners} learners</small>
                            </div>) : <p className="mentor-empty">Your completed sessions will form a monthly teaching timeline here.</p>}
                        </div>
                    </section>
                </>
            )}

            {/* TAB 2: EARNINGS & PAYOUTS VIEW */}
            {activeTab === "earnings" && (
                <div className="mentor-earnings-view">
                    {/* TOP SUMMARY CARDS */}
                    <section className="earnings-summary-grid">
                        <div className="earnings-stat-card primary">
                            <div className="stat-card-header">
                                <span className="stat-kicker">LIFETIME REVENUE</span>
                                <span className="stat-icon-wrap">₹</span>
                            </div>
                            <strong className="stat-amount">₹{(earnings.totalEarnings || 0).toLocaleString("en-IN")}</strong>
                            <p className="stat-subtext">Net credited income across all completed sessions.</p>
                        </div>

                        <div className="earnings-stat-card wallet-highlight">
                            <div className="stat-card-header">
                                <span className="stat-kicker">WALLET BALANCE</span>
                                <span className="stat-live-badge">● Live</span>
                            </div>
                            <strong className="stat-amount">₹{(earnings.walletBalance || 0).toLocaleString("en-IN")}</strong>
                            <div className="stat-card-actions">
                                <button
                                    type="button"
                                    className="btn-card-action withdraw"
                                    onClick={() => {
                                        setWalletInitialTab("withdraw");
                                        setIsWalletOpen(true);
                                    }}
                                    disabled={earnings.walletBalance < 100}
                                >
                                    Withdraw
                                </button>
                                <button
                                    type="button"
                                    className="btn-card-action topup"
                                    onClick={() => {
                                        setWalletInitialTab("topup");
                                        setIsWalletOpen(true);
                                    }}
                                >
                                    + Top Up
                                </button>
                            </div>
                        </div>

                        <div className="earnings-stat-card">
                            <div className="stat-card-header">
                                <span className="stat-kicker">PENDING SETTLEMENT</span>
                                <Clock size={16} color="#b45309" />
                            </div>
                            <strong className="stat-amount">₹{(earnings.pendingSettlement || 0).toLocaleString("en-IN")}</strong>
                            <p className="stat-subtext">Awaiting payment verification or offline processing.</p>
                        </div>

                        <div className="earnings-stat-card">
                            <div className="stat-card-header">
                                <span className="stat-kicker">THIS MONTH</span>
                                <span className="stat-badge-cal">{new Date().toLocaleString("en-IN", { month: "short" })}</span>
                            </div>
                            <strong className="stat-amount">₹{(earnings.thisMonthEarnings || 0).toLocaleString("en-IN")}</strong>
                            <p className="stat-subtext">Total earnings generated in {new Date().toLocaleString("en-IN", { month: "long" })}.</p>
                        </div>
                    </section>

                    {/* POLICY / FEE NOTICE */}
                    <div className="mentor-fee-policy-note">
                        <div className="policy-icon-box">i</div>
                        <div className="policy-text">
                            <strong>Platform Fee Policy (3%):</strong> Skill Exchange deducts a transparent 3% mentor fee on verified completed sessions to maintain booking infrastructure, video security, and automated dispute resolution. Learner convenience fees (if any) are never deducted from your payout.
                        </div>
                    </div>

                    {/* TRANSACTION / PAYOUT LEDGER */}
                    <section className="earnings-ledger-section">
                        <div className="ledger-header-bar">
                            <div>
                                <p className="mentor-kicker">LEDGER / SESSION BREAKDOWN</p>
                                <h2>Session Payout History</h2>
                            </div>

                            {/* SEARCH AND FILTERS */}
                            <div className="ledger-controls">
                                <div className="ledger-search-box">
                                    <Search size={15} />
                                    <input
                                        type="text"
                                        placeholder="Search learner or date…"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            className="btn-clear-search"
                                            onClick={() => setSearchQuery("")}
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>

                                <div className="ledger-filter-pills">
                                    <button
                                        type="button"
                                        className={`filter-pill ${statusFilter === "all" ? "active" : ""}`}
                                        onClick={() => setStatusFilter("all")}
                                    >
                                        All ({historyAllCount})
                                    </button>
                                    <button
                                        type="button"
                                        className={`filter-pill ${statusFilter === "credited" ? "active" : ""}`}
                                        onClick={() => setStatusFilter("credited")}
                                    >
                                        Credited ({historyCreditedCount})
                                    </button>
                                    <button
                                        type="button"
                                        className={`filter-pill ${statusFilter === "pending" ? "active" : ""}`}
                                        onClick={() => setStatusFilter("pending")}
                                    >
                                        Pending ({historyPendingCount})
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* LEDGER TABLE */}
                        {filteredHistory.length === 0 ? (
                            <div className="empty-ledger-box">
                                <p>No session payout records found matching your filters.</p>
                            </div>
                        ) : (
                            <div className="ledger-table-container">
                                <table className="ledger-table">
                                    <thead>
                                        <tr>
                                            <th>Date & Time</th>
                                            <th>Learner</th>
                                            <th>Gross Fee</th>
                                            <th>Mentor Fee (3%)</th>
                                            <th>Net Credited</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredHistory.map((row) => (
                                            <tr key={row.bookingId}>
                                                <td>
                                                    <div className="ledger-date-cell">
                                                        <strong>{row.date}</strong>
                                                        <span>{row.time} ({row.duration}m)</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="ledger-learner-cell">
                                                        <strong>{row.learnerName}</strong>
                                                        <span>{row.learnerEmail || "—"}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="fee-gross">₹{row.grossFee.toLocaleString("en-IN")}</span>
                                                </td>
                                                <td>
                                                    <span className="fee-deduction">-₹{row.platformFee.toLocaleString("en-IN")}</span>
                                                </td>
                                                <td>
                                                    <span className="fee-net">₹{row.netAmount.toLocaleString("en-IN")}</span>
                                                </td>
                                                <td>
                                                    <span className={`ledger-status-pill ${row.isCredited ? "credited" : "pending"}`}>
                                                        {row.isCredited ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                                                        {row.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </div>
            )}

            {/* WALLET MODAL */}
            {isWalletOpen && (
                <WalletModal
                    token={token}
                    initialTab={walletInitialTab}
                    onClose={() => {
                        setIsWalletOpen(false);
                        loadDashboard();
                    }}
                    onBalanceUpdated={() => {
                        loadDashboard();
                    }}
                />
            )}
        </main>
    );
}

export default MentorDashboard;

