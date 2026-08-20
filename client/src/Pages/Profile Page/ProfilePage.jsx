import { useEffect, useState } from "react";
import "./ProfilePage.css";

function ProfilePage({
    token,
    profileStatus,
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
    const [showPhoto, setShowPhoto] = useState(false);

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
                MAIN WORKSPACE
            ========================================= */}

            <section className="profile-workspace">

                {/* TOP HEADER */}

                <header className="profile-header">

                    <div className="profile-brand">

                        <strong>
                            MY SPACE
                        </strong>

                        <span>
                            {String(profile.role || "learner").toLowerCase() === "mentor"
                                ? "Your mentor profile"
                                : "Your learning profile"}
                        </span>

                    </div>

                    <div className="profile-header-actions">

                        <button
                            className="profile-header-link"
                            onClick={onMessagesClick}
                        >
                            Messages <span>→</span>
                        </button>

                        <button
                            className="profile-header-link"
                            onClick={onBookings}
                        >
                            My Sessions <span>→</span>
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

                    <div
                        className="profile-photo-wrapper"
                        role={profile.avatarUrl ? "button" : undefined}
                        tabIndex={profile.avatarUrl ? 0 : undefined}
                        aria-label={
                            profile.avatarUrl
                                ? "View profile photo"
                                : undefined
                        }
                        onClick={() => {
                            if (profile.avatarUrl) {
                                setShowPhoto(true);
                            }
                        }}
                        onKeyDown={(event) => {
                            if (
                                profile.avatarUrl &&
                                (event.key === "Enter" || event.key === " ")
                            ) {
                                event.preventDefault();
                                setShowPhoto(true);
                            }
                        }}
                    >

                        <div className="profile-photo-fallback-letter">
                            {initials}
                        </div>

                        {profile.avatarUrl ? (
                            <img
                                className="profile-photo"
                                src={profile.avatarUrl}
                                alt={`${profile.name}'s profile`}
                                onError={(event) => {
                                    event.currentTarget.style.display = "none";
                                    event.currentTarget.parentElement.classList.add(
                                        "profile-photo-failed"
                                    );
                                }}
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
                            className="primary-action profile-edit-only"
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
                                (profile.role === "mentor" ? 0 : learningSkills.length)}
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

                                <h2>{profile.role === "mentor" ? "Teaching expertise" : "Learning & sharing"}</h2>

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


                                    {profile.role !== "mentor" && <div className="skill-column">

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

                                    </div>}

                                </div>

                            </div>

                        </section>


                        {/* COMMUNITY FEEDBACK */}

                        <section className="profile-reviews-section">

                            <div className="reviews-heading">

                                <div>
                                    <p className="profile-eyebrow">
                                        COMMUNITY FEEDBACK
                                    </p>

                                    <h2>
                                        Ratings & Reviews
                                    </h2>
                                </div>

                                <div className="overall-rating">

                                    <strong>
                                        {totalReviews
                                            ? stats.average.toFixed(1)
                                            : "—"}
                                    </strong>

                                    <span>
                                        ★★★★★
                                    </span>

                                    <small>
                                        {totalReviews
                                            ? `${totalReviews} ${
                                                  totalReviews === 1
                                                      ? "review"
                                                      : "reviews"
                                              }`
                                            : "No reviews yet"}
                                    </small>

                                </div>

                            </div>


                            {reviewsLoading ? (
                                <div className="reviews-empty">
                                    Loading ratings...
                                </div>
                            ) : (
                                <>

                                    {totalReviews > 0 && (
                                        <div className="rating-breakdown">

                                            {[5, 4, 3, 2, 1].map(
                                                (star) => {
                                                    const count =
                                                        distribution[star] || 0;

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
                                                                        width: `${ratingPercentage(
                                                                            star
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


                                    {reviewsData.reviews.length > 0 ? (
                                        <div className="reviews-list">

                                            {reviewsData.reviews.map(
                                                (review) => (
                                                    <article
                                                        className="review-card"
                                                        key={review._id}
                                                    >

                                                        <div className="review-card-top">

                                                            <div className="reviewer-avatar">
                                                                {review
                                                                    .reviewer
                                                                    ?.name
                                                                    ?.charAt(0)
                                                                    ?.toUpperCase() ||
                                                                    "U"}
                                                            </div>

                                                            <div>
                                                                <strong>
                                                                    {review
                                                                        .reviewer
                                                                        ?.name ||
                                                                        "Member"}
                                                                </strong>

                                                                <span className="reviewer-role">
                                                                    {review
                                                                        .reviewer
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
                                                )
                                            )}

                                        </div>
                                    ) : (
                                        <div className="reviews-empty">
                                            <div>⭐</div>

                                            <h3>
                                                No reviews yet
                                            </h3>

                                            <p>
                                                Complete a skill exchange
                                                to start building your
                                                reputation.
                                            </p>
                                        </div>
                                    )}

                                </>
                            )}

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

                {showPhoto && profile.avatarUrl && (
                    <div
                        className="profile-photo-lightbox"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Profile photo viewer"
                        onClick={() => setShowPhoto(false)}
                    >
                        <button
                            type="button"
                            className="profile-photo-lightbox-close"
                            aria-label="Close profile photo"
                            onClick={(event) => {
                                event.stopPropagation();
                                setShowPhoto(false);
                            }}
                        >
                            ×
                        </button>

                        <img
                            className="profile-photo-lightbox-image"
                            src={profile.avatarUrl}
                            alt={`${profile.name}'s profile`}
                            onClick={(event) =>
                                event.stopPropagation()
                            }
                        />
                    </div>
                )}

            </section>

        </main>
    );
}

export default ProfilePage;
// @teamcosmiccoders
