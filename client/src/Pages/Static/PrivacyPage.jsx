// TODO: Legal review pending for production compliance
import React from "react";

export default function PrivacyPage({ onClose }) {
    return (
        <div style={{ maxWidth: "800px", margin: "40px auto", padding: "24px", background: "var(--card-bg, #ffffff)", borderRadius: "12px", border: "1px solid var(--border, #e2e8f0)", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
            {onClose && (
                <button onClick={onClose} style={{ float: "right", border: "none", background: "none", fontSize: "18px", cursor: "pointer" }}>✕ Close</button>
            )}
            <p style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", color: "#0f766e", fontWeight: "700" }}>PRIVACY & DATA</p>
            <h1 style={{ fontSize: "28px", color: "#1e293b", margin: "8px 0 16px" }}>Privacy Policy</h1>
            <p style={{ color: "#64748b", fontSize: "14px" }}>Last updated: October 2026</p>

            <div style={{ lineHeight: "1.7", color: "#334155", fontSize: "15px", marginTop: "24px" }}>
                <h3>1. Information We Collect</h3>
                <p>We collect personal information that you provide to us, including your name, email address, password, role (learner/mentor), profile bio, skills, and session booking details.</p>

                <h3>2. Payment Records & Proofs</h3>
                <p>When you submit payment verification proofs (such as 12-digit transaction UTRs and screenshot images), these details are stored securely to enable administrator verification against Paytm Business records and ensure fraud prevention.</p>

                <h3>3. Use of Information</h3>
                <p>Your information is used solely to facilitate skill-sharing sessions, process payments and mentor payouts, provide customer support, and maintain platform security.</p>

                <h3>4. Data Security</h3>
                <p>We implement industry-standard encryption and access controls to safeguard your data. We do not sell or lease your personal information to third parties.</p>
            </div>
        </div>
    );
}
