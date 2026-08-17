import { useEffect, useState } from "react";
import "./OtherProfilePage.css";

function OtherProfilePage({
    token,
    userId,
    onBack,
    onMessages
}) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchProfile() {
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/profile/${userId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                const data = await response.json();

                if (response.ok) {
                    setProfile(data.profile);
                }
            } catch (error) {
                console.error(
                    "Unable to fetch user profile",
                    error
                );
            } finally {
                setLoading(false);
            }
        }

        if (userId) {
            fetchProfile();
        }
    }, [token, userId]);

    if (loading) {
        return (
            <main className="other-profile-loading">
                Loading profile…
            </main>
        );
    }

    if (!profile) {
        return (
            <main className="other-profile-loading">
                <p>Profile not found.</p>

                <button onClick={onBack}>
                    ← Back to discover
                </button>
            </main>
        );
    }

    const teach =
        profile.skillsToTeach?.filter(Boolean) || [];

    const learn =
        profile.skillsToLearn?.filter(Boolean) || [];

    const initials =
        profile.name?.charAt(0).toUpperCase();

    return (
        <main className="other-profile-page">

            <header className="other-profile-topbar">

                <button
                    className="other-profile-back"
                    onClick={onBack}
                >
                    <span>←</span>
                    Back to discover
                </button>

                <span className="other-profile-label">
                    MEMBER PROFILE
                </span>

            </header>

            <section className="other-profile-hero">

                <div className="other-profile-avatar">
                    {profile.avatarUrl ? (
                        <img
                            src={profile.avatarUrl}
                            alt={`${profile.name}'s profile`}
                        />
                    ) : (
                        initials
                    )}
                </div>

                <div className="other-profile-heading">

                    <span className="other-profile-role">
                        {profile.role || "Learner"}
                    </span>

                    <h1>{profile.name}</h1>

                    <p>
                        Open to meaningful skill exchanges
                    </p>

                </div>

                <button
                    className="other-profile-message"
                    onClick={onMessages}
                >
                    Start a conversation
                    <span>→</span>
                </button>

            </section>

            <section className="other-profile-content">

                <div className="other-profile-main">

                    <p className="profile-eyebrow">
                        ABOUT
                    </p>

                    <h2>
                        A little about {profile.name?.split(" ")[0]}
                    </h2>

                    <p className="other-profile-bio">
                        {profile.bio ||
                            "This member is open to learning and sharing skills with the community."}
                    </p>

                    <div className="other-profile-skills">

                        <div>
                            <p className="profile-eyebrow">
                                I CAN HELP WITH
                            </p>

                            <div className="other-skill-list">
                                {teach.length ? (
                                    teach.map((skill) => (
                                        <span
                                            className="other-skill teach"
                                            key={skill}
                                        >
                                            {skill}
                                        </span>
                                    ))
                                ) : (
                                    <span className="other-empty">
                                        No teaching skills added yet.
                                    </span>
                                )}
                            </div>
                        </div>

                        <div>
                            <p className="profile-eyebrow">
                                I WANT TO LEARN
                            </p>

                            <div className="other-skill-list">
                                {learn.length ? (
                                    learn.map((skill) => (
                                        <span
                                            className="other-skill learn"
                                            key={skill}
                                        >
                                            {skill}
                                        </span>
                                    ))
                                ) : (
                                    <span className="other-empty">
                                        No learning skills added yet.
                                    </span>
                                )}
                            </div>
                        </div>

                    </div>

                </div>

                <aside className="other-profile-details">

                    <div>
                        <span>Availability</span>
                        <strong>
                            {profile.availability
                                ?.filter(Boolean)
                                .join(", ") ||
                                "Not specified"}
                        </strong>
                    </div>

                    <div>
                        <span>Hourly rate</span>
                        <strong>
                            {profile.hourlyRate
                                ? `₹${profile.hourlyRate}/hr`
                                : "Open to discuss"}
                        </strong>
                    </div>

                </aside>

            </section>

        </main>
    );
}

export default OtherProfilePage;