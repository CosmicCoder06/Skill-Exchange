// TODO: Legal review pending for production compliance
import React from "react";

export default function ContactPage({ onClose }) {
    return (
        <div style={{ maxWidth: "800px", margin: "40px auto", padding: "24px", background: "var(--card-bg, #ffffff)", borderRadius: "12px", border: "1px solid var(--border, #e2e8f0)", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
            {onClose && (
                <button onClick={onClose} style={{ float: "right", border: "none", background: "none", fontSize: "18px", cursor: "pointer" }}>✕ Close</button>
            )}
            <p style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", color: "#0f766e", fontWeight: "700" }}>SUPPORT & INQUIRIES</p>
            <h1 style={{ fontSize: "28px", color: "#1e293b", margin: "8px 0 16px" }}>Contact Us</h1>
            <p style={{ color: "#64748b", fontSize: "14px" }}>We're here to help you get the most out of your skill exchanges.</p>

            <div style={{ lineHeight: "1.7", color: "#334155", fontSize: "15px", marginTop: "24px" }}>
                <p>Have questions about a payment verification, session refund, or mentor inquiry?</p>
                <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0", margin: "16px 0" }}>
                    <div><strong>📧 Support Email:</strong> support@skillexchange.local</div>
                    <div style={{ marginTop: "6px" }}><strong>💬 Platform Inquiries:</strong> @teamcosmiccoders</div>
                    <div style={{ marginTop: "6px" }}><strong>⏱ Business Hours:</strong> Monday – Saturday, 9:00 AM – 7:00 PM IST</div>
                </div>
            </div>
        </div>
    );
}
