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
                <div>© 2026 @teamcosmiccoders — All payments securely verified via Paytm Business UPI</div>
            </footer>

            {/* STATIC PAGE MODALS */}
            {openModal && (
                <div
                    onClick={() => setOpenModal(null)}
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        background: "rgba(15, 23, 42, 0.65)",
                        backdropFilter: "blur(4px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 10000,
                        padding: "20px"
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            maxWidth: "850px",
                            maxHeight: "85vh",
                            overflowY: "auto",
                            width: "100%"
                        }}
                    >
                        {openModal === "terms" && <TermsPage onClose={() => setOpenModal(null)} />}
                        {openModal === "privacy" && <PrivacyPage onClose={() => setOpenModal(null)} />}
                        {openModal === "refund" && <RefundPolicyPage onClose={() => setOpenModal(null)} />}
                        {openModal === "contact" && <ContactPage onClose={() => setOpenModal(null)} />}
                    </div>
                </div>
            )}
        </>
    );
}

export default AppFooter;
