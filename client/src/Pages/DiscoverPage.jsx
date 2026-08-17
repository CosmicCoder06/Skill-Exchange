import { useEffect, useMemo, useState } from "react";
import "./HomePage.css";
import "./Discover.css";

function DiscoverPage({
    token,
    onHome,
    onProfile,
    onMessages,
    onViewProfile
}) {
    const [people, setPeople] = useState([]);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/getData`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                const data = await response.json();

                if (response.ok) {
                    setPeople(
                        Array.isArray(data.data)
                            ? data.data
                            : []
                    );
                }
            } catch (error) {
                console.error(
                    "Unable to load mentors",
                    error
                );
            } finally {
                setLoading(false);
            }
        }

        load();
    }, [token]);

    const matches = useMemo(
        () =>
            people.filter((person) =>
                `${person.name} ${
                    person.role || ""
                } ${(person.skillsToTeach || []).join(" ")}`
                    .toLowerCase()
                    .includes(query.toLowerCase())
            ),
        [people, query]
    );

    return (
        <main className="discover-page">

            {/* =========================
                NAVBAR
            ========================= */}

            <nav className="app-nav">

                <button
                    className="app-logo"
                    onClick={onHome}
                >
                    <span>↗</span>
                    SkillSphere
                </button>

                <div className="nav-links">

                    <button className="active">
                        Discover
                    </button>

                    <button onClick={onMessages}>
                        Messages
                    </button>

                    <button onClick={onProfile}>
                        Profile
                    </button>

                </div>

                <button
                    className="nav-profile"
                    onClick={onProfile}
                >
                    My space
                    <span>→</span>
                </button>

            </nav>


            {/* =========================
                HEADER
            ========================= */}

            <header className="discover-header">

                <button
                    className="page-back"
                    onClick={onHome}
                >
                    <span>←</span>
                    Home
                </button>

                <p className="home-kicker">
                    COMMUNITY DIRECTORY
                </p>

                <h1>
                    Find the right person to learn with.
                </h1>

                <p>
                    Search by a name, role, or skill.
                    Start a conversation when you find
                    a good match.
                </p>


                {/* SEARCH */}

                <label className="discover-search">

                    <span>⌕</span>

                    <input
                        type="text"
                        value={query}
                        onChange={(event) =>
                            setQuery(event.target.value)
                        }
                        placeholder="Try ‘React’, ‘design’, or a name"
                    />

                </label>

            </header>


            {/* =========================
                RESULTS
            ========================= */}

            <section className="discover-results">

                <div className="results-label">

                    <span>
                        {loading
                            ? "Finding people..."
                            : `${matches.length} people to discover`}
                    </span>

                    <p>
                        Skill exchange is built on
                        mutual curiosity.
                    </p>

                </div>


                {/* =========================
                    USER CARDS
                ========================= */}

                <div className="mentor-grid">

                    {matches.map((person) => {

                        const teachingSkills =
                            person.skillsToTeach
                                ?.filter(Boolean)
                                .slice(0, 3) || [];

                        return (
                            <article
                                className="mentor-card"
                                key={person._id}
                            >

                                {/* USER HEADER */}

                                <div className="mentor-card-head">

                                    <div className="mentor-initial">

                                        {person.avatarUrl ? (

                                            <img
                                                src={
                                                    person.avatarUrl
                                                }
                                                alt={`${person.name}'s profile`}
                                            />

                                        ) : (

                                            person.name
                                                ?.slice(0, 1)
                                                .toUpperCase()

                                        )}

                                    </div>

                                    <span>
                                        {person.role ||
                                            "Learner"}
                                    </span>

                                </div>


                                {/* NAME */}

                                <h2>
                                    {person.name}
                                </h2>


                                {/* BIO */}

                                <p className="mentor-bio">

                                    {person.bio ||
                                        "Building a learning profile and open to meaningful skill exchanges."}

                                </p>


                                {/* SKILLS */}

                                <div className="mentor-tags">

                                    {teachingSkills.length > 0 ? (

                                        teachingSkills.map(
                                            (skill) => (
                                                <span
                                                    key={skill}
                                                >
                                                    {skill}
                                                </span>
                                            )
                                        )

                                    ) : (

                                        <span>
                                            Open to connect
                                        </span>

                                    )}

                                </div>


                                {/* ACTIONS */}

                                <div className="mentor-card-actions">

                                    {/* VIEW PROFILE */}

                                    <button
                                        className="mentor-view-profile"
                                        onClick={() =>
                                            onViewProfile(
                                                person._id
                                            )
                                        }
                                    >
                                        View profile
                                        <span>↗</span>
                                    </button>


                                    {/* MESSAGE */}

                                    <button
                                        className="mentor-message"
                                        onClick={onMessages}
                                    >
                                        Message
                                        <span>→</span>
                                    </button>

                                </div>

                            </article>
                        );
                    })}

                </div>


                {/* =========================
                    EMPTY STATE
                ========================= */}

                {!loading &&
                    !matches.length && (

                        <p className="directory-empty">
                            No members match that search yet.
                        </p>

                    )}

            </section>

        </main>
    );
}

export default DiscoverPage;