import { useEffect, useMemo, useState } from "react";
import "./HomePage.css";
import "./Discover.css";

function DiscoverPage({ token, onHome, onProfile, onMessages }) {
    const [people, setPeople] = useState([]);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        fetch(`${import.meta.env.VITE_API_URL}/getData`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(async (response) => ({ response, data: await response.json() }))
            .then(({ response, data }) => {
                if (active && response.ok) setPeople(Array.isArray(data.data) ? data.data : []);
            })
            .catch((error) => console.error("Unable to load mentors", error))
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [token]);

    const matches = useMemo(
        () => people.filter((person) =>
            `${person.name} ${person.role} ${(person.skillsToTeach || []).join(" ")}`
                .toLowerCase()
                .includes(query.toLowerCase())
        ),
        [people, query]
    );

    return (
        <main className="discover-page">
            <nav className="app-nav">
                <button className="app-logo" onClick={onHome}><span>↗</span> Skill Exchange</button>
                <div className="nav-links">
                    <button className="active" onClick={onHome}>Discover</button>
                    <button onClick={onMessages}>Messages</button>
                    <button onClick={onProfile}>Profile</button>
                </div>
                <button className="nav-profile" onClick={onProfile}>My space <span>→</span></button>
            </nav>

            <header className="discover-header">
                <button className="page-back" onClick={onHome}>← Back to home</button>
                <p className="home-kicker">COMMUNITY DIRECTORY</p>
                <h1>Find the right person to learn with.</h1>
                <p>Search by a name, role, or skill. Start a conversation when you find a good match.</p>
                <label className="discover-search">
                    <span>⌕</span>
                    <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try ‘React’, ‘design’, or a name" />
                </label>
            </header>

            <section className="discover-results">
                <div className="results-label">
                    <span>{loading ? "Finding people..." : `${matches.length} people to discover`}</span>
                    <p>Skill exchange is built on mutual curiosity.</p>
                </div>
                <div className="mentor-grid">
                    {matches.map((person) => {
                        const skills = person.skillsToTeach?.filter(Boolean).slice(0, 3) || [];
                        return <article className="mentor-card" key={person._id}>
                            <div className="mentor-card-head">
                                <div className="mentor-initial">{person.name?.slice(0, 1).toUpperCase()}</div>
                                <span>{person.role || "learner"}</span>
                            </div>
                            <h2>{person.name}</h2>
                            <p className="mentor-bio">{person.bio || "Building a learning profile and open to meaningful skill exchanges."}</p>
                            <div className="mentor-tags">
                                {skills.length ? skills.map((skill) => <span key={skill}>{skill}</span>) : <span>Open to connect</span>}
                            </div>
                            <button onClick={onMessages}>Start a conversation <span>→</span></button>
                        </article>;
                    })}
                </div>
                {!loading && !matches.length ? <p className="directory-empty">No members match that search yet.</p> : null}
            </section>
        </main>
    );
}

export default DiscoverPage;
