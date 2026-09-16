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
    const [ratings, setRatings] = useState({});

    useEffect(() => {
        async function loadUsers() {
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/mentors?q=${encodeURIComponent(query)}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    setPeople([]);
                    return;
                }

                let currentUserId = null;

                try {
                    const payload = JSON.parse(
                        atob(token.split(".")[1])
                    );

                    currentUserId =
                        payload.id ||
                        payload._id ||
                        payload.userId;
                } catch (error) {
                    console.error(
                        "Unable to decode user token",
                        error
                    );
                }

                const users = Array.isArray(data.mentors)
                    ? data.mentors
                    : [];

                const otherUsers = users.filter(
                    (person) =>
                        String(person._id) !==
                        String(currentUserId)
                );

                setPeople(otherUsers);

                const ratingResults = await Promise.all(
                    otherUsers.map(async (person) => {
                        try {
                            const ratingResponse = await fetch(
                                `${import.meta.env.VITE_API_URL}/reviews/user/${person._id}`,
                                {
                                    headers: {
                                        Authorization: `Bearer ${token}`
                                    }
                                }
                            );

                            if (!ratingResponse.ok) {
                                return {
                                    id: person._id,
                                    stats: {
                                        average: 0,
                                        total: 0
                                    }
                                };
                            }

                            const ratingData =
                                await ratingResponse.json();

                            return {
                                id: person._id,
                                stats: ratingData.stats || {
                                    average: 0,
                                    total: 0
                                }
                            };
                        } catch {
                            return {
                                id: person._id,
                                stats: {
                                    average: 0,
                                    total: 0
                                }
                            };
                        }
                    })
                );

                const ratingMap = {};

                ratingResults.forEach((item) => {
                    ratingMap[item.id] = item.stats;
                });

                setRatings(ratingMap);
            } catch (error) {
                console.error(
                    "Unable to load users",
                    error
                );
                setPeople([]);
            } finally {
                setLoading(false);
            }
        }

        loadUsers();
    }, [token, query]);

    const matches = useMemo(() => {
        const search = query.toLowerCase().trim();

        return people.filter((person) =>
            `${person.name || ""} ${person.role || ""} ${(person.skillsToTeach || []).join(" ")}`
                .toLowerCase()
                .includes(search)
        );
    }, [people, query]);

    return (
        <main className="discover-page">
            <nav className="app-nav">
                <button
                    className="app-logo"
                    onClick={onHome}
                >
                    <span className="logo-mark">↗</span>
                    SkillExchange
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

            <header className="discover-header">
                <div className="discover-kicker">
                    <span></span>
                    COMMUNITY DIRECTORY
                </div>

                <h1>
                    Find your next
                    <br />
                    <em>learning partner.</em>
                </h1>

                <p className="discover-description">
                    Meet people who can teach what you want
                    to learn — and learn what you already know.
                </p>

                <div className="discover-search">
                    <span className="search-icon">⌕</span>

                    <input
                        type="text"
                        value={query}
                        onChange={(event) =>
                            setQuery(event.target.value)
                        }
                        placeholder="Search people, skills, or roles..."
                    />

                    {query && (
                        <button
                            className="clear-search"
                            onClick={() => setQuery("")}
                        >
                            ×
                        </button>
                    )}

                    <span className="search-shortcut">
                        /
                    </span>
                </div>
            </header>

            <section className="discover-results">
                <div className="results-heading">
                    <div>
                        <p className="results-kicker">
                            PEOPLE
                        </p>

                        <h2>
                            {loading
                                ? "Finding people..."
                                : `${matches.length} people to discover`}
                        </h2>
                    </div>

                    <p className="results-note">
                        Learn together.
                        <br />
                        Grow together.
                    </p>
                </div>

                <div className="people-list">
                    {matches.map((person, index) => {
                        const teachingSkills =
                            person.skillsToTeach
                                ?.filter(Boolean)
                                .slice(0, 3) || [];

                        const stats =
                            ratings[person._id] || {
                                average: 0,
                                total: 0
                            };

                        return (
                            <article
                                className="person-row"
                                key={person._id}
                            >
                                <div className="person-number">
                                    {String(index + 1).padStart(2, "0")}
                                </div>

                                <div className="person-avatar">
                                    {person.avatarUrl ? (
                                        <img
                                            src={person.avatarUrl}
                                            alt=""
                                        />
                                    ) : (
                                        person.name
                                            ?.slice(0, 1)
                                            .toUpperCase()
                                    )}
                                </div>

                                <div className="person-main">
                                    <div className="person-name-line">
                                        <h3>
                                            {person.name}
                                        </h3>

                                        <span className="person-role">
                                            {person.role ||
                                                "Learner"}
                                        </span>
                                    </div>

                                    <p className="person-bio">
                                        {person.bio ||
                                            "Open to meaningful skill exchanges."}
                                    </p>

                                    <div className="person-meta">
                                        <span className="person-rating">
                                            ★{" "}
                                            {stats.total > 0
                                                ? stats.average.toFixed(1)
                                                : "—"}
                                        </span>

                                        <span className="meta-divider">
                                            ·
                                        </span>

                                        <span>
                                            {stats.total > 0
                                                ? `${stats.total} ${
                                                      stats.total === 1
                                                          ? "review"
                                                          : "reviews"
                                                  }`
                                                : "No reviews yet"}
                                        </span>

                                        {teachingSkills.length >
                                            0 && (
                                            <>
                                                <span className="meta-divider">
                                                    ·
                                                </span>

                                                <div className="person-skills">
                                                    {teachingSkills.map(
                                                        (skill) => (
                                                            <span
                                                                key={
                                                                    skill
                                                                }
                                                            >
                                                                {skill}
                                                            </span>
                                                        )
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="person-actions">
                                    <button
                                        className="person-profile"
                                        onClick={() =>
                                            onViewProfile(
                                                person._id
                                            )
                                        }
                                    >
                                        View profile
                                        <span>↗</span>
                                    </button>

                                    <button
                                        className="person-message"
                                        onClick={onMessages}
                                        aria-label={`Message ${person.name}`}
                                    >
                                        →
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </div>

                {!loading && !matches.length && (
                    <div className="directory-empty">
                        <span>⌕</span>

                        <h3>
                            No one found
                        </h3>

                        <p>
                            Try searching for another
                            name, role, or skill.
                        </p>
                    </div>
                )}
            </section>
        </main>
    );
}

export default DiscoverPage;
// @teamcosmiccoders
