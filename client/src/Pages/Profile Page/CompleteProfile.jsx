import { useEffect, useState } from "react";
import "./CompleteProfile.css";

const emptyProfile = {
    name: "",
    bio: "",
    skillsToTeach: "",
    teachingSkillLevels: {},
    skillsToLearn: "",
    availability: "",
    hourlyRate: "",
    avatarUrl: "",
    coverImageUrl: ""
};

function CompleteProfile({ token, role, onComplete, onLater }) {
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
                    name: profile.name || "",
                    bio: profile.bio || "",

                    skillsToTeach:
                        profile.skillsToTeach
                            ?.filter(Boolean)
                            .join(", ") || "",

                    teachingSkillLevels: profile.teachingSkillLevels || {},

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

    function setSkillLevel(skill, level) {
        setFormData((current) => ({
            ...current,
            teachingSkillLevels: { ...current.teachingSkillLevels, [skill]: level }
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

    if (role === "admin") {
        if (bio.length > 0 && bio.length < 5) {
            return "Bio should contain at least 5 characters.";
        }
    } else {
        if (bio.length < 10) {
            return "Bio must contain at least 10 characters.";
        }

        if (skillsToTeach.length === 0) {
            return "Add at least one skill you can teach.";
        }

        if (role !== "mentor" && skillsToLearn.length === 0) {
            return "Add at least one skill you want to learn.";
        }
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
        if (!value || !value.trim()) {
            return null;
        }

        if (value.startsWith("data:image/")) {
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
                        name: formData.name?.trim(),
                        bio: formData.bio,

                        skillsToTeach,
                        teachingSkillLevels: Object.fromEntries(skillsToTeach.map((skill) => [skill, formData.teachingSkillLevels[skill] || formData.teachingSkillLevels[skill.toLowerCase()] || "Beginner"])),

                        ...(role === "mentor" || role === "admin" ? {} : { skillsToLearn }),

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
                            {role === "admin" ? "Edit Admin Profile" : "Complete your profile"}
                        </h2>

                        <p>
                            {role === "admin"
                                ? "Update your administrator details, photo, and bio."
                                : "Fields marked * are required."}
                        </p>

                    </div>


                    {/* FULL NAME */}

                    <label>
                        Full Name {role !== "admin" && <b>*</b>}

                        <input
                            name="name"
                            type="text"
                            value={formData.name || ""}
                            placeholder="Your full name"
                            onChange={handleChange}
                        />
                    </label>


                    {/* PROFILE IMAGE */}

                    <label>
                        Profile Image

                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                            <input
                                name="avatarUrl"
                                type="text"
                                value={formData.avatarUrl}
                                placeholder="https://... or upload from device"
                                onChange={handleChange}
                                style={{ flex: 1 }}
                            />

                            <label
                                style={{
                                    cursor: "pointer",
                                    padding: "9px 14px",
                                    background: "#eaf3ef",
                                    border: "1px solid #176b4e",
                                    borderRadius: "8px",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    color: "#176b4e",
                                    whiteSpace: "nowrap"
                                }}
                            >
                                📷 Choose File
                                <input
                                    type="file"
                                    accept="image/*"
                                    style={{ display: "none" }}
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            if (file.size > 2 * 1024 * 1024) {
                                                setError("Image must be smaller than 2MB.");
                                                return;
                                            }
                                            const reader = new FileReader();
                                            reader.onload = () => {
                                                setFormData((prev) => ({ ...prev, avatarUrl: reader.result }));
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                />
                            </label>
                        </div>

                        {formData.avatarUrl && (
                            <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "10px" }}>
                                <img
                                    src={formData.avatarUrl}
                                    alt="Avatar preview"
                                    style={{ width: "42px", height: "42px", borderRadius: "50%", objectFit: "cover", border: "2px solid #176b4e" }}
                                />
                                <button
                                    type="button"
                                    style={{ background: "none", border: "none", color: "#b91c1c", fontSize: "12px", cursor: "pointer", padding: 0 }}
                                    onClick={() => setFormData((prev) => ({ ...prev, avatarUrl: "" }))}
                                >
                                    Remove photo
                                </button>
                            </div>
                        )}
                        <small>
                            Add an image URL or choose a file from your device.
                        </small>
                    </label>


                    {/* BIO */}

                    <label>
                        About you {role !== "admin" && <b>*</b>}

                        <textarea
                            name="bio"
                            value={formData.bio}
                            placeholder={role === "admin" ? "Describe your admin responsibilities or background..." : "Tell the community a little about yourself"}
                            onChange={handleChange}
                        />
                    </label>


                    {/* SKILLS */}

                    {role !== "admin" && (
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


                            {role !== "mentor" && <label>
                                Skills you want to learn <b>*</b>

                                <input
                                    name="skillsToLearn"
                                    value={
                                        formData.skillsToLearn
                                    }
                                    placeholder="Design, Python"
                                    onChange={handleChange}
                                />
                            </label>}

                        </div>
                    )}

                    {role === "mentor" && asList(formData.skillsToTeach).length > 0 && (
                        <section className="skill-level-picker">
                            <p>TEACHING CONFIDENCE</p>
                            <h3>Choose your level for each teaching skill</h3>

                            {asList(formData.skillsToTeach).map((skill) => (
                                <label key={skill} className="skill-level-row">
                                    <span>{skill}</span>
                                    <select
                                        value={formData.teachingSkillLevels[skill] || formData.teachingSkillLevels[skill.toLowerCase()] || "Beginner"}
                                        onChange={(event) => setSkillLevel(skill, event.target.value)}
                                    >
                                        <option>Beginner</option>
                                        <option>Intermediate</option>
                                        <option>Advanced</option>
                                        <option>Expert</option>
                                    </select>
                                </label>
                            ))}
                        </section>
                    )}


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
