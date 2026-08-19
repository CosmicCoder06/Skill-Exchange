import { useEffect, useState } from "react";
import axios from "axios";
import "./EmailVerificationPage.css";

function EmailVerificationPage({ token, email = "", onBackToLogin }) {
    const [status, setStatus] = useState(token ? "verifying" : "pending");
    const [message, setMessage] = useState(
        token ? "Confirming your email address..." : "We sent a 6-digit verification code to your email address."
    );
    const [resendEmail, setResendEmail] = useState(email);
    const [otp, setOtp] = useState("");
    const [resending, setResending] = useState(false);
    const [verifyingOtp, setVerifyingOtp] = useState(false);

    useEffect(() => {
        if (!token) return undefined;

        let active = true;
        axios.post(`${import.meta.env.VITE_API_URL}/auth/verify-email`, { token })
            .then((response) => {
                if (!active) return;
                setStatus("verified");
                setMessage(response.data.message);
            })
            .catch((error) => {
                if (!active) return;
                setStatus("error");
                setMessage(error.response?.data?.message || "Unable to verify your email address.");
            });

        return () => { active = false; };
    }, [token]);

    async function handleResend(event) {
        event.preventDefault();
        if (!resendEmail.trim()) {
            setStatus("error");
            setMessage("Enter the email address used during registration.");
            return;
        }

        try {
            setResending(true);
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/auth/resend-verification`,
                { email: resendEmail.trim() },
            );
            setStatus("pending");
            setMessage(response.data.message);
        } catch (error) {
            setStatus("error");
            setMessage(error.response?.data?.message || "Unable to resend the verification code.");
        } finally {
            setResending(false);
        }
    }

    async function handleVerifyOtp(event) {
        event.preventDefault();
        if (!resendEmail.trim() || !/^[0-9]{6}$/.test(otp)) {
            setStatus("error");
            setMessage("Enter your email and the 6-digit verification code.");
            return;
        }

        try {
            setVerifyingOtp(true);
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/auth/verify-email-otp`,
                { email: resendEmail.trim(), otp },
            );
            setStatus("verified");
            setMessage(response.data.message);
        } catch (error) {
            setStatus("error");
            setMessage(error.response?.data?.message || "Unable to verify this code.");
        } finally {
            setVerifyingOtp(false);
        }
    }

    const icon = status === "verified" ? "✓" : status === "error" ? "!" : "✉";

    return (
        <main className="email-verification-page">
            <section className="email-verification-card">
                <button type="button" className="email-brand" onClick={onBackToLogin}>
                    <span>S</span> Skill Exchange
                </button>

                <div className={`email-status-icon ${status}`}>{icon}</div>
                <p className="email-eyebrow">SECURE YOUR ACCOUNT</p>
                <h1>
                    {status === "verified"
                        ? "Email verified."
                        : status === "verifying"
                            ? "Verifying your email..."
                            : "Enter your verification code."}
                </h1>
                <p className="email-status-message" role={status === "error" ? "alert" : "status"}>
                    {message}
                </p>

                {status === "verified" ? (
                    <button type="button" className="email-primary-button" onClick={onBackToLogin}>
                        Continue to sign in →
                    </button>
                ) : status !== "verifying" ? (
                    <div className="email-otp-actions">
                        <form className="email-otp-form" onSubmit={handleVerifyOtp}>
                            <label htmlFor="verification-email">Email address</label>
                            <input
                                id="verification-email"
                                type="email"
                                value={resendEmail}
                                onChange={(event) => setResendEmail(event.target.value)}
                                placeholder="you@example.com"
                                autoComplete="email"
                                disabled={resending || verifyingOtp}
                            />
                            <label htmlFor="verification-otp">6-digit verification code</label>
                            <input
                                id="verification-otp"
                                className="email-otp-input"
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]{6}"
                                maxLength={6}
                                value={otp}
                                onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
                                placeholder="000000"
                                autoComplete="one-time-code"
                                disabled={resending || verifyingOtp}
                            />
                            <button type="submit" disabled={resending || verifyingOtp}>
                                {verifyingOtp ? "Verifying..." : "Verify code →"}
                            </button>
                        </form>
                        <form className="email-resend-form" onSubmit={handleResend}>
                            <button type="submit" disabled={resending || verifyingOtp}>
                                {resending ? "Sending..." : "Resend code"}
                            </button>
                        </form>
                    </div>
                ) : <span className="email-verification-spinner" aria-label="Verifying" />}

                <button type="button" className="email-login-link" onClick={onBackToLogin}>
                    ← Back to sign in
                </button>
            </section>
        </main>
    );
}

export default EmailVerificationPage;
