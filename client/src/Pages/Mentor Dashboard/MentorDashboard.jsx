import { useEffect, useState } from "react";
import "./MentorDashboard.css";

function MentorDashboard({ token, onHome, onBookings }) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function fetchDashboard() {
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/dashboard/mentor`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message || "Unable to load mentor dashboard"
                    );
                }

                setProfile(data.dashboard);
            } catch (error) {
                console.error("Mentor dashboard error:", error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        }

        if (token) {
            fetchDashboard();
        }
    }, [token]);

    // Loading state
    if (loading) {
        return (
            <main className="mentor-dashboard">
                <div className="mentor-dashboard-container">
                    <h2>Loading dashboard...</h2>
                </div>
            </main>
        );
    }

    // Error state
    if (error) {
        return (
            <main className="mentor-dashboard">
                <div className="mentor-dashboard-container">
                    <h2>Unable to load dashboard</h2>

                    <p>{error}</p>

                </div>
            </main>
        );
    }

    const skillsToTeach = profile?.skillsToTeach || [];
    const completedSessions = profile?.completedSessions || 0;
    const upcomingBookings = profile?.upcomingBookings || 0;
    const learnersTaught = profile?.learnersTaught || 0;
    const averageRating = profile?.averageRating || 0;
    const monthlySessions = profile?.monthlySessions || [];
    const statusBreakdown = profile?.statusBreakdown || {};
    const maxSessions = Math.max(...monthlySessions.map((item) => item.sessions), 1);

    return (
        <main className="mentor-dashboard">
            <div className="mentor-dashboard-container">

                {/* Header */}
                <header className="mentor-dashboard-header">
                    <div>
                        <p className="dashboard-label">
                            MENTOR DASHBOARD
                        </p>

                        <h1>
                            Welcome, {profile?.name || "Mentor"} 👋
                        </h1>

                        <p className="dashboard-subtitle">
                            Your teaching activity, learner impact and session momentum.
                        </p>
                    </div>

                    <div className="dashboard-actions">
                        <button
                            onClick={onHome}
                            className="dashboard-secondary"
                        >
                            Home
                        </button>

                        <button
                            onClick={onBookings}
                            className="dashboard-secondary"
                        >
                            My Sessions
                        </button>
                    </div>
                </header>

                {/* Stats */}
                <section className="mentor-stats">

                    <div className="mentor-stat-card">
                        <span>Sessions completed</span>
                        <strong>{completedSessions}</strong>
                    </div>

                    <div className="mentor-stat-card">
                        <span>Average rating</span>
                        <strong>{averageRating ? `${Number(averageRating).toFixed(1)} ★` : "—"}</strong>
                    </div>

                    <div className="mentor-stat-card">
                        <span>Upcoming bookings</span>
                        <strong>{upcomingBookings}</strong>
                    </div>

                    <div className="mentor-stat-card">
                        <span>Learners taught</span>
                        <strong>{learnersTaught}</strong>
                    </div>

                </section>

                {/* Dashboard Cards */}
                <section className="mentor-dashboard-grid">

                    <div className="dashboard-card">
                        <p className="card-label">
                            I CAN TEACH
                        </p>

                        <div className="skill-list">
                            {skillsToTeach.length > 0 ? (
                                skillsToTeach.map((skill, index) => (
                                    <span
                                        className="skill-pill teach"
                                        key={`${skill}-${index}`}
                                    >
                                        {skill}
                                    </span>
                                ))
                            ) : (
                                <p className="empty-text">
                                    No teaching skills added yet.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="dashboard-card">
                        <p className="card-label">
                            SESSION PIPELINE
                        </p>
                        <div className="mentor-pipeline">
                            <span><b>{statusBreakdown.pending || 0}</b> pending</span>
                            <span><b>{statusBreakdown.accepted || 0}</b> confirmed</span>
                            <span><b>{statusBreakdown.completed || 0}</b> completed</span>
                        </div>
                    </div>

                </section>

                <section className="mentor-impact-card">
                    <div className="mentor-impact-heading">
                        <div>
                            <p className="card-label">TEACHING MOMENTUM</p>
                            <h2>Learners reached over time</h2>
                        </div>
                        <span>{profile?.ratingCount || 0} ratings received</span>
                    </div>
                    <div className="mentor-bar-chart">
                        {monthlySessions.length ? monthlySessions.map((item) => (
                            <div key={item.month} className="mentor-bar-column">
                                <strong>{item.sessions}</strong>
                                <i style={{ height: `${Math.max((item.sessions / maxSessions) * 100, 8)}%` }} />
                                <small>{item.month.slice(5)}</small>
                                <em>{item.learners} learners</em>
                            </div>
                        )) : <p className="empty-text">Complete sessions to see your teaching impact chart.</p>}
                    </div>
                </section>

            </div>
        </main>
    );
}

export default MentorDashboard;
// @teamcosmiccoders
