import { useState } from "react";
import axios from "axios";
import styles from "./registrationComponent.module.css";
import { LogoMark } from "../common/Logo";

function Register({ onBackToLogin, onRegistered }) {
    const [user, setUser] = useState({
        name: "",
        email: "",
        password: "",
        role: "learner"
    });
    const [showPassword, setShowPassword] = useState(false);
    const [agreedTerms, setAgreedTerms] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    function handleChange(e) {
        setUser({
            ...user,
            [e.target.name]: e.target.value
        });
        if (error) setError("");
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!user.name || !user.email || !user.password || !user.role) {
            setError("Please fill in all fields to continue.");
            return;
        }

        if (!agreedTerms) {
            setError("Please confirm you are 18+ and agree to the Terms & Privacy Policy.");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/registration/api`,
                user,
                {
                    withCredentials: true
                }
            );

            console.log("Registration response:", response.data);
            alert("Account created successfully! Please sign in with your credentials.");

            setUser({
                name: "",
                email: "",
                password: "",
                role: "learner"
            });

            if (onRegistered) {
                onRegistered();
            } else if (onBackToLogin) {
                onBackToLogin();
            }
        } catch (err) {
            console.error("Registration Error:", err);
            setError(
                err.response?.data?.message ||
                "Registration failed. Please check your details and try again."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className={styles.pageContainer}>
            {/* LEFT SHOWCASE */}
            <aside className={styles.showcase}>
                <div className={styles.brand}>
                    <LogoMark size={36} />
                    <span className={styles.brandName}>
                        Skill<span>Exchange</span>
                    </span>
                </div>

                <div className={styles.showcaseContent}>
                    <p className={styles.showcaseEyebrow}>LEARN • TEACH • CONNECT</p>
                    <h1 className={styles.showcaseTitle}>
                        Join the community where <em>real skills</em> are exchanged.
                    </h1>
                    <p className={styles.showcaseLead}>
                        Whether you want to learn directly from experienced practitioners or monetize your own domain expertise, Skill Exchange connects you with verified peers.
                    </p>

                    <div className={styles.featureGrid}>
                        <div className={styles.featureItem}>
                            <span className={styles.featureIcon}>🛡️</span>
                            <div>
                                <strong>Escrow Protected</strong>
                                <p>Learner session fees remain in secure escrow until the session is completed.</p>
                            </div>
                        </div>

                        <div className={styles.featureItem}>
                            <span className={styles.featureIcon}>⚡</span>
                            <div>
                                <strong>AI Skill Matching</strong>
                                <p>Get paired with mentors based on skill compatibility, schedule, and verified reviews.</p>
                            </div>
                        </div>

                        <div className={styles.featureItem}>
                            <span className={styles.featureIcon}>💡</span>
                            <div>
                                <strong>Monetize or Learn</strong>
                                <p>Set your hourly rate, offer free sessions, or schedule 1-on-1 mentorship whenever you want.</p>
                            </div>
                        </div>
                    </div>

                    <div className={styles.skillsMarquee}>
                        <span className={styles.skillTag}>Full-Stack Development</span>
                        <span className={styles.skillTag}>System Design</span>
                        <span className={styles.skillTag}>UI / UX Design</span>
                        <span className={styles.skillTag}>Data Science</span>
                        <span className={styles.skillTag}>Python</span>
                        <span className={styles.skillTag}>Cloud & DevOps</span>
                    </div>
                </div>

                <div className={styles.showcaseFooter}>
                    <span>✦ 100% Peer Verified Network</span>
                    <span>© 2026 Skill Exchange</span>
                </div>
            </aside>

            {/* RIGHT FORM PANEL */}
            <section className={styles.formPanel}>
                <div className={styles.formContainer}>
                    {onBackToLogin && (
                        <button
                            type="button"
                            className={styles.backButton}
                            onClick={onBackToLogin}
                        >
                            ← Back to sign in
                        </button>
                    )}

                    <div className={styles.formHeader}>
                        <p className={styles.formEyebrow}>JOIN SKILL EXCHANGE</p>
                        <h2 className={styles.formTitle}>Create your account</h2>
                        <p className={styles.formSubtitle}>
                            Start learning, teaching, and connecting with peers around the world.
                        </p>
                    </div>

                    {error && (
                        <div className={styles.errorAlert} role="alert">
                            ⚠️ {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <label htmlFor="reg-name">Full name</label>
                            <input
                                id="reg-name"
                                type="text"
                                name="name"
                                placeholder="e.g. Alex Johnson"
                                value={user.name}
                                onChange={handleChange}
                                disabled={loading}
                                required
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label htmlFor="reg-email">Email address</label>
                            <input
                                id="reg-email"
                                type="email"
                                name="email"
                                placeholder="you@example.com"
                                value={user.email}
                                onChange={handleChange}
                                disabled={loading}
                                required
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label htmlFor="reg-password">Password</label>
                            <div className={styles.passwordWrapper}>
                                <input
                                    id="reg-password"
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="At least 6 characters"
                                    value={user.password}
                                    onChange={handleChange}
                                    disabled={loading}
                                    required
                                />
                                <button
                                    type="button"
                                    className={styles.passwordToggle}
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? "Hide" : "Show"}
                                </button>
                            </div>
                        </div>

                        <div className={styles.inputGroup}>
                            <label>I want to primarily</label>
                            <div className={styles.roleGrid}>
                                <button
                                    type="button"
                                    className={
                                        user.role === "learner"
                                            ? styles.roleCardActive
                                            : styles.roleCard
                                    }
                                    onClick={() => setUser({ ...user, role: "learner" })}
                                    disabled={loading}
                                >
                                    <div className={styles.roleHeader}>
                                        <span className={styles.roleBadge}>🎓</span>
                                        <strong>Learn Skills</strong>
                                    </div>
                                    <span className={styles.roleDesc}>
                                        Find mentors, request 1-on-1 sessions, and accelerate your career.
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    className={
                                        user.role === "mentor"
                                            ? styles.roleCardActive
                                            : styles.roleCard
                                    }
                                    onClick={() => setUser({ ...user, role: "mentor" })}
                                    disabled={loading}
                                >
                                    <div className={styles.roleHeader}>
                                        <span className={styles.roleBadge}>💡</span>
                                        <strong>Teach & Mentor</strong>
                                    </div>
                                    <span className={styles.roleDesc}>
                                        Share expertise, set hourly rates, and receive verified payouts.
                                    </span>
                                </button>
                            </div>
                        </div>

                        <div className={styles.termsRow}>
                            <input
                                type="checkbox"
                                id="termsCheckbox"
                                required
                                checked={agreedTerms}
                                onChange={(e) => setAgreedTerms(e.target.checked)}
                                disabled={loading}
                            />
                            <label htmlFor="termsCheckbox" className={styles.termsLabel}>
                                I am 18+ and agree to the <strong>Terms of Service</strong> &amp; <strong>Privacy Policy</strong>.
                            </label>
                        </div>

                        <button
                            type="submit"
                            className={styles.submitButton}
                            disabled={loading || !agreedTerms}
                        >
                            {loading ? "Creating account..." : "Create Account →"}
                        </button>
                    </form>

                    <div className={styles.formFooter}>
                        <span>Already have an account?</span>{" "}
                        <button
                            type="button"
                            className={styles.loginLink}
                            onClick={onBackToLogin}
                        >
                            Sign in here
                        </button>
                    </div>
                </div>
            </section>
        </main>
    );
}

export default Register;
// @teamcosmiccoders
