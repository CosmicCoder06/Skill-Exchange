import { useState } from "react";
import axios from "axios";
import "./loginComponent.css";

function LoginComponent({ onLogin, onCreateAccount }) {
    const [user, setUser] = useState({
        email: "",
        password: ""
    });

    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");

    function handleChange(e) {
        setUser({
            ...user,
            [e.target.name]: e.target.value
        });

        if (error) {
            setError("");
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!user.email || !user.password) {
            setError("Please enter your email and password.");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/loginRoute/api`,
                user,
                {
                    withCredentials: true
                }
            );

            console.log("Login response:", response.data);

            const token = response.data.accessToken;

            if (!token) {
                setError("Login failed: token was not received.");
                return;
            }

            localStorage.setItem("Token", token);

            onLogin(token);

        } catch (error) {
            console.error("Login Error:", error);

            if (error.response) {
                setError(
                    error.response.data?.message ||
                    "Login failed."
                );
            } else {
                setError("Cannot connect to server.");
            }

        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="login-page">

            {/* LEFT SHOWCASE */}
            <section className="login-showcase">

                <div className="brand">
                    <div className="brand-mark">
                        S
                    </div>

                    <span>
                        Skill<span>Exchange</span>
                    </span>
                </div>


                <div className="showcase-content">

                    <p className="eyebrow">
                        LEARN • TEACH • CONNECT
                    </p>

                    <h1>
                        Exchange skills.
                        <br />
                        <span>Grow together.</span>
                    </h1>

                    <p className="showcase-description">
                        Connect with people who know what you want
                        to learn and share what you know with others.
                    </p>


                    <div className="feature-list">

                        <div className="feature-item">

                            <div className="feature-icon">
                                ✦
                            </div>

                            <div>
                                <strong>
                                    Find your mentor
                                </strong>

                                <span>
                                    Learn directly from skilled people.
                                </span>
                            </div>

                        </div>


                        <div className="feature-item">

                            <div className="feature-icon">
                                ↗
                            </div>

                            <div>
                                <strong>
                                    Share your skills
                                </strong>

                                <span>
                                    Teach what you're passionate about.
                                </span>
                            </div>

                        </div>


                        <div className="feature-item">

                            <div className="feature-icon">
                                ⌁
                            </div>

                            <div>
                                <strong>
                                    Build connections
                                </strong>

                                <span>
                                    Turn conversations into opportunities.
                                </span>
                            </div>

                        </div>

                    </div>

                </div>


                <div className="showcase-footer">

                    <span>
                        Skill Exchange Platform
                    </span>

                    <span>
                        © 2026
                    </span>

                </div>

            </section>


            {/* RIGHT LOGIN PANEL */}
            <section className="login-panel">

                <div className="login-card">

                    {/* Mobile branding */}
                    <div className="mobile-brand">

                        <div className="brand-mark">
                            S
                        </div>

                        <span>
                            Skill<span>Exchange</span>
                        </span>

                    </div>


                    <div className="login-heading">

                        <p className="login-eyebrow">
                            WELCOME BACK
                        </p>

                        <h2>
                            Good to see you again.
                        </h2>

                        <p>
                            Sign in to continue your skill exchange journey.
                        </p>

                    </div>


                    <form
                        className="login-form"
                        onSubmit={handleSubmit}
                    >

                        {/* EMAIL */}

                        <div className="input-group">

                            <label htmlFor="email">
                                Email address
                            </label>

                            <div className="input-wrapper">

                                <span className="input-icon">
                                    @
                                </span>

                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    placeholder="you@example.com"
                                    value={user.email}
                                    onChange={handleChange}
                                    autoComplete="email"
                                    disabled={loading}
                                />

                            </div>

                        </div>


                        {/* PASSWORD */}

                        <div className="input-group">

                            <label htmlFor="password">
                                Password
                            </label>

                            <div className="input-wrapper">

                                <span className="input-icon">
                                    ●
                                </span>

                                <input
                                    id="password"
                                    type={
                                        showPassword
                                            ? "text"
                                            : "password"
                                    }
                                    name="password"
                                    placeholder="Enter your password"
                                    value={user.password}
                                    onChange={handleChange}
                                    autoComplete="current-password"
                                    disabled={loading}
                                />

                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                >
                                    {showPassword
                                        ? "Hide"
                                        : "Show"}
                                </button>

                            </div>

                        </div>


                        {/* ERROR */}

                        {error && (
                            <div className="login-error">

                                <span>
                                    !
                                </span>

                                <p>
                                    {error}
                                </p>

                            </div>
                        )}


                        {/* LOGIN BUTTON */}

                        <button
                            type="submit"
                            className="login-button"
                            disabled={loading}
                        >

                            {loading ? (
                                <>
                                    <span className="spinner"></span>
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    Sign in
                                    <span className="arrow">
                                        →
                                    </span>
                                </>
                            )}

                        </button>

                    </form>


                    {/* DIVIDER */}

                    <div className="login-divider">
                        <span>
                            secure access
                        </span>
                    </div>


                    {/* REGISTER */}

                    <p className="register-text">

                        Don't have an account?

                        <button
                            type="button"
                            className="register-link"
                            onClick={onCreateAccount}
                        >
                            Create an account
                        </button>

                    </p>

                </div>

            </section>

        </main>
    );
}

export default LoginComponent;
// @teamcosmiccoders
