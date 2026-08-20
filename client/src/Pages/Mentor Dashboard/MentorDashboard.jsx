import { useEffect, useState } from "react";
import "./MentorDashboard.css";

const levelPercent = { Beginner: 25, Intermediate: 50, Advanced: 75, Expert: 100 };

function MentorDashboard({ token, onHome, onBookings }) {
    const [dashboard, setDashboard] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
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
        if (token) loadDashboard();
    }, [token]);

    if (error) return <main className="mentor-studio mentor-state"><h2>Unable to load teaching studio</h2><p>{error}</p></main>;
    if (!dashboard) return <main className="mentor-studio mentor-state"><p>Preparing your teaching studio…</p></main>;

    const skills = dashboard.skillsToTeach || [];
    const skillLevels = dashboard.teachingSkillLevels || {};
    const status = dashboard.statusBreakdown || {};
    const months = dashboard.monthlySessions || [];
    const maxSessions = Math.max(...months.map((item) => item.sessions), 1);

    return (
        <main className="mentor-studio">
            <section className="mentor-hero">
                <div>
                    <p className="mentor-kicker">TEACHING STUDIO / {new Date().getFullYear()}</p>
                    <h1>Make every session<br /><em>count.</em></h1>
                    <p className="mentor-lede">A live view of your teaching practice, learner reach and mentoring rhythm.</p>
                </div>
                <div className="mentor-hero-actions">
                    <button onClick={onBookings} className="mentor-action-primary">Open sessions <span>↗</span></button>
                    <button onClick={onHome} className="mentor-action-link">Home</button>
                </div>
            </section>

            <section className="mentor-scoreline" aria-label="Teaching statistics">
                <div><strong>{dashboard.learnersTaught || 0}</strong><span>Learners<br />taught</span></div>
                <div><strong>{dashboard.completedSessions || 0}</strong><span>Sessions<br />completed</span></div>
                <div><strong>{dashboard.averageRating ? Number(dashboard.averageRating).toFixed(1) : "—"}</strong><span>Average<br />rating</span></div>
                <div><strong>{dashboard.upcomingBookings || 0}</strong><span>Upcoming<br />sessions</span></div>
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
        </main>
    );
}

export default MentorDashboard;
