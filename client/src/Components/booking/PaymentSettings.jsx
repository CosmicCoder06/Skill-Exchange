import { useEffect, useState } from "react";

export default function PaymentSettings({ token }) {
    const [data, setData] = useState(null);

    useEffect(() => {
        let active = true;
        const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
        fetch(`${apiBase}/payment-settings`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
                if (active && d) setData(d);
            })
            .catch(() => {});
        return () => {
            active = false;
        };
    }, [token]);

    if (!data || data.role !== "mentor") return null;

    return (
        <section className="manual-payment" style={{ padding: "16px 0" }}>
            <h2 style={{ fontSize: "16px", marginBottom: "6px" }}>Session Payments & Payouts</h2>
            <p style={{ fontSize: "13px", color: "var(--text-muted, #64748b)", margin: 0 }}>
                All session payments are securely processed through integrated Razorpay checkout with platform escrow protection. Mentor payouts are disbursed directly by administrators upon session completion.
            </p>
        </section>
    );
}
