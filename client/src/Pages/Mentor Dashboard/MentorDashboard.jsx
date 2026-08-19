import { useEffect, useState } from "react";
import "./MentorDashboard.css";

function MentorDashboard({ token, onHome, onProfile, onLogout }) {
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
    const skillsToLearn = profile?.skillsToLearn || [];
    const availability = profile?.availability || [];

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
                            Manage your profile, skills and availability
                            from one place.
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
                            onClick={onProfile}
                            className="dashboard-primary"
                        >
                            My Profile
                        </button>
                    </div>
                </header>

                {/* Stats */}
                <section className="mentor-stats">

                    <div className="mentor-stat-card">
                        <span>Skills to Teach</span>
                        <strong>{skillsToTeach.length}</strong>
                    </div>

                    <div className="mentor-stat-card">
                        <span>Skills to Learn</span>
                        <strong>{skillsToLearn.length}</strong>
                    </div>

                    <div className="mentor-stat-card">
                        <span>Availability</span>
                        <strong>{availability.length}</strong>
                    </div>

                    <div className="mentor-stat-card">
                        <span>Hourly Rate</span>
                        <strong>
                            {profile?.hourlyRate
                                ? `₹${profile.hourlyRate}`
                                : "Open"}
                        </strong>
                    </div>

                </section>

                {/* Dashboard Cards */}
                <section className="mentor-dashboard-grid">

                    {/* About */}
                    <div className="dashboard-card">
                        <p className="card-label">
                            ABOUT ME
                        </p>

                        <h2>
                            {profile?.name || "Your Profile"}
                        </h2>

                        <p className="about-text">
                            {profile?.bio ||
                                "Add a short bio to tell learners about yourself."}
                        </p>

                        <button
                            onClick={onProfile}
                            className="card-button"
                        >
                            View / Edit Profile →
                        </button>
                    </div>

                    {/* Teaching Skills */}
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

                    {/* Learning Skills */}
                    <div className="dashboard-card">
                        <p className="card-label">
                            I WANT TO LEARN
                        </p>

                        <div className="skill-list">
                            {skillsToLearn.length > 0 ? (
                                skillsToLearn.map((skill, index) => (
                                    <span
                                        className="skill-pill learn"
                                        key={`${skill}-${index}`}
                                    >
                                        {skill}
                                    </span>
                                ))
                            ) : (
                                <p className="empty-text">
                                    No learning skills added yet.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Availability */}
                    <div className="dashboard-card">
                        <p className="card-label">
                            AVAILABILITY
                        </p>

                        <div className="availability-list">
                            {availability.length > 0 ? (
                                availability.map((item, index) => (
                                    <div
                                        className="availability-item"
                                        key={`${item}-${index}`}
                                    >
                                        <span>✓</span>
                                        {item}
                                    </div>
                                ))
                            ) : (
                                <p className="empty-text">
                                    Availability not added yet.
                                </p>
                            )}
                        </div>
                    </div>

                </section>

                {/* Profile Status */}
                <section className="mentor-profile-status">

                    <div>
                        <p className="card-label">
                            PROFILE STATUS
                        </p>

                        <h2>
                            {profile?.profileCompleted
                                ? "Your profile is complete 🎉"
                                : "Complete your profile"}
                        </h2>

                        <p>
                            {profile?.profileCompleted
                                ? "Your profile is ready for learners."
                                : "Add your bio, skills and availability to improve your profile."}
                        </p>
                    </div>

                    <button
                        onClick={onProfile}
                        className="dashboard-primary"
                    >
                        {profile?.profileCompleted
                            ? "Edit Profile"
                            : "Complete Profile"}
                    </button>

                </section>

                {/* Logout */}
                <button
                    onClick={onLogout}
                    className="mentor-logout"
                >
                    Log out
                </button>

            </div>
        </main>
    );
}

export default MentorDashboard;
