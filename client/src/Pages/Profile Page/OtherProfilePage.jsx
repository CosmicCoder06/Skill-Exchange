import { useEffect, useState } from "react";
import "./OtherProfilePage.css";

function OtherProfilePage({
    token,
    userId,
    onMessages,
    onBookSession
}) {
    const [profile, setProfile] = useState(null);
    const [ratingData, setRatingData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [ratingLoading, setRatingLoading] = useState(true);

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
                console.error("Profile fetch error:", error);
            } finally {
                setLoading(false);
            }
        }

        async function fetchRatings() {
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/reviews/user/${userId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                const data = await response.json();

                if (response.ok) {
                    setRatingData(data);
                }
            } catch (error) {
                console.error("Ratings fetch error:", error);
            } finally {
                setRatingLoading(false);
            }
        }

        if (userId) {
            fetchProfile();
            fetchRatings();
        }
    }, [token, userId]);

    if (loading) {
        return (
            <main className="other-profile-loading">
                Loading profile...
            </main>
        );
    }

    if (!profile) {
        return (
            <main className="other-profile-loading">
                <p>Profile not found</p>

            </main>
        );
    }

    const teach =
        profile.skillsToTeach?.filter(Boolean) || [];

    const learn =
        profile.skillsToLearn?.filter(Boolean) || [];

    const stats = ratingData?.stats || {
        average: 0,
        total: 0,
        distribution: {
            5: 0,
            4: 0,
            3: 0,
            2: 0,
            1: 0
        }
    };

    const reviews =
        ratingData?.reviews || [];

    const getPercentage = (count) => {
        if (!stats.total) return 0;

        return Math.round(
            (count / stats.total) * 100
        );
    };

    return (
        <main className="other-profile-page">
            <header className="other-profile-topbar">
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
                        profile.name?.charAt(0).toUpperCase()
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

                    <div className="profile-rating-summary">
                        <span className="rating-star">
                            ★
                        </span>

                        <strong>
                            {stats.total
                                ? stats.average.toFixed(1)
                                : "—"}
                        </strong>

                        <span>
                            {stats.total
                                ? `${stats.total} ${
                                      stats.total === 1
                                          ? "review"
                                          : "reviews"
                                  }`
                                : "No reviews yet"}
                        </span>
                    </div>
                </div>

                <div className="other-profile-actions">
                    <button
                        className="other-profile-message"
                        onClick={onMessages}
                    >
                        Start conversation →
                    </button>

                    <button
                        className="other-profile-message"
                        onClick={() =>
                            onBookSession(
                                profile._id,
                                profile.name
                            )
                        }
                    >
                        Book Session 📅
                    </button>
                </div>
            </section>

            <section className="other-profile-content">
                <div className="other-profile-main">
                    <p className="profile-eyebrow">
                        ABOUT
                    </p>

                    <h2>
                        A little about {profile.name}
                    </h2>

                    <p className="other-profile-bio">
                        {profile.bio ||
                            "This member is open to learning and sharing skills."}
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
                                    <span className="other-skill-empty">
                                        No teaching skills added
                                    </span>
                                )}
                            </div>
                        </div>

                        {profile.role !== "mentor" && <div>
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
                                    <span className="other-skill-empty">
                                        No learning skills added
                                    </span>
                                )}
                            </div>
                        </div>}
                    </div>
                </div>

                <section className="profile-reviews-section">
                    <div className="profile-reviews-header">
                        <div>
                            <p className="profile-eyebrow">
                                COMMUNITY FEEDBACK
                            </p>

                            <h2>
                                Ratings & Reviews
                            </h2>
                        </div>

                        <div className="big-rating">
                            <strong>
                                {stats.total
                                    ? stats.average.toFixed(1)
                                    : "—"}
                            </strong>

                            <span>★★★★★</span>

                            <small>
                                {stats.total
                                    ? `${stats.total} ${
                                          stats.total === 1
                                              ? "review"
                                              : "reviews"
                                      }`
                                    : "No reviews yet"}
                            </small>
                        </div>
                    </div>

                    {ratingLoading ? (
                        <div className="reviews-loading">
                            Loading ratings...
                        </div>
                    ) : (
                        <>
                            {stats.total > 0 && (
                                <div className="rating-distribution">
                                    {[5, 4, 3, 2, 1].map(
                                        (star) => {
                                            const count =
                                                stats.distribution?.[
                                                    star
                                                ] || 0;

                                            return (
                                                <div
                                                    className="rating-row"
                                                    key={star}
                                                >
                                                    <span>
                                                        {star} ★
                                                    </span>

                                                    <div className="rating-bar">
                                                        <div
                                                            className="rating-bar-fill"
                                                            style={{
                                                                width: `${getPercentage(
                                                                    count
                                                                )}%`
                                                            }}
                                                        />
                                                    </div>

                                                    <small>
                                                        {count}
                                                    </small>
                                                </div>
                                            );
                                        }
                                    )}
                                </div>
                            )}

                            {reviews.length > 0 ? (
                                <div className="reviews-list">
                                    {reviews.map((review) => (
                                        <article
                                            className="review-card"
                                            key={review._id}
                                        >
                                            <div className="review-card-top">
                                                <div className="reviewer-avatar">
                                                    {review.reviewer?.name
                                                        ?.charAt(0)
                                                        .toUpperCase() ||
                                                        "U"}
                                                </div>

                                                <div>
                                                    <strong>
                                                        {review.reviewer
                                                            ?.name ||
                                                            "Member"}
                                                    </strong>

                                                    <span className="reviewer-role">
                                                        {review.reviewer
                                                            ?.role ||
                                                            "Learner"}
                                                    </span>
                                                </div>

                                                <span className="review-date">
                                                    {review.createdAt
                                                        ? new Date(
                                                              review.createdAt
                                                          ).toLocaleDateString(
                                                              "en-IN",
                                                              {
                                                                  day: "numeric",
                                                                  month: "short",
                                                                  year: "numeric"
                                                              }
                                                          )
                                                        : ""}
                                                </span>
                                            </div>

                                            <div className="review-stars">
                                                {"★".repeat(
                                                    review.rating
                                                )}
                                                <span>
                                                    {"★".repeat(
                                                        5 -
                                                            review.rating
                                                    )}
                                                </span>
                                            </div>

                                            {review.comment && (
                                                <p className="review-comment">
                                                    “
                                                    {review.comment}
                                                    ”
                                                </p>
                                            )}
                                        </article>
                                    ))}
                                </div>
                            ) : (
                                <div className="no-reviews">
                                    <div>⭐</div>

                                    <h3>
                                        No reviews yet
                                    </h3>

                                    <p>
                                        Complete a session
                                        with this member to
                                        leave the first
                                        review.
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </section>
            </section>
        </main>
    );
}

export default OtherProfilePage;
// @teamcosmiccoders
