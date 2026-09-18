import { useEffect, useMemo, useState } from "react";
import {
    BookOpen,
    Clock,
    Users,
    Sparkles,
    ArrowUpRight,
    CheckCircle2,
    Calendar,
    Award,
    TrendingUp,
    ChevronRight,
    UserCheck
} from "lucide-react";
import "./LearnerDashboard.css";

function LearnerDashboard({
    token,
    onHome,
    onProfile,
    onLogout,
    onBookings,
}) {
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("journey"); // "journey" | "curriculum"

    useEffect(() => {
        async function fetchDashboard() {
            try {
                setLoading(true);
                setError("");

                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/dashboard/learner`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message || "Unable to load learner dashboard"
                    );
                }

                setDashboard(data.dashboard);
            } catch (requestError) {
                console.error("Learner dashboard error:", requestError);
                setError(requestError.message || "Unable to load dashboard");
            } finally {
                setLoading(false);
            }
        }

        if (token) fetchDashboard();
    }, [token]);

    const skillsToLearn = useMemo(
        () =>
            (dashboard?.skillsToLearn || []).filter(
                (skill) => typeof skill === "string" && skill.trim()
            ),
        [dashboard]
    );

    const skillsToTeach = useMemo(
        () =>
            (dashboard?.skillsToTeach || []).filter(
                (skill) => typeof skill === "string" && skill.trim()
            ),
        [dashboard]
    );

    const availability = useMemo(
        () =>
            (dashboard?.availability || []).filter(
                (item) => typeof item === "string" && item.trim()
            ),
        [dashboard]
    );

    const totalSkills = skillsToLearn.length + skillsToTeach.length;

    const profileScore = dashboard?.profileCompleted
        ? 100
        : Math.min(
              100,
              (skillsToLearn.length > 0 ? 25 : 0) +
                  (skillsToTeach.length > 0 ? 25 : 0) +
                  (dashboard?.bio?.trim() ? 25 : 0) +
                  (availability.length > 0 ? 25 : 0)
          );

    const sessionsAttended = dashboard?.sessionsAttended ?? 0;
    const learningHours = dashboard?.learningHours ?? 0;
    const mentorsConnected = dashboard?.mentorsConnected ?? 0;
    const skillsExploredCount =
        dashboard?.skillsExploredCount ?? (skillsToLearn.length || 0);

    const monthlyLearning = dashboard?.monthlyLearning || [];
    const maxMonthlySessions = Math.max(
        ...monthlyLearning.map((item) => item.sessions || 1),
        1
    );

    if (loading) {
        return (
            <main className="learner-dashboard learner-studio learner-state">
                <div className="learner-loading-box">
                    <div className="learner-spinner"></div>
                    <h2>Preparing your learning studio…</h2>
                    <p>Fetching your progress, goals, and upcoming sessions.</p>
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="learner-dashboard learner-studio learner-state">
                <h2>Unable to load learning studio</h2>
                <p>{error}</p>
                <button
                    type="button"
                    className="learner-action-primary"
                    onClick={onHome}
                >
                    Return Home
                </button>
            </main>
        );
    }

    return (
        <main className="learner-dashboard learner-studio">
            {/* HERO SECTION */}
            <section className="learner-hero">
                <div>
                    <p className="learner-kicker">
                        LEARNING JOURNEY & MASTERY / {new Date().getFullYear()}
                    </p>
                    <h1>
                        {activeTab === "journey" ? (
                            <>
                                Turn curious questions<br />
                                <em>into real mastery.</em>
                            </>
                        ) : (
                            <>
                                Your learning goals<br />
                                <em>& curriculum.</em>
                            </>
                        )}
                    </h1>
                    <p className="learner-lede">
                        {activeTab === "journey"
                            ? "A dedicated workspace for your learning growth. Track session progress, build lasting skills with top mentors, and measure your personal momentum."
                            : "Organize your target competencies, balance what you learn and share, and keep your development roadmap actionable."}
                    </p>

                    {/* VIEW SWITCHER PILL TOGGLES */}
                    <div className="learner-view-switcher" role="tablist">
                        <button
                            type="button"
                            role="tab"
                            aria-selected={activeTab === "journey"}
                            className={`learner-tab-pill ${
                                activeTab === "journey" ? "active" : ""
                            }`}
                            onClick={() => setActiveTab("journey")}
                        >
                            <TrendingUp size={15} />
                            Journey Overview
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={activeTab === "curriculum"}
                            className={`learner-tab-pill ${
                                activeTab === "curriculum" ? "active" : ""
                            }`}
                            onClick={() => setActiveTab("curriculum")}
                        >
                            <BookOpen size={15} />
                            Curriculum & Goals
                            {skillsToLearn.length > 0 && (
                                <span className="learner-tab-badge">
                                    {skillsToLearn.length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* HERO ACTIONS */}
                <div className="learner-hero-actions">
                    <button
                        type="button"
                        className="learner-action-secondary"
                        onClick={onBookings}
                    >
                        <Clock size={15} />
                        My Sessions
                        {dashboard?.upcomingSessions > 0 && (
                            <span className="hero-upcoming-bubble">
                                {dashboard.upcomingSessions}
                            </span>
                        )}
                    </button>
                    <button
                        type="button"
                        className="learner-action-primary"
                        onClick={onHome}
                    >
                        Explore Mentors
                        <span>↗</span>
                    </button>
                </div>
            </section>

            {/* STATS SCORELINE (4-COLUMN GRID MATCHING MENTOR PATTERN) */}
            <section className="learner-scoreline" aria-label="Learning metrics summary">
                <div>
                    <strong>{sessionsAttended}</strong>
                    <span>
                        Sessions
                        <br />
                        Attended
                    </span>
                </div>
                <div>
                    <strong>{learningHours}h</strong>
                    <span>
                        Hours of
                        <br />
                        Live Learning
                    </span>
                </div>
                <div>
                    <strong>{mentorsConnected}</strong>
                    <span>
                        Mentors
                        <br />
                        Connected
                    </span>
                </div>
                <div>
                    <strong>{skillsExploredCount}</strong>
                    <span>
                        Skills
                        <br />
                        Explored
                    </span>
                </div>
            </section>

            {/* MAIN WORKBENCH GRID */}
            {activeTab === "journey" ? (
                <section className="learner-workbench">
                    {/* LEFT COLUMN: ACTIVE GOALS & RHYTHM */}
                    <div className="learner-workbench-col">
                        <div className="learner-section-heading">
                            <p>CURRENT FOCUS</p>
                            <h2>Active learning targets</h2>
                        </div>

                        {skillsToLearn.length > 0 ? (
                            <div className="learner-skill-bars">
                                {skillsToLearn.map((skill, index) => {
                                    const progress = Math.max(
                                        25,
                                        Math.min(100, 90 - index * 18)
                                    );
                                    return (
                                        <div
                                            className="learner-skill-row"
                                            key={`${skill}-${index}`}
                                        >
                                            <div>
                                                <strong>{skill}</strong>
                                                <span>
                                                    Milestone {index + 1} • {progress}%
                                                </span>
                                            </div>
                                            <div className="learner-skill-track">
                                                <i style={{ width: `${progress}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="learner-empty-card">
                                <p>No active learning targets set yet.</p>
                                <button
                                    type="button"
                                    className="learner-link-btn"
                                    onClick={onProfile}
                                >
                                    + Add skills to learn in Profile
                                </button>
                            </div>
                        )}

                        {/* LEARNING RHYTHM CHART */}
                        <div className="learner-rhythm-section">
                            <div className="learner-section-heading">
                                <p>LEARNING RHYTHM</p>
                                <h2>Session momentum</h2>
                            </div>

                            {monthlyLearning.length > 0 ? (
                                <div className="learner-rhythm-chart">
                                    {monthlyLearning.map((item) => {
                                        const barHeight = Math.max(
                                            15,
                                            Math.round(
                                                ((item.sessions || 1) /
                                                    maxMonthlySessions) *
                                                    175
                                            )
                                        );
                                        return (
                                            <div
                                                className="learner-rhythm-bar"
                                                key={item.month}
                                            >
                                                <strong>
                                                    {item.sessions} ses
                                                </strong>
                                                <i style={{ height: `${barHeight}px` }} />
                                                <span>{item.month}</span>
                                                <small>{item.hours} hrs</small>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="learner-empty-chart">
                                    <div className="empty-chart-bars">
                                        <div style={{ height: "40px" }}></div>
                                        <div style={{ height: "70px" }}></div>
                                        <div style={{ height: "110px" }}></div>
                                        <div style={{ height: "85px" }}></div>
                                    </div>
                                    <p>
                                        Complete your first live session to unlock
                                        your monthly learning momentum chart.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: PROGRESSION & AVAILABILITY */}
                    <div className="learner-workbench-col learner-flow-field">
                        <div className="learner-section-heading">
                            <p>LEARNING PROTOCOL</p>
                            <h2>How you build mastery</h2>
                        </div>

                        <div className="learner-flow-line">
                            <div className={skillsToLearn.length > 0 ? "flow-complete" : ""}>
                                <b>1</b>
                                <span>Choose Goal</span>
                            </div>
                            <i></i>
                            <div className={sessionsAttended > 0 ? "flow-complete" : ""}>
                                <b>2</b>
                                <span>1-on-1 Session</span>
                            </div>
                            <i></i>
                            <div className={sessionsAttended >= 3 ? "flow-complete" : ""}>
                                <b>3</b>
                                <span>Apply & Retain</span>
                            </div>
                        </div>

                        <p className="learner-flow-note">
                            Every completed session reinforces knowledge transfer. Book
                            1-on-1 time with mentors to review real projects, ask deep
                            questions, and accelerate your craft.
                        </p>

                        {/* WEEKLY AVAILABILITY */}
                        <div className="learner-week-panel">
                            <div className="learner-section-heading">
                                <p>WEEKLY CADENCE</p>
                                <h2>Your availability rhythm</h2>
                            </div>

                            <div className="learner-week-bars">
                                {[
                                    "Mon",
                                    "Tue",
                                    "Wed",
                                    "Thu",
                                    "Fri",
                                    "Sat",
                                    "Sun",
                                ].map((day, index) => {
                                    const active =
                                        availability.length > 0 &&
                                        index <
                                            Math.min(availability.length, 7);

                                    return (
                                        <div className="learner-week-col" key={day}>
                                            <div className="bar-slot">
                                                <div
                                                    className={`week-bar ${
                                                        active ? "active" : ""
                                                    }`}
                                                    style={{
                                                        height: active
                                                            ? `${
                                                                  40 +
                                                                  ((index + 1) %
                                                                      4) *
                                                                      16
                                                              }%`
                                                            : "14%",
                                                    }}
                                                />
                                            </div>
                                            <span>{day}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="learner-availability-meta">
                                <span className="meta-pulse-dot"></span>
                                <p>
                                    <strong>{availability.length}</strong> weekly
                                    availability preference
                                    {availability.length !== 1 ? "s" : ""} registered.
                                </p>
                            </div>
                        </div>

                        {/* QUICK SHORTCUTS */}
                        <div className="learner-quick-grid">
                            <button
                                type="button"
                                className="learner-quick-card"
                                onClick={onBookings}
                            >
                                <Clock size={16} />
                                <div>
                                    <strong>My Sessions</strong>
                                    <span>Manage bookings & upcoming slots</span>
                                </div>
                                <ArrowUpRight size={14} />
                            </button>

                            <button
                                type="button"
                                className="learner-quick-card"
                                onClick={onProfile}
                            >
                                <UserCheck size={16} />
                                <div>
                                    <strong>Update Profile</strong>
                                    <span>Adjust learning goals & preferences</span>
                                </div>
                                <ArrowUpRight size={14} />
                            </button>
                        </div>
                    </div>
                </section>
            ) : (
                /* TAB 2: CURRICULUM & GOALS VIEW */
                <section className="learner-curriculum-view">
                    <div className="curriculum-summary-grid">
                        {/* CARD 1: LEARNING GOALS COUNT */}
                        <div className="curriculum-stat-card">
                            <div className="stat-card-header">
                                <span className="stat-kicker">WANT TO LEARN</span>
                                <div className="stat-icon-wrap">
                                    <BookOpen size={14} />
                                </div>
                            </div>
                            <div className="stat-amount">{skillsToLearn.length}</div>
                            <p className="stat-subtext">
                                Target competencies you are actively pursuing
                            </p>
                        </div>

                        {/* CARD 2: SHARING BALANCE */}
                        <div className="curriculum-stat-card">
                            <div className="stat-card-header">
                                <span className="stat-kicker">SKILLS TO SHARE</span>
                                <div className="stat-icon-wrap">
                                    <Users size={14} />
                                </div>
                            </div>
                            <div className="stat-amount">{skillsToTeach.length}</div>
                            <p className="stat-subtext">
                                Subjects you can mentor peers on in exchange
                            </p>
                        </div>

                        {/* CARD 3: READINESS HEALTH */}
                        <div className="curriculum-stat-card highlight">
                            <div className="stat-card-header">
                                <span className="stat-kicker">PROFILE READINESS</span>
                                <span className="stat-live-badge">HEALTH CHECK</span>
                            </div>
                            <div className="stat-amount">{profileScore}%</div>
                            <p className="stat-subtext">
                                Complete profile boosts peer match accuracy
                            </p>
                        </div>

                        {/* CARD 4: TOTAL REPERTOIRE */}
                        <div className="curriculum-stat-card">
                            <div className="stat-card-header">
                                <span className="stat-kicker">TOTAL REPERTOIRE</span>
                                <div className="stat-icon-wrap">
                                    <Sparkles size={14} />
                                </div>
                            </div>
                            <div className="stat-amount">{totalSkills}</div>
                            <p className="stat-subtext">
                                Combined skills across learning & teaching
                            </p>
                        </div>
                    </div>

                    {/* CURRICULUM SPLIT: DETAILED GOALS & READINESS CHECKLIST */}
                    <div className="curriculum-detail-split">
                        <div className="curriculum-main-panel">
                            <div className="panel-header-bar">
                                <h2>Detailed Learning Curriculum</h2>
                                <button
                                    type="button"
                                    className="learner-action-secondary"
                                    onClick={onProfile}
                                >
                                    + Add New Goal
                                </button>
                            </div>

                            {skillsToLearn.length > 0 ? (
                                <div className="curriculum-items-list">
                                    {skillsToLearn.map((skill, index) => (
                                        <div className="curriculum-item" key={skill}>
                                            <span className="curriculum-index">
                                                {String(index + 1).padStart(2, "0")}
                                            </span>
                                            <div className="curriculum-info">
                                                <strong>{skill}</strong>
                                                <p>
                                                    Active goal • Match with specialized
                                                    mentors for hands-on feedback.
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                className="btn-find-mentor"
                                                onClick={onHome}
                                            >
                                                Find Mentor ↗
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="learner-empty-curriculum">
                                    <p>No learning curriculum created yet.</p>
                                    <button
                                        type="button"
                                        className="learner-action-primary"
                                        onClick={onProfile}
                                    >
                                        Add Learning Goals in Profile
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* READINESS SIDEBAR */}
                        <div className="curriculum-side-panel">
                            <div className="learner-section-heading">
                                <p>EXCHANGE READINESS</p>
                                <h2>Profile completeness</h2>
                            </div>

                            <div className="readiness-meter">
                                <div className="readiness-track">
                                    <div
                                        className="readiness-bar"
                                        style={{ width: `${profileScore}%` }}
                                    />
                                </div>
                                <div className="readiness-labels">
                                    <span>Readiness score</span>
                                    <strong>{profileScore}%</strong>
                                </div>
                            </div>

                            <ul className="readiness-checklist">
                                <li className={dashboard?.bio ? "checked" : ""}>
                                    <CheckCircle2 size={16} />
                                    <div>
                                        <strong>Personal Bio</strong>
                                        <small>Introduce your background and goals</small>
                                    </div>
                                </li>
                                <li className={skillsToLearn.length > 0 ? "checked" : ""}>
                                    <CheckCircle2 size={16} />
                                    <div>
                                        <strong>Learning Targets</strong>
                                        <small>What topics you want to explore</small>
                                    </div>
                                </li>
                                <li className={skillsToTeach.length > 0 ? "checked" : ""}>
                                    <CheckCircle2 size={16} />
                                    <div>
                                        <strong>Teaching Skills</strong>
                                        <small>Skills you can share with the network</small>
                                    </div>
                                </li>
                                <li className={availability.length > 0 ? "checked" : ""}>
                                    <CheckCircle2 size={16} />
                                    <div>
                                        <strong>Schedule Availability</strong>
                                        <small>When you are open to meet</small>
                                    </div>
                                </li>
                            </ul>

                            <button
                                type="button"
                                className="btn-polish-profile"
                                onClick={onProfile}
                            >
                                Edit Profile Settings →
                            </button>
                        </div>
                    </div>
                </section>
            )}

            {/* FOOTER */}
            <footer className="learner-footer">
                <div className="learner-footer-brand">
                    <strong>Skill Exchange</strong>
                    <span>Peer-to-peer knowledge network</span>
                </div>
                <div className="learner-footer-links">
                    <button type="button" onClick={onHome}>
                        Home
                    </button>
                    <button type="button" onClick={onProfile}>
                        Profile
                    </button>
                    <button type="button" onClick={onBookings}>
                        My Sessions
                    </button>
                    <button type="button" onClick={onLogout}>
                        Log Out
                    </button>
                </div>
            </footer>
        </main>
    );
}

export default LearnerDashboard;
