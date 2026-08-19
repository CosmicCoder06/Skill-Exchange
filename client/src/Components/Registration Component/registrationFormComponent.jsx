import { useState } from "react";
import axios from "axios";
import styles from "./registrationComponent.module.css";

function Register({ onBackToLogin, onRegistered }) {
    const [user, setUser] = useState({
        name: "",
        email: "",
        password: "",
        role: "learner"
    });

    const [loading, setLoading] = useState(false);

    function handleChange(e) {
        setUser({
            ...user,
            [e.target.name]: e.target.value
        });
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (
            !user.name ||
            !user.email ||
            !user.password ||
            !user.role
        ) {
            alert("Please fill all fields");
            return;
        }

        try {
            setLoading(true);

            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/registration/api`,
                user,
                {
                    withCredentials: true
                }
            );

            console.log("Registration response:", response.data);

            alert("Account created successfully! Please login.");

            setUser({
                name: "",
                email: "",
                password: "",
                role: "learner"
            });

            onRegistered();

        } catch (error) {
            console.error("Registration Error:", error);

            alert(
                error.response?.data?.message ||
                "Registration failed"
            );

        } finally {
            setLoading(false);
        }
    }

    return (
        <section className={styles.page}>

            <div className={styles.card}>

                <div className={styles.logo}>
                    S
                </div>

                <p className={styles.eyebrow}>
                    JOIN SKILL EXCHANGE
                </p>

                <h1>
                    Create your account.
                </h1>

                <p className={styles.subtitle}>
                    Start learning, teaching and connecting
                    with people who share your skills.
                </p>

                <form onSubmit={handleSubmit}>

                    <label>
                        Full name
                    </label>

                    <input
                        type="text"
                        name="name"
                        placeholder="Enter your name"
                        value={user.name}
                        onChange={handleChange}
                    />

                    <label>
                        Email address
                    </label>

                    <input
                        type="email"
                        name="email"
                        placeholder="you@example.com"
                        value={user.email}
                        onChange={handleChange}
                    />

                    <label>
                        Password
                    </label>

                    <input
                        type="password"
                        name="password"
                        placeholder="Create a password"
                        value={user.password}
                        onChange={handleChange}
                    />

                    <label>
                        I want to
                    </label>

                    <div className={styles.roleGrid}>

                        <button
                            type="button"
                            className={
                                user.role === "learner"
                                    ? styles.roleActive
                                    : styles.role
                            }
                            onClick={() =>
                                setUser({
                                    ...user,
                                    role: "learner"
                                })
                            }
                        >
                            <strong>🎓 Learn</strong>
                            <span>
                                Find mentors and learn new skills
                            </span>
                        </button>

                        <button
                            type="button"
                            className={
                                user.role === "mentor"
                                    ? styles.roleActive
                                    : styles.role
                            }
                            onClick={() =>
                                setUser({
                                    ...user,
                                    role: "mentor"
                                })
                            }
                        >
                            <strong>💡 Teach</strong>
                            <span>
                                Share your knowledge with others
                            </span>
                        </button>

                    </div>

                    <button
                        className={styles.registerButton}
                        type="submit"
                        disabled={loading}
                    >
                        {loading
                            ? "Creating account..."
                            : "Create account  →"}
                    </button>

                </form>

                <p className={styles.loginText}>
                    Already have an account?{" "}
                    <button
                        type="button"
                        onClick={onBackToLogin}
                    >
                        Sign in
                    </button>
                </p>

            </div>

        </section>
    );
}

export default Register;
