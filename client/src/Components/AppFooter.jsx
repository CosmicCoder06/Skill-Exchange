import { useState } from "react";
import "./AppFooter.css";
import TermsPage from "../Pages/Static/TermsPage";
import PrivacyPage from "../Pages/Static/PrivacyPage";
import RefundPolicyPage from "../Pages/Static/RefundPolicyPage";
import ContactPage from "../Pages/Static/ContactPage";

function AppFooter() {
    const [openModal, setOpenModal] = useState(null); // 'terms' | 'privacy' | 'refund' | 'contact'

    return (
        <>
            <footer className="app-footer">
                <div style={{ display: "flex", justifyContent: "center", gap: "18px", flexWrap: "wrap", marginBottom: "8px" }}>
                    <button
                        type="button"
                        onClick={() => setOpenModal("terms")}
                        style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: "12px", textDecoration: "underline" }}
                    >
                        Terms &amp; Conditions
                    </button>
                    <button
                        type="button"
                        onClick={() => setOpenModal("privacy")}
                        style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: "12px", textDecoration: "underline" }}
                    >
                        Privacy Policy
                    </button>
                    <button
                        type="button"
                        onClick={() => setOpenModal("refund")}
                        style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: "12px", textDecoration: "underline" }}
                    >
                        Refund &amp; Cancellation Policy
                    </button>
                    <button
                        type="button"
                        onClick={() => setOpenModal("contact")}
                        style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: "12px", textDecoration: "underline" }}
                    >
                        Contact Us
                    </button>
                </div>
                <div>© 2026 @teamcosmiccoders — All payments securely processed via Razorpay</div>
            </footer>

            {/* STATIC PAGE MODALS */}
            {openModal && (
                <div
                    onClick={() => setOpenModal(null)}
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "rgba(0,0,0,0.6)",
                        zIndex: 9999,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "20px"
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: "var(--card-bg, #ffffff)",
                            color: "var(--text-color, #0f172a)",
                            maxWidth: "760px",
                            width: "100%",
                            maxHeight: "85vh",
                            overflowY: "auto",
                            borderRadius: "12px",
                            padding: "32px",
                            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)"
                        }}
                    >
                        <div style={{ textAlign: "right", marginBottom: "12px" }}>
                            <button
                                type="button"
                                onClick={() => setOpenModal(null)}
                                style={{
                                    background: "#e2e8f0",
                                    border: "none",
                                    borderRadius: "50%",
                                    width: "28px",
                                    height: "28px",
                                    cursor: "pointer",
                                    fontWeight: "bold"
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        {openModal === "terms" && <TermsPage />}
                        {openModal === "privacy" && <PrivacyPage />}
                        {openModal === "refund" && <RefundPolicyPage />}
                        {openModal === "contact" && <ContactPage />}
                    </div>
                </div>
            )}
        </>
    );
}

export default AppFooter;
