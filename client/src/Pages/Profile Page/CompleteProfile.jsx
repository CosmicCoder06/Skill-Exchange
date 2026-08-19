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
       function validateProfile() {
    const bio = formData.bio.trim();

    const skillsToTeach = [
        ...new Set(
            asList(formData.skillsToTeach).map((skill) =>
                skill.toLowerCase()
            )
        )
    ];

    const skillsToLearn = [
        ...new Set(
            asList(formData.skillsToLearn).map((skill) =>
                skill.toLowerCase()
            )
        )
    ];

    if (bio.length < 10) {
        return "Bio must contain at least 10 characters.";
    }

    if (skillsToTeach.length === 0) {
        return "Add at least one skill you can teach.";
    }

    if (skillsToLearn.length === 0) {
        return "Add at least one skill you want to learn.";
    }

    if (
        formData.hourlyRate !== "" &&
        (
            !Number.isFinite(Number(formData.hourlyRate)) ||
            Number(formData.hourlyRate) < 0
        )
    ) {
        return "Hourly rate must be a valid non-negative number.";
    }

    const validateUrl = (value, fieldName) => {
        if (!value.trim()) {
            return null;
        }

        try {
            const url = new URL(value.trim());

            if (url.protocol !== "http:" && url.protocol !== "https:") {
                return `${fieldName} must use http or https.`;
            }

            return null;
        } catch {
            return `${fieldName} must be a valid URL.`;
        }
    };

    const avatarError = validateUrl(
        formData.avatarUrl,
        "Profile image URL"
    );

    if (avatarError) {
        return avatarError;
    }

    const coverError = validateUrl(
        formData.coverImageUrl,
        "Cover image URL"
    );

    if (coverError) {
        return coverError;
    }

    return "";
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
        const validationError = validateProfile();

        if (validationError) {
            setError(validationError);
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
