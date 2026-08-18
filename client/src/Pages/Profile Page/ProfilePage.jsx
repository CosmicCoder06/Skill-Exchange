import { useEffect, useState } from "react";
import "./ProfilePage.css";

function ProfilePage({
    token,
    profileStatus,
    onHome,
    onLogout,
    onMessagesClick,
    onBookings,
    onCompleteProfile
}) {
    const [profile, setProfile] = useState(null);
    const [profileComplete, setProfileComplete] = useState(false);

    const [reviewsData, setReviewsData] = useState({
        stats: {
            average: 0,
            totalReceived: 0,
            totalGiven: 0,
            distribution: {
                5: 0,
                4: 0,
                3: 0,
                2: 0,
                1: 0
            }
        },
        reviews: []
    });

    const [reviewsLoading, setReviewsLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        async function fetchProfile() {
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/profile/me`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message || "Unable to load profile"
                    );
                }

                setProfile(data.profile);

                setProfileComplete(
                    data.profileComplete === true
                );
            } catch (error) {
                console.error(
                    "Profile fetch error:",
                    error
                );
            }
        }

        if (token) {
            fetchProfile();
        }
    }, [token]);

    useEffect(() => {
        async function fetchReviews() {
            try {
                setReviewsLoading(true);

                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/reviews`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message || "Unable to load reviews"
                    );
                }

                setReviewsData({
                    stats: data.stats || {
                        average: 0,
                        totalReceived: 0,
                        totalGiven: 0,
                        distribution: {
                            5: 0,
                            4: 0,
                            3: 0,
                            2: 0,
                            1: 0
                        }
                    },
                    reviews: Array.isArray(data.reviews)
                        ? data.reviews
                        : []
                });
            } catch (error) {
                console.error(
                    "Reviews fetch error:",
                    error
                );
            } finally {
                setReviewsLoading(false);
            }
        }

        if (token) {
            fetchReviews();
        }
    }, [token]);

    if (!profile) {
        return (
            <main className="profile-loading">
                Loading your profile...
            </main>
        );
    }

    const teachingSkills =
        profile.skillsToTeach?.filter(Boolean) || [];

    const learningSkills =
        profile.skillsToLearn?.filter(Boolean) || [];

    const complete =
        profileStatus === true ||
        profileComplete;

    const initials =
        profile.name?.charAt(0)?.toUpperCase() || "?";

    const stats = reviewsData.stats;

    const distribution =
        stats.distribution || {
            5: 0,
            4: 0,
            3: 0,
            2: 0,
            1: 0
        };

    const totalReviews =
        stats.totalReceived || 0;

    const ratingPercentage = (rating) => {
        if (!totalReviews) {
            return 0;
        }

        return Math.round(
            (distribution[rating] / totalReviews) * 100
        );
    };

    async function deleteAccount() {
        const confirmed = window.confirm(
            "Delete your account permanently? This cannot be undone."
        );

        if (!confirmed) {
            return;
        }

        try {
            setDeleting(true);

            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/user/delete/${profile._id}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error(
                    "Unable to delete account"
                );
            }

            onLogout();
        } catch (error) {
            console.error(
                "Account deletion error:",
                error
            );

            alert(
                "Unable to delete account. Please try again."
            );
        } finally {
            setDeleting(false);
        }
    }

    return (
        <main className="profile-page">

            {/* =========================================
                COLLAPSIBLE SIDEBAR
            ========================================= */}

            <aside className="profile-sidebar">

                <button
                    className="sidebar-logo"
                    onClick={onHome}
                >
                    ↗
                </button>

                <div className="sidebar-navigation">

                    <button
                        className="sidebar-item"
                        onClick={onHome}
                    >
                        <span className="sidebar-icon">
                            ⌂
                        </span>

                        <span className="sidebar-text">
                            Home
                        </span>
                    </button>

                    <button
                        className="sidebar-item"
                        onClick={onMessagesClick}
                    >
                        <span className="sidebar-icon">
                            ◇
                        </span>

                        <span className="sidebar-text">
                            Messages
                        </span>
                    </button>

                    <button
                        className="sidebar-item"
                        onClick={onBookings}
                    >
                        <span className="sidebar-icon">
                            ▣
                        </span>

                        <span className="sidebar-text">
                            My Sessions
                        </span>
                    </button>

                    <button
                        className="sidebar-item active"
                    >
                        <span className="sidebar-icon">
                            ●
                        </span>

                        <span className="sidebar-text">
                            Profile
                        </span>
                    </button>

                </div>

                <button
                    className="sidebar-item sidebar-logout"
                    onClick={onLogout}
                >
                    <span className="sidebar-icon">
                        ↪
                    </span>

                    <span className="sidebar-text">
                        Logout
                    </span>
                </button>

            </aside>


            {/* =========================================
                MAIN WORKSPACE
            ========================================= */}

            <section className="profile-workspace">

                {/* TOP HEADER */}

                <header className="profile-header">

                    <div className="profile-brand">

                        <strong>
                            SKILLSPHERE
                        </strong>

                        <span>
                            Your personal learning space
                        </span>

                    </div>

                    <div className="profile-header-actions">

                        <button
                            onClick={onMessagesClick}
                        >
                            Messages →
                        </button>

                        <button
                            onClick={onBookings}
                        >
                            My Sessions →
                        </button>

                    </div>

                </header>


                {/* =========================================
                    COVER IMAGE
                ========================================= */}

                <section
                    className={
                        profile.coverImageUrl
                            ? "profile-cover custom-cover"
                            : "profile-cover"
                    }
                    style={
                        profile.coverImageUrl
                            ? {
                                  backgroundImage:
                                      `url("${profile.coverImageUrl}")`
                              }
                            : {}
                    }
                >

                    <div className="cover-overlay"></div>

                    <button
                        className="cover-edit-button"
                        onClick={onCompleteProfile}
                    >
                        ✎
                        <span>
                            Change cover
                        </span>
                    </button>

                    {!profile.coverImageUrl && (
                        <div className="cover-empty-message">
                            <strong>
                                Complete your profile
                            </strong>

                            <span>
                                Add a cover image or collage
                            </span>
                        </div>
                    )}

                </section>


                {/* =========================================
                    PROFILE IDENTITY
                ========================================= */}

                <section className="profile-identity">

                    <div className="profile-photo-wrapper">

                        {profile.avatarUrl ? (
                            <img
                                className="profile-photo"
                                src={profile.avatarUrl}
                                alt={`${profile.name}'s profile`}
                            />
                        ) : (
                            <div className="profile-photo profile-photo-fallback">
                                {initials}
                            </div>
                        )}

                    </div>


                    <div className="profile-main-info">

                        <div className="profile-status-row">

                            <span
                                className={
                                    complete
                                        ? "profile-status complete"
                                        : "profile-status"
                                }
                            >
                                {complete
                                    ? "PROFILE COMPLETE"
                                    : "PROFILE IN PROGRESS"}
                            </span>

                            <span className="profile-role">
                                {profile.role ||
                                    "Learner"}
                            </span>

                        </div>

                        <h1>
                            {profile.name}
                        </h1>

                        <p>
                            {profile.email}
                        </p>

                    </div>


                    <div className="profile-actions">

                        <button
                            className="secondary-action"
                            onClick={onMessagesClick}
                        >
                            Messages
                        </button>

                        <button
                            className="secondary-action"
                            onClick={onBookings}
                        >
                            My Sessions
                        </button>

                        <button
                            className="primary-action"
                            onClick={onCompleteProfile}
                        >
                            {complete
                                ? "Edit Profile"
                                : "Complete Profile"}
                        </button>

                    </div>

                </section>


                {/* =========================================
                    PROFILE STATISTICS
                ========================================= */}

                <section className="profile-stats">

                    <div className="stat-item">

                        <strong>
                            {stats.average
                                ? stats.average.toFixed(1)
                                : "—"}
                        </strong>

                        <span>
                            Average Rating
                        </span>

                    </div>

                    <div className="stat-item">

                        <strong>
                            {stats.totalReceived || 0}
                        </strong>

                        <span>
                            Reviews Received
                        </span>

                    </div>

                    <div className="stat-item">

                        <strong>
                            {stats.totalGiven || 0}
                        </strong>

                        <span>
                            Reviews Given
                        </span>

                    </div>

                    <div className="stat-item">

                        <strong>
                            {teachingSkills.length +
                                learningSkills.length}
                        </strong>

                        <span>
                            Skills Listed
                        </span>

                    </div>

                </section>


                {/* =========================================
                    PROFILE CONTENT
                ========================================= */}

                <section className="profile-content">

                    <div className="profile-content-main">

                        {/* ABOUT */}

                        <section className="profile-section">

                            <div className="section-label">
                                ABOUT
                            </div>

                            <div className="section-body">

                                <h2>
                                    A little about me
                                </h2>

                                <p className="profile-bio">
                                    {profile.bio ||
                                        "Add a short bio so people know what you are looking to learn and share."}
                                </p>

                                {!complete && (
                                    <button
                                        className="inline-link"
                                        onClick={
                                            onCompleteProfile
                                        }
                                    >
                                        Complete your profile
                                        <span>→</span>
                                    </button>
                                )}

                            </div>

                        </section>


                        {/* SKILLS */}

                        <section className="profile-section">

                            <div className="section-label">
                                SKILLS
                            </div>

                            <div className="section-body">

                                <h2>
                                    Learning & sharing
                                </h2>

                                <div className="skills-columns">

                                    <div className="skill-column">

                                        <p>
                                            I CAN HELP WITH
                                        </p>

                                        {teachingSkills.length ? (
                                            <div className="skill-list">
                                                {teachingSkills.map(
                                                    (skill) => (
                                                        <span
                                                            key={skill}
                                                            className="skill-pill teaching"
                                                        >
                                                            {skill}
                                                        </span>
                                                    )
                                                )}
                                            </div>
                                        ) : (
                                            <span className="empty-text">
                                                No teaching skills added
                                            </span>
                                        )}

                                    </div>


                                    <div className="skill-column">

                                        <p>
                                            I WANT TO LEARN
                                        </p>

                                        {learningSkills.length ? (
                                            <div className="skill-list">
                                                {learningSkills.map(
                                                    (skill) => (
                                                        <span
                                                            key={skill}
                                                            className="skill-pill learning"
                                                        >
                                                            {skill}
                                                        </span>
                                                    )
                                                )}
                                            </div>
                                        ) : (
                                            <span className="empty-text">
                                                No learning skills added
                                            </span>
                                        )}

                                    </div>

                                </div>

                            </div>

                        </section>


                        {/* REVIEWS */}

                        <section className="profile-section">

                            <div className="section-label">
                                COMMUNITY FEEDBACK
                            </div>

                            <div className="section-body">

                                <div className="reviews-heading">

                                    <div>
                                        <h2>
                                            Ratings & Reviews
                                        </h2>

                                        <p>
                                            Your reputation inside
                                            the SkillSphere community.
                                        </p>
                                    </div>

                                    <div className="overall-rating">

                                        <strong>
                                            {stats.average
                                                ? stats.average.toFixed(1)
                                                : "—"}
                                        </strong>

                                        <span>
                                            ★★★★★
                                        </span>

                                    </div>

                                </div>


                                <div className="rating-breakdown">

                                    {[5, 4, 3, 2, 1].map(
                                        (rating) => (
                                            <div
                                                className="rating-row"
                                                key={rating}
                                            >

                                                <span>
                                                    {rating}
                                                </span>

                                                <div className="rating-track">

                                                    <div
                                                        style={{
                                                            width:
                                                                `${ratingPercentage(
                                                                    rating
                                                                )}%`
                                                        }}
                                                    />

                                                </div>

                                                <span>
                                                    {
                                                        distribution[
                                                            rating
                                                        ]
                                                    }
                                                </span>

                                            </div>
                                        )
                                    )}

                                </div>


                                <div className="reviews-list">

                                    {reviewsLoading ? (
                                        <div className="reviews-empty">
                                            Loading reviews...
                                        </div>
                                    ) : reviewsData.reviews.length ? (
                                        reviewsData.reviews.map(
                                            (review) => (
                                                <article
                                                    className="review-item"
                                                    key={review._id}
                                                >

                                                    <div className="review-user">

                                                        <div className="review-avatar">
                                                            {review
                                                                .reviewer
                                                                ?.name
                                                                ?.charAt(
                                                                    0
                                                                )
                                                                ?.toUpperCase() ||
                                                                "?"}
                                                        </div>

                                                        <div>

                                                            <strong>
                                                                {review
                                                                    .reviewer
                                                                    ?.name ||
                                                                    "Member"}
                                                            </strong>

                                                            <span>
                                                                {review.createdAt
                                                                    ? new Date(
                                                                          review.createdAt
                                                                      ).toLocaleDateString()
                                                                    : ""}
                                                            </span>

                                                        </div>

                                                    </div>


                                                    <div className="review-content">

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

                                                        <p>
                                                            {review.comment ||
                                                                "No written comment was added."}
                                                        </p>

                                                    </div>

                                                </article>
                                            )
                                        )
                                    ) : (
                                        <div className="reviews-empty">

                                            <span>
                                                ☆
                                            </span>

                                            <strong>
                                                No reviews yet
                                            </strong>

                                            <p>
                                                Complete a skill
                                                exchange to start
                                                building your
                                                reputation.
                                            </p>

                                        </div>
                                    )}

                                </div>

                            </div>

                        </section>

                    </div>


                    {/* =========================================
                        RIGHT INFORMATION PANEL
                    ========================================= */}

                    <aside className="profile-side-content">

                        <section className="side-section">

                            <p className="side-label">
                                PROFILE DETAILS
                            </p>

                            <div className="detail-row">

                                <span>
                                    Availability
                                </span>

                                <strong>
                                    {profile.availability
                                        ?.filter(Boolean)
                                        .join(", ") ||
                                        "Not added yet"}
                                </strong>

                            </div>

                            <div className="detail-row">

                                <span>
                                    Hourly rate
                                </span>

                                <strong>
                                    {profile.hourlyRate
                                        ? `₹${profile.hourlyRate}/hr`
                                        : "Open to discuss"}
                                </strong>

                            </div>

                            <div className="detail-row">

                                <span>
                                    Member since
                                </span>

                                <strong>
                                    {profile.createdAt
                                        ? new Date(
                                              profile.createdAt
                                          ).toLocaleDateString(
                                              undefined,
                                              {
                                                  month: "short",
                                                  year: "numeric"
                                              }
                                          )
                                        : "Recently"}
                                </strong>

                            </div>

                        </section>


                        <section className="side-section">

                            <p className="side-label">
                                QUICK ACTIONS
                            </p>

                            <button
                                className="side-action"
                                onClick={onCompleteProfile}
                            >
                                Edit profile
                                <span>→</span>
                            </button>

                            <button
                                className="side-action"
                                onClick={onBookings}
                            >
                                View sessions
                                <span>→</span>
                            </button>

                            <button
                                className="side-action"
                                onClick={onMessagesClick}
                            >
                                Open messages
                                <span>→</span>
                            </button>

                        </section>


                        <section className="side-section">

                            <p className="side-label">
                                ACCOUNT
                            </p>

                            <button
                                className="side-action"
                                onClick={onLogout}
                            >
                                Log out
                                <span>→</span>
                            </button>

                            <button
                                className="side-action danger"
                                onClick={deleteAccount}
                                disabled={deleting}
                            >
                                {deleting
                                    ? "Deleting..."
                                    : "Delete account"}

                                <span>→</span>
                            </button>

                        </section>

                    </aside>

                </section>

            </section>

        </main>
    );
}

export default ProfilePage;