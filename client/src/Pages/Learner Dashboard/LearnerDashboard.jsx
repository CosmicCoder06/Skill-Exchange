import { useEffect, useState } from "react";
import "./LearnerDashboard.css";

function LearnerDashboard({ token, onHome, onProfile, onLogout }) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function fetchDashboard() {
            try {
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

                setProfile(data.dashboard);
            } catch (error) {
                console.error("Learner dashboard error:", error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        }

        if (token) {
            fetchDashboard();
        }
    }, [token]);

    // Loading
    if (loading) {
        return (
            <main className="learner-dashboard">
                <div className="learner-dashboard-container">
                    <h2>Loading dashboard...</h2>
                </div>
            </main>
        );
    }

    // Error
    if (error) {
        return (
            <main className="learner-dashboard">
                <div className="learner-dashboard-container">
                    <h2>Unable to load dashboard</h2>

                    <p>{error}</p>

                    <button
                        onClick={onHome}
                        className="learner-primary-button"
                    >
                        Back Home
                    </button>
                </div>
            </main>
        );
    }

    const skillsToTeach = profile?.skillsToTeach || [];
    const skillsToLearn = profile?.skillsToLearn || [];
    const availability = profile?.availability || [];

    return (
        <main className="learner-dashboard">
            <div className="learner-dashboard-container">

                {/* Header */}
                <header className="learner-dashboard-header">
                    <div>
                        <p className="learner-dashboard-label">
                            LEARNER DASHBOARD
                        </p>

                        <h1>
                            Welcome, {profile?.name || "Learner"} 👋
                        </h1>

                        <p className="learner-dashboard-subtitle">
                            Track what you want to learn and manage your
                            learning profile.
                        </p>
                    </div>

                    <div className="learner-dashboard-actions">
                        <button
                            onClick={onHome}
                            className="learner-secondary-button"
                        >
                            Home
                        </button>

                        <button
                            onClick={onProfile}
                            className="learner-primary-button"
                        >
                            My Profile
                        </button>
                    </div>
                </header>

                {/* Stats */}
                <section className="learner-stats">

                    <div className="learner-stat-card">
                        <span>Skills I Want To Learn</span>
                        <strong>{skillsToLearn.length}</strong>
                    </div>

                    <div className="learner-stat-card">
                        <span>Skills I Can Teach</span>
                        <strong>{skillsToTeach.length}</strong>
                    </div>

                    <div className="learner-stat-card">
                        <span>Availability</span>
                        <strong>{availability.length}</strong>
                    </div>

                    <div className="learner-stat-card">
                        <span>Profile</span>
                        <strong>
                            {profile?.profileCompleted
                                ? "100%"
                                : "Pending"}
                        </strong>
                    </div>

                </section>

                {/* Dashboard Cards */}
                <section className="learner-dashboard-grid">

                    {/* About */}
                    <div className="learner-dashboard-card">
                        <p className="learner-card-label">
                            ABOUT ME
                        </p>

                        <h2>
                            {profile?.name || "Your Profile"}
                        </h2>

                        <p className="learner-about-text">
                            {profile?.bio ||
                                "Add a short bio to tell mentors about yourself."}
                        </p>

                        <button
                            onClick={onProfile}
                            className="learner-card-button"
                        >
                            View / Edit Profile →
                        </button>
                    </div>

                    {/* Skills to Learn */}
                    <div className="learner-dashboard-card">
                        <p className="learner-card-label">
                            I WANT TO LEARN
                        </p>

                        <div className="learner-skill-list">

                            {skillsToLearn.length > 0 ? (
                                skillsToLearn.map((skill, index) => (
                                    <span
                                        className="learner-skill-pill learn"
                                        key={`${skill}-${index}`}
                                    >
                                        {skill}
                                    </span>
                                ))
                            ) : (
                                <p className="learner-empty-text">
                                    No learning skills added yet.
                                </p>
                            )}

                        </div>
                    </div>

                    {/* Skills to Teach */}
                    <div className="learner-dashboard-card">
                        <p className="learner-card-label">
                            I CAN ALSO TEACH
                        </p>

                        <div className="learner-skill-list">

                            {skillsToTeach.length > 0 ? (
                                skillsToTeach.map((skill, index) => (
                                    <span
                                        className="learner-skill-pill teach"
                                        key={`${skill}-${index}`}
                                    >
                                        {skill}
                                    </span>
                                ))
                            ) : (
                                <p className="learner-empty-text">
                                    No teaching skills added yet.
                                </p>
                            )}

                        </div>
                    </div>

                    {/* Availability */}
                    <div className="learner-dashboard-card">
                        <p className="learner-card-label">
                            AVAILABILITY
                        </p>

                        <div className="learner-availability-list">

                            {availability.length > 0 ? (
                                availability.map((item, index) => (
                                    <div
                                        className="learner-availability-item"
                                        key={`${item}-${index}`}
                                    >
                                        <span>✓</span>
                                        {item}
                                    </div>
                                ))
                            ) : (
                                <p className="learner-empty-text">
                                    Availability not added yet.
                                </p>
                            )}

                        </div>
                    </div>

                </section>

                {/* Profile Status */}
                <section className="learner-profile-status">

                    <div>
                        <p className="learner-card-label">
                            PROFILE STATUS
                        </p>

                        <h2>
                            {profile?.profileCompleted
                                ? "Your profile is complete 🎉"
                                : "Complete your profile"}
                        </h2>

                        <p>
                            {profile?.profileCompleted
                                ? "Your profile is ready for learning connections."
                                : "Add your bio, skills and availability to improve your profile."}
                        </p>
                    </div>

                    <button
                        onClick={onProfile}
                        className="learner-primary-button"
                    >
                        {profile?.profileCompleted
                            ? "Edit Profile"
                            : "Complete Profile"}
                    </button>

                </section>

                {/* Logout */}
                <button
                    onClick={onLogout}
                    className="learner-logout"
                >
                    Log out
                </button>

            </div>
        </main>
    );
}

export default LearnerDashboard;