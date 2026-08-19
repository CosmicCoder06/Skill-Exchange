import { useEffect, useState } from "react";
import "./CompleteProfile.css";

const emptyProfile = {
    bio: "",
    skillsToTeach: "",
    skillsToLearn: "",
    availability: "",
    hourlyRate: "",
    avatarUrl: "",
    coverImageUrl: ""
};

function CompleteProfile({ token, onComplete, onLater }) {
    const [formData, setFormData] = useState(emptyProfile);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    // =========================
    // LOAD EXISTING PROFILE
    // =========================

    useEffect(() => {
        async function loadProfile() {
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/profile/me`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                if (!response.ok) {
                    return;
                }

                const { profile } = await response.json();

                setFormData({
                    bio: profile.bio || "",

                    skillsToTeach:
                        profile.skillsToTeach
                            ?.filter(Boolean)
                            .join(", ") || "",

                    skillsToLearn:
                        profile.skillsToLearn
                            ?.filter(Boolean)
                            .join(", ") || "",

                    availability:
                        profile.availability
                            ?.filter(Boolean)
                            .join(", ") || "",

                    hourlyRate:
                        profile.hourlyRate || "",

                    avatarUrl:
                        profile.avatarUrl || "",

                    coverImageUrl:
                        profile.coverImageUrl || ""
                });
            } catch (loadError) {
                console.error(
                    "Could not load profile",
                    loadError
                );
            }
        }

        loadProfile();
    }, [token]);

    // =========================
    // HANDLE INPUT CHANGES
    // =========================

    function handleChange(event) {
        const { name, value } = event.target;

        setFormData((current) => ({
            ...current,
            [name]: value
        }));
    }

    // =========================
    // CONVERT COMMA SEPARATED
    // VALUES INTO ARRAYS
    // =========================

    function asList(value) {
        return value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
    }

    // =========================
    // SAVE PROFILE
    // =========================

    async function saveProfile(event) {
        event.preventDefault();

        const skillsToTeach =
            asList(formData.skillsToTeach);

        const skillsToLearn =
            asList(formData.skillsToLearn);

        // Required fields
        if (
            !formData.bio.trim() ||
            !skillsToTeach.length ||
            !skillsToLearn.length
        ) {
            setError(
                "Add your bio, teaching skills, and learning skills to finish your profile."
            );

            return;
        }

        setSaving(true);
        setError("");

        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/profile/update`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        bio: formData.bio,

                        skillsToTeach,

                        skillsToLearn,

                        availability:
                            asList(
                                formData.availability
                            ),

                        hourlyRate:
                            Number(
                                formData.hourlyRate
                            ) || 0,

                        avatarUrl:
                            formData.avatarUrl,

                        coverImageUrl:
                            formData.coverImageUrl
                    })
                }
            );

            if (!response.ok) {
                throw new Error(
                    "Could not save profile"
                );
            }

            onComplete();
        } catch (saveError) {
            console.error(
                "Profile save error:",
                saveError
            );

            setError(
                "We could not save your profile. Please try again."
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <main className="completion-page">
            <section className="completion-panel">

                {/* =========================
                    INTRO
                ========================= */}

                <div className="completion-intro">

                    <span className="completion-kicker">
                        GET STARTED
                    </span>

                    <h1>
                        Make your profile stand out.
                    </h1>

                    <p>
                        Share a few details to get better
                        matches and meaningful learning
                        connections.
                    </p>

                    <div className="completion-progress">
                        <span />
                        <span />
                        <span />
                    </div>

                </div>


                {/* =========================
                    PROFILE FORM
                ========================= */}

                <form
                    className="completion-form"
                    onSubmit={saveProfile}
                >

                    <div className="form-heading">

                        <h2>
                            Complete your profile
                        </h2>

                        <p>
                            Fields marked <b>*</b> are required.
                        </p>

                    </div>


                    {/* PROFILE IMAGE */}

                    <label>
                        Profile image URL

                        <input
                            name="avatarUrl"
                            type="url"
                            value={formData.avatarUrl}
                            placeholder="https://..."
                            onChange={handleChange}
                        />

                        <small>
                            Add a profile picture URL.
                        </small>
                    </label>


                    {/* BIO */}

                    <label>
                        About you <b>*</b>

                        <textarea
                            name="bio"
                            value={formData.bio}
                            placeholder="Tell the community a little about yourself"
                            onChange={handleChange}
                        />
                    </label>


                    {/* SKILLS */}

                    <div className="form-grid">

                        <label>
                            Skills you can teach <b>*</b>

                            <input
                                name="skillsToTeach"
                                value={
                                    formData.skillsToTeach
                                }
                                placeholder="React, Java"
                                onChange={handleChange}
                            />
                        </label>


                        <label>
                            Skills you want to learn <b>*</b>

                            <input
                                name="skillsToLearn"
                                value={
                                    formData.skillsToLearn
                                }
                                placeholder="Design, Python"
                                onChange={handleChange}
                            />
                        </label>

                    </div>


                    {/* AVAILABILITY + RATE */}

                    <div className="form-grid">

                        <label>
                            Availability

                            <input
                                name="availability"
                                value={
                                    formData.availability
                                }
                                placeholder="Weekends"
                                onChange={handleChange}
                            />
                        </label>


                        <label>
                            Hourly rate

                            <input
                                name="hourlyRate"
                                type="number"
                                min="0"
                                value={
                                    formData.hourlyRate
                                }
                                placeholder="Optional"
                                onChange={handleChange}
                            />
                        </label>

                    </div>


                    {/* ERROR */}

                    {error && (
                        <p className="form-error">
                            {error}
                        </p>
                    )}


                    {/* ACTIONS */}

                    <div className="completion-actions">

                        <button
                            type="button"
                            className="skip-button"
                            onClick={onLater}
                            disabled={saving}
                        >
                            Skip for now
                        </button>


                        <button
                            type="submit"
                            className="save-button"
                            disabled={saving}
                        >
                            {saving
                                ? "Saving..."
                                : "Save profile"}
                        </button>

                    </div>

                </form>

            </section>
        </main>
    );
}

export default CompleteProfile;
// @teamcosmiccoders
