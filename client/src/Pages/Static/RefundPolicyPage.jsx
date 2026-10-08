// TODO: Legal review pending for production compliance
import React from "react";

export default function RefundPolicyPage({ onClose }) {
    return (
        <div style={{ maxWidth: "800px", margin: "40px auto", padding: "24px", background: "var(--card-bg, #ffffff)", borderRadius: "12px", border: "1px solid var(--border, #e2e8f0)", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
            {onClose && (
                <button onClick={onClose} style={{ float: "right", border: "none", background: "none", fontSize: "18px", cursor: "pointer" }}>✕ Close</button>
            )}
            <p style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", color: "#0f766e", fontWeight: "700" }}>PAYMENTS & CANCELLATIONS</p>
            <h1 style={{ fontSize: "28px", color: "#1e293b", margin: "8px 0 16px" }}>Refund & Cancellation Policy</h1>
            <p style={{ color: "#64748b", fontSize: "14px" }}>Last updated: October 2026</p>

            <div style={{ lineHeight: "1.7", color: "#334155", fontSize: "15px", marginTop: "24px" }}>
                <h3>1. Learner Cancellations</h3>
                <ul>
                    <li><strong>Advance Notice (&gt; 24 hours before session):</strong> Eligible for a 100% full refund of the session fee.</li>
                    <li><strong>Short Notice (&lt; 24 hours before session):</strong> Eligible for a 50% refund to compensate mentor scheduling.</li>
                    <li><strong>After Session Start / No-Show:</strong> Non-refundable.</li>
                </ul>

                <h3>2. Mentor No-Show / Cancellation</h3>
                <p>If a mentor fails to attend a confirmed session or cancels after receiving payment approval, the learner receives a <strong>100% full refund</strong> immediately upon administrative review.</p>

                <h3>3. Refund Processing</h3>
                <p>All manual payment refunds are reviewed and executed directly by our administration team to the learner's original UPI ID within 3–5 business days.</p>
            </div>
        </div>
    );
}
