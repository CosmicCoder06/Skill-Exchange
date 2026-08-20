import { useEffect, useMemo, useState } from "react";
import "./LearnerDashboard.css";

function LearnerDashboard({
    token,
    onHome,
    onProfile,
    onLogout,
    onBookings,
}) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

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
                        data.message ||
                            "Unable to load learner dashboard"
                    );
                }

                setProfile(data.dashboard);
            } catch (requestError) {
                console.error(
                    "Learner dashboard error:",
                    requestError
                );

                setError(
                    requestError.message ||
                        "Unable to load dashboard"
                );
            } finally {
                setLoading(false);
            }
        }

        if (token) {
            fetchDashboard();
        }
    }, [token]);

    const skillsToLearn = useMemo(
        () =>
            (profile?.skillsToLearn || []).filter(
                (skill) =>
                    typeof skill === "string" &&
                    skill.trim()
            ),
        [profile]
    );

    const skillsToTeach = useMemo(
        () =>
            (profile?.skillsToTeach || []).filter(
                (skill) =>
                    typeof skill === "string" &&
                    skill.trim()
            ),
        [profile]
    );

    const availability = useMemo(
        () =>
            (profile?.availability || []).filter(
                (item) =>
                    typeof item === "string" &&
                    item.trim()
            ),
        [profile]
    );

    const totalSkills =
        skillsToLearn.length +
        skillsToTeach.length;

    const learnPercentage =
        totalSkills > 0
            ? Math.round(
                  (skillsToLearn.length /
                      totalSkills) *
                      100
              )
            : 0;

    const teachPercentage =
        totalSkills > 0
            ? Math.round(
                  (skillsToTeach.length /
                      totalSkills) *
                      100
              )
            : 0;

    const profileScore = profile?.profileCompleted
        ? 100
        : Math.min(
              100,
              (skillsToLearn.length > 0 ? 25 : 0) +
                  (skillsToTeach.length > 0 ? 25 : 0) +
                  (profile?.bio?.trim() ? 25 : 0) +
                  (availability.length > 0 ? 25 : 0)
          );

    if (loading) {
        return (
            <main className="learner-dashboard">
                <div className="learner-dashboard-shell learner-loading">
                    <div className="loader-ring"></div>
                    <h2>Building your dashboard...</h2>
                    <p>
                        Fetching your learning space.
                    </p>
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="learner-dashboard">
                <div className="learner-dashboard-shell learner-error">
                    <div className="error-icon">!</div>

                    <p className="dashboard-eyebrow">
                        LEARNER DASHBOARD
                    </p>

                    <h1>
                        Unable to load dashboard
                    </h1>

                    <p>{error}</p>

                </div>
            </main>
        );
    }

    return (
        <main className="learner-dashboard">
            <div className="learner-dashboard-shell">

                {/* =========================================
                    TOP BAR
                ========================================= */}

                <header className="dashboard-topbar">
                    <div className="dashboard-brand">
                        <div className="brand-mark">
                            S
                        </div>

                        <div>
                            <strong>
                                Skill Exchange
                            </strong>

                            <span>
                                Learner workspace
                            </span>
                        </div>
                    </div>

                    <nav className="dashboard-nav">
                        <button
                            type="button"
                            onClick={onHome}
                        >
                            Home
                        </button>

                        <button
                            type="button"
                            className="dashboard-nav-active"
                        >
                            Dashboard
                        </button>

                        <button
                            type="button"
                            onClick={onProfile}
                        >
                            Profile
                        </button>

                        <button
                            type="button"
                            onClick={onBookings}
                        >
                            My Sessions
                        </button>
                    </nav>

                    <button
                        type="button"
                        className="dashboard-avatar"
                        onClick={onProfile}
                        title="Open profile"
                    >
                        {profile?.name
                            ?.charAt(0)
                            ?.toUpperCase() || "L"}
                    </button>
                </header>

                {/* =========================================
                    HERO
                ========================================= */}

                <section className="dashboard-hero">
                    <div>
                        <p className="dashboard-eyebrow">
                            LEARNER DASHBOARD
                        </p>

                        <h1>
                            Welcome back,{" "}
                            <span>
                                {profile?.name ||
                                    "Learner"}
                            </span>{" "}
                            👋
                        </h1>

                        <p className="dashboard-hero-text">
                            Keep your learning goals visible,
                            discover your strengths, and stay
                            ready for your next skill exchange.
                        </p>
                    </div>

                    <div className="hero-actions">
                        <button
                            type="button"
                            className="dashboard-secondary"
                            onClick={onProfile}
                        >
                            View Profile
                        </button>

                        <button
                            type="button"
                            className="dashboard-primary"
                            onClick={onBookings}
                        >
                            My Sessions →
                        </button>
                    </div>
                </section>

                {/* =========================================
                    OVERVIEW STATS
                ========================================= */}

                <section className="overview-grid">

                    <article className="overview-rail">
                        <div className="overview-icon purple">
                            ↗
                        </div>

                        <div>
                            <span>
                                Learning Goals
                            </span>

                            <strong>
                                {skillsToLearn.length}
                            </strong>

                            <small>
                                skills you want to learn
                            </small>
                        </div>
                    </article>

                    <article className="overview-rail">
                        <div className="overview-icon green">
                            ✦
                        </div>

                        <div>
                            <span>
                                Skills You Share
                            </span>

                            <strong>
                                {skillsToTeach.length}
                            </strong>

                            <small>
                                skills you can teach
                            </small>
                        </div>
                    </article>

                    <article className="overview-rail">
                        <div className="overview-icon orange">
                            ◷
                        </div>

                        <div>
                            <span>
                                Availability
                            </span>

                            <strong>
                                {availability.length}
                            </strong>

                            <small>
                                availability slots
                            </small>
                        </div>
                    </article>

                    <article className="overview-rail">
                        <div className="overview-icon blue">
                            ✓
                        </div>

                        <div>
                            <span>
                                Profile Health
                            </span>

                            <strong>
                                {profileScore}%
                            </strong>

                            <small>
                                profile readiness
                            </small>
                        </div>
                    </article>

                </section>

                {/* =========================================
                    MAIN GRID
                ========================================= */}

                <section className="dashboard-main-grid">

                    {/* SKILL BALANCE */}
                    <article className="dashboard-section skill-chart-panel">
                        <div className="panel-heading">
                            <div>
                                <p className="panel-kicker">
                                    SKILL BALANCE
                                </p>

                                <h2>
                                    Your learning direction
                                </h2>
                            </div>

                            <span className="panel-badge">
                                {totalSkills} total
                            </span>
                        </div>

                        <div className="skill-chart">

                            <div className="donut-wrapper">
                                <div
                                    className="skill-donut"
                                    style={{
                                        background: `conic-gradient(
                                            #7c5cff 0 ${learnPercentage}%,
                                            #19a974 ${learnPercentage}% 100%
                                        )`,
                                    }}
                                >
                                    <div className="donut-inner">
                                        <strong>
                                            {totalSkills}
                                        </strong>

                                        <span>
                                            skills
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="chart-details">

                                <div className="chart-legend">
                                    <span className="legend-dot learn-dot"></span>

                                    <div>
                                        <strong>
                                            {skillsToLearn.length}
                                        </strong>

                                        <span>
                                            Want to learn
                                        </span>
                                    </div>

                                    <b>
                                        {learnPercentage}%
                                    </b>
                                </div>

                                <div className="chart-legend">
                                    <span className="legend-dot teach-dot"></span>

                                    <div>
                                        <strong>
                                            {skillsToTeach.length}
                                        </strong>

                                        <span>
                                            Can teach
                                        </span>
                                    </div>

                                    <b>
                                        {teachPercentage}%
                                    </b>
                                </div>

                                <div className="chart-message">
                                    {skillsToLearn.length >
                                    skillsToTeach.length
                                        ? "Your dashboard is focused more on discovering new skills."
                                        : skillsToTeach.length >
                                          skillsToLearn.length
                                        ? "You have a strong sharing profile. Help others while learning."
                                        : "Your learning and teaching goals are nicely balanced."}
                                </div>

                            </div>
                        </div>
                    </article>

                    {/* PROFILE HEALTH */}
                    <article className="dashboard-section health-panel">
                        <div className="panel-heading">
                            <div>
                                <p className="panel-kicker">
                                    PROFILE HEALTH
                                </p>

                                <h2>
                                    Ready to connect?
                                </h2>
                            </div>

                            <span className="health-score">
                                {profileScore}%
                            </span>
                        </div>

                        <div className="progress-track">
                            <div
                                className="progress-fill"
                                style={{
                                    width: `${profileScore}%`,
                                }}
                            />
                        </div>

                        <div className="health-list">

                            <div
                                className={
                                    profile?.bio
                                        ? "health-item done"
                                        : "health-item"
                                }
                            >
                                <span>
                                    {profile?.bio
                                        ? "✓"
                                        : "○"}
                                </span>

                                <div>
                                    <strong>
                                        About you
                                    </strong>

                                    <small>
                                        Add a short introduction
                                    </small>
                                </div>
                            </div>

                            <div
                                className={
                                    skillsToLearn.length
                                        ? "health-item done"
                                        : "health-item"
                                }
                            >
                                <span>
                                    {skillsToLearn.length
                                        ? "✓"
                                        : "○"}
                                </span>

                                <div>
                                    <strong>
                                        Learning goals
                                    </strong>

                                    <small>
                                        What do you want to learn?
                                    </small>
                                </div>
                            </div>

                            <div
                                className={
                                    skillsToTeach.length
                                        ? "health-item done"
                                        : "health-item"
                                }
                            >
                                <span>
                                    {skillsToTeach.length
                                        ? "✓"
                                        : "○"}
                                </span>

                                <div>
                                    <strong>
                                        Teaching skills
                                    </strong>

                                    <small>
                                        What can you share?
                                    </small>
                                </div>
                            </div>

                            <div
                                className={
                                    availability.length
                                        ? "health-item done"
                                        : "health-item"
                                }
                            >
                                <span>
                                    {availability.length
                                        ? "✓"
                                        : "○"}
                                </span>

                                <div>
                                    <strong>
                                        Availability
                                    </strong>

                                    <small>
                                        When can you connect?
                                    </small>
                                </div>
                            </div>

                        </div>

                        <button
                            type="button"
                            className="panel-link"
                            onClick={onProfile}
                        >
                            Improve my profile →
                        </button>
                    </article>

                </section>

                {/* =========================================
                    SECOND ROW
                ========================================= */}

                <section className="dashboard-secondary-grid">

                    {/* LEARNING ROADMAP */}
                    <article className="dashboard-section roadmap-panel">
                        <div className="panel-heading">
                            <div>
                                <p className="panel-kicker">
                                    LEARNING ROADMAP
                                </p>

                                <h2>
                                    What to focus on
                                </h2>
                            </div>
                        </div>

                        {skillsToLearn.length > 0 ? (
                            <div className="roadmap-list">
                                {skillsToLearn.map(
                                    (skill, index) => (
                                        <div
                                            className="roadmap-item"
                                            key={`${skill}-${index}`}
                                        >
                                            <div className="roadmap-number">
                                                {String(
                                                    index + 1
                                                ).padStart(
                                                    2,
                                                    "0"
                                                )}
                                            </div>

                                            <div className="roadmap-content">
                                                <strong>
                                                    {skill}
                                                </strong>

                                                <span>
                                                    Learning goal
                                                </span>
                                            </div>

                                            <div className="roadmap-line">
                                                <span
                                                    style={{
                                                        width: `${Math.max(
                                                            25,
                                                            90 -
                                                                index *
                                                                    15
                                                        )}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        ) : (
                            <div className="empty-dashboard">
                                <span>◎</span>
                                <strong>
                                    No learning goals yet
                                </strong>
                                <p>
                                    Add skills you want to learn
                                    from your profile.
                                </p>
                            </div>
                        )}
                    </article>

                    {/* WEEKLY AVAILABILITY */}
                    <article className="dashboard-section availability-panel">
                        <div className="panel-heading">
                            <div>
                                <p className="panel-kicker">
                                    WEEKLY PLAN
                                </p>

                                <h2>
                                    Your availability
                                </h2>
                            </div>
                        </div>

                        <div className="week-bars">

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
                                    availability.length >
                                    0 &&
                                    index <
                                        Math.min(
                                            availability.length,
                                            7
                                        );

                                return (
                                    <div
                                        className="week-column"
                                        key={day}
                                    >
                                        <div className="bar-area">
                                            <div
                                                className={
                                                    active
                                                        ? "week-bar active"
                                                        : "week-bar"
                                                }
                                                style={{
                                                    height: active
                                                        ? `${
                                                              35 +
                                                              ((index +
                                                                  1) %
                                                                  4) *
                                                                  13
                                                          }%`
                                                        : "12%",
                                                }}
                                            />
                                        </div>

                                        <span>
                                            {day}
                                        </span>
                                    </div>
                                );
                            })}

                        </div>

                        <div className="availability-summary">
                            <span className="summary-dot"></span>

                            <p>
                                <strong>
                                    {availability.length}
                                </strong>{" "}
                                availability preference
                                {availability.length !== 1
                                    ? "s"
                                    : ""}{" "}
                                added
                            </p>
                        </div>
                    </article>

                </section>

                {/* =========================================
                    QUICK ACTIONS
                ========================================= */}

                <section className="quick-actions">

                    <div className="quick-actions-heading">
                        <p className="panel-kicker">
                            QUICK ACTIONS
                        </p>

                        <h2>
                            Keep moving forward
                        </h2>
                    </div>

                    <div className="quick-action-grid">

                        <button
                            type="button"
                            onClick={onBookings}
                            className="quick-action-line"
                        >
                            <span className="quick-icon">
                                ◷
                            </span>

                            <div>
                                <strong>
                                    My Sessions
                                </strong>

                                <span>
                                    View bookings and upcoming
                                    learning sessions
                                </span>
                            </div>

                            <b>→</b>
                        </button>

                        <button
                            type="button"
                            onClick={onProfile}
                            className="quick-action-line"
                        >
                            <span className="quick-icon">
                                ✎
                            </span>

                            <div>
                                <strong>
                                    Update Profile
                                </strong>

                                <span>
                                    Keep your skills and goals
                                    up to date
                                </span>
                            </div>

                            <b>→</b>
                        </button>

                        <button
                            type="button"
                            onClick={onHome}
                            className="quick-action-line"
                        >
                            <span className="quick-icon">
                                ⌂
                            </span>

                            <div>
                                <strong>
                                    Discover Skills
                                </strong>

                                <span>
                                    Find people to learn and
                                    exchange skills with
                                </span>
                            </div>

                            <b>→</b>
                        </button>

                    </div>
                </section>

                {/* =========================================
                    FOOTER
                ========================================= */}

                <footer className="dashboard-footer">
                    <span>
                        Skill Exchange
                    </span>

                    <div>
                        <button
                            type="button"
                            onClick={onProfile}
                        >
                            Profile
                        </button>

                        <button
                            type="button"
                            onClick={onLogout}
                        >
                            Logout
                        </button>
                    </div>
                </footer>

            </div>
        </main>
    );
}

export default LearnerDashboard;
// @teamcosmiccoders
