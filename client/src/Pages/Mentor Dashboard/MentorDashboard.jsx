import { useEffect, useState, useMemo } from "react";
import { ArrowUpRight, CheckCircle2, Clock, Search, Filter, ExternalLink, AlertCircle, ShieldCheck } from "lucide-react";
import "./MentorDashboard.css";

const levelPercent = { Beginner: 25, Intermediate: 50, Advanced: 75, Expert: 100 };

function MentorDashboard({ token, onHome, onBookings }) {
    const [dashboard, setDashboard] = useState(null);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("studio"); // "studio" | "earnings"

    // Earnings ledger filters
    const [statusFilter, setStatusFilter] = useState("all"); // "all" | "settled" | "pending" | "in_escrow" | "not_payable"
    const [searchQuery, setSearchQuery] = useState("");

    // Payout UPI ID inline management
    const [payoutUpi, setPayoutUpi] = useState("");
    const [isEditingUpi, setIsEditingUpi] = useState(false);
    const [savingUpi, setSavingUpi] = useState(false);
    const [upiSavedMsg, setUpiSavedMsg] = useState("");

    async function loadDashboard() {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/dashboard/mentor`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Unable to load mentor dashboard");
            setDashboard(data.dashboard);
            if (data.dashboard?.earnings?.payoutUpiId) {
                setPayoutUpi(data.dashboard.earnings.payoutUpiId);
            }
        } catch (loadError) {
            setError(loadError.message);
        }
    }

    useEffect(() => {
        if (token) loadDashboard();
    }, [token]);

    const earnings = dashboard?.earnings || {
        totalEarnings: 0,
        lifetimeRevenue: 0,
        settledPayouts: 0,
        walletBalance: 0,
        pendingSettlement: 0,
        inEscrow: 0,
        thisMonthEarnings: 0,
        counts: { all: 0, settled: 0, pending: 0, in_escrow: 0, not_payable: 0 },
        payoutUpiId: "",
        history: []
    };

    async function handleSaveUpi(e) {
        e.preventDefault();
        const trimmed = payoutUpi.trim();
        if (!trimmed) return;

        try {
            setSavingUpi(true);
            const response = await fetch(`${import.meta.env.VITE_API_URL}/profile/update`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ payoutUpiId: trimmed })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Unable to update UPI ID");

            setUpiSavedMsg("Payout UPI ID saved successfully!");
            setIsEditingUpi(false);
            setTimeout(() => setUpiSavedMsg(""), 3500);
            await loadDashboard();
        } catch (err) {
            alert(err.message);
        } finally {
            setSavingUpi(false);
        }
    }

    const filteredHistory = useMemo(() => {
        const list = earnings.history || [];
        return list.filter((item) => {
            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "settled" && item.state === "settled") ||
                (statusFilter === "pending" && item.state === "pending_settlement") ||
                (statusFilter === "in_escrow" && item.state === "in_escrow") ||
                (statusFilter === "not_payable" && (item.state === "not_payable" || item.state === "refund_due"));

            const q = searchQuery.trim().toLowerCase();
            const matchesQuery =
                !q ||
                item.learnerName?.toLowerCase().includes(q) ||
                item.learnerEmail?.toLowerCase().includes(q) ||
                item.date?.toLowerCase().includes(q) ||
                item.status?.toLowerCase().includes(q);

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

    const counts = earnings.counts || {
        all: earnings.history?.length || 0,
        settled: earnings.history?.filter((i) => i.state === "settled").length || 0,
        pending: earnings.history?.filter((i) => i.state === "pending_settlement").length || 0,
        in_escrow: earnings.history?.filter((i) => i.state === "in_escrow").length || 0,
        not_payable: earnings.history?.filter((i) => i.state === "not_payable" || i.state === "refund_due").length || 0,
    };

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
                            : "Track session earnings, monitor 3% platform deductions, and receive payouts directly to your registered UPI ID."}
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
                            {earnings.lifetimeRevenue > 0 && (
                                <span className="mentor-tab-badge">₹{earnings.lifetimeRevenue.toLocaleString("en-IN")}</span>
                            )}
                        </button>
                    </div>
                </div>

                <div className="mentor-hero-actions">
                    {activeTab === "earnings" ? (
                        <div className="mentor-wallet-quick-actions">
                            <button
                                type="button"
                                onClick={onBookings}
                                className="mentor-action-primary"
                            >
                                View Sessions <span>↗</span>
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
                            <strong>₹{(earnings.lifetimeRevenue ?? earnings.totalEarnings ?? 0).toLocaleString("en-IN")}</strong>
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
                    {/* UPI PROMPT / BANNER */}
                    {upiSavedMsg && (
                        <div className="mentor-upi-banner alert-success">
                            <CheckCircle2 size={16} />
                            <span>{upiSavedMsg}</span>
                        </div>
                    )}

                    {!earnings.payoutUpiId ? (
                        <div className="mentor-upi-banner alert">
                            <div className="upi-banner-info">
                                <AlertCircle size={18} />
                                <div>
                                    <strong>Payout UPI ID Missing:</strong> Add your Payout UPI ID in profile to receive automated disbursements.
                                </div>
                            </div>
                            <form onSubmit={handleSaveUpi} className="upi-banner-form">
                                <input
                                    type="text"
                                    placeholder="e.g. mentor@oksbi"
                                    value={payoutUpi}
                                    onChange={(e) => setPayoutUpi(e.target.value)}
                                    required
                                />
                                <button type="submit" disabled={savingUpi}>
                                    {savingUpi ? "Saving…" : "Save UPI ID"}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="mentor-upi-banner configured">
                            <div className="upi-banner-info">
                                <CheckCircle2 size={18} />
                                <div>
                                    <strong>Registered Payout UPI ID:</strong> <code>{earnings.payoutUpiId}</code>
                                </div>
                            </div>
                            <div className="upi-banner-actions">
                                {isEditingUpi ? (
                                    <form onSubmit={handleSaveUpi} className="upi-banner-form">
                                        <input
                                            type="text"
                                            value={payoutUpi}
                                            onChange={(e) => setPayoutUpi(e.target.value)}
                                            required
                                        />
                                        <button type="submit" disabled={savingUpi}>{savingUpi ? "Saving…" : "Save"}</button>
                                        <button type="button" className="btn-cancel-upi" onClick={() => setIsEditingUpi(false)}>Cancel</button>
                                    </form>
                                ) : (
                                    <button type="button" className="btn-edit-upi" onClick={() => { setPayoutUpi(earnings.payoutUpiId); setIsEditingUpi(true); }}>
                                        Change UPI ID
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TOP SUMMARY CARDS */}
                    <section className="earnings-summary-grid">
                        <div className="earnings-stat-card primary">
                            <div className="stat-card-header">
                                <span className="stat-kicker">LIFETIME REVENUE</span>
                                <span className="stat-icon-wrap">₹</span>
                            </div>
                            <strong className="stat-amount">₹{(earnings.lifetimeRevenue ?? earnings.totalEarnings ?? 0).toLocaleString("en-IN")}</strong>
                            <p className="stat-subtext">Net earnings from completed, paid sessions (settled + pending settlement).</p>
                        </div>

                        <div className="earnings-stat-card wallet-highlight">
                            <div className="stat-card-header">
                                <span className="stat-kicker">SETTLED PAYOUTS</span>
                                <span className="stat-live-badge">● Disbursed</span>
                            </div>
                            <strong className="stat-amount">₹{(earnings.settledPayouts || 0).toLocaleString("en-IN")}</strong>
                            <p className="stat-subtext">Disbursed directly to your UPI ID by Skill Exchange admin.</p>
                        </div>

                        <div className="earnings-stat-card">
                            <div className="stat-card-header">
                                <span className="stat-kicker">PENDING SETTLEMENT</span>
                                <Clock size={16} color="#b45309" />
                            </div>
                            <strong className="stat-amount">₹{(earnings.pendingSettlement || 0).toLocaleString("en-IN")}</strong>
                            <p className="stat-subtext">Completed, paid sessions awaiting admin payout.</p>
                            <div className="stat-escrow-subline">
                                <span>In escrow:</span> <strong>₹{(earnings.inEscrow || 0).toLocaleString("en-IN")}</strong> <small>(paid, session not completed)</small>
                            </div>
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
                            <strong>Transparent Pricing Policy:</strong> Skill Exchange charges 0% platform fee and 0% application-level taxes. Mentors receive 100% of their session price.
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
                                        placeholder="Search learner, date or status…"
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
                                        All ({counts.all})
                                    </button>
                                    <button
                                        type="button"
                                        className={`filter-pill ${statusFilter === "settled" ? "active" : ""}`}
                                        onClick={() => setStatusFilter("settled")}
                                    >
                                        Settled ({counts.settled})
                                    </button>
                                    <button
                                        type="button"
                                        className={`filter-pill ${statusFilter === "pending" ? "active" : ""}`}
                                        onClick={() => setStatusFilter("pending")}
                                    >
                                        Pending ({counts.pending})
                                    </button>
                                    <button
                                        type="button"
                                        className={`filter-pill ${statusFilter === "in_escrow" ? "active" : ""}`}
                                        onClick={() => setStatusFilter("in_escrow")}
                                    >
                                        In Escrow ({counts.in_escrow})
                                    </button>
                                    <button
                                        type="button"
                                        className={`filter-pill ${statusFilter === "not_payable" ? "active" : ""}`}
                                        onClick={() => setStatusFilter("not_payable")}
                                    >
                                        Not Payable ({counts.not_payable})
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
                                            <th>Session Fee</th>
                                            <th>Platform Fee</th>
                                            <th>Earnings</th>
                                            <th>Payout Status</th>
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
                                                    <span className="fee-deduction">{row.platformFee > 0 ? `-₹${row.platformFee.toLocaleString("en-IN")}` : "₹0"}</span>
                                                </td>
                                                <td>
                                                    <span className="fee-net">₹{row.netAmount.toLocaleString("en-IN")}</span>
                                                </td>
                                                <td>
                                                    {row.state === "settled" && (
                                                        <span className="ledger-status-pill credited" title={row.payoutReference ? `Ref: ${row.payoutReference}` : "Settled"}>
                                                            <CheckCircle2 size={13} />
                                                            Settled
                                                        </span>
                                                    )}
                                                    {row.state === "pending_settlement" && (
                                                        <span className="ledger-status-pill pending">
                                                            <Clock size={13} />
                                                            Pending Settlement
                                                            {row.isLegacy && <span className="ledger-legacy-tag">Legacy</span>}
                                                        </span>
                                                    )}
                                                    {row.state === "in_escrow" && (
                                                        <span className="ledger-status-pill escrow">
                                                            <ShieldCheck size={13} />
                                                            In Escrow
                                                        </span>
                                                    )}
                                                    {row.state === "refund_due" && (
                                                        <span className="ledger-status-pill refund">
                                                            Refund Due
                                                        </span>
                                                    )}
                                                    {row.state === "not_payable" && (
                                                        <span className="ledger-status-pill neutral">
                                                            {row.status}
                                                        </span>
                                                    )}
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
        </main>
    );
}

export default MentorDashboard;
