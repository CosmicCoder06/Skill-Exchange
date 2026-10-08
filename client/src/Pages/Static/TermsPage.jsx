// TODO: Legal review pending for production compliance
import React from "react";

export default function TermsPage({ onClose }) {
    return (
        <div style={{ maxWidth: "800px", margin: "40px auto", padding: "24px", background: "var(--card-bg, #ffffff)", borderRadius: "12px", border: "1px solid var(--border, #e2e8f0)", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
            {onClose && (
                <button onClick={onClose} style={{ float: "right", border: "none", background: "none", fontSize: "18px", cursor: "pointer" }}>✕ Close</button>
            )}
            <p style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", color: "#0f766e", fontWeight: "700" }}>LEGAL & COMPLIANCE</p>
            <h1 style={{ fontSize: "28px", color: "#1e293b", margin: "8px 0 16px" }}>Terms & Conditions</h1>
            <p style={{ color: "#64748b", fontSize: "14px" }}>Last updated: October 2026</p>

            <div style={{ lineHeight: "1.7", color: "#334155", fontSize: "15px", marginTop: "24px" }}>
                <h3>1. Introduction and Acceptance</h3>
                <p>Welcome to SkillExchange. By registering, browsing, or using our services, you agree to be bound by these Terms and Conditions. If you are under 18 years of age, you are not authorized to use the platform.</p>

                <h3>2. Platform Role & Manual Payments</h3>
                <p>SkillExchange acts as an intermediary platform connecting learners and mentors. All session payments are routed through the official platform Paytm Business UPI QR. Users must never send funds directly to mentor accounts. Payments submitted with valid 12-digit UTRs and screenshot proofs are verified by platform administrators.</p>

                <h3>3. Session Bookings and Conduct</h3>
                <p>Mentors and learners agree to conduct all scheduled video sessions respectfully and professionally. Any harassing, offensive, or abusive conduct may result in immediate suspension or permanent termination.</p>

                <h3>4. Platform Fees</h3>
                <p>SkillExchange applies a platform service fee to session transactions as displayed at the time of booking. Net payouts to mentors will reflect the agreed deduction.</p>

                <h3>5. Disclaimer of Warranties</h3>
                <p>The platform is provided on an "as is" and "as available" basis without warranties of any kind.</p>
            </div>
        </div>
    );
}
