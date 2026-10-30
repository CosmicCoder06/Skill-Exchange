import { useEffect, useState } from "react";
import "./AccountManagement.css";

function AccountManagement({ token, onLogout }) {
    const [reason, setReason] = useState("");
    const [userId, setUserId] = useState("");
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/profile/me`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then((response) => response.json())
            .then((data) => setUserId(data.profile?._id || ""))
            .catch(() => setUserId(""));
    }, [token]);

    async function deactivateAccount() {
        if (!reason.trim()) {
            window.alert("Please tell us why you are deactivating your account.");
            return;
        }

        if (!window.confirm("Deactivate your account? You will be signed out.")) return;

        setBusy(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/account/deactivate`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ reason: reason.trim() })
            });
            if (!response.ok) throw new Error("Unable to deactivate account");
            onLogout();
        } catch (error) {
            window.alert(error.message);
        } finally {
            setBusy(false);
        }
    }

    async function deleteAccount() {
        if (!userId || !window.confirm("Delete your account permanently? This cannot be undone.")) return;

        setBusy(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/user/delete/${userId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) throw new Error("Unable to delete account");
            onLogout();
        } catch (error) {
            window.alert(error.message);
        } finally {
            setBusy(false);
        }
    }

    return (
        <main className="account-management-page">
            <section className="account-management-card">
                <p>ACCOUNT MANAGEMENT</p>
                <h1>Manage your account</h1>
                <span>Deactivate temporarily or permanently delete your Skill Exchange account.</span>

                <label htmlFor="deactivation-reason">Reason for deactivation</label>
                <textarea id="deactivation-reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Tell us why you are leaving..." />
                <button type="button" className="account-deactivate" disabled={busy} onClick={deactivateAccount}>Deactivate account</button>

                <div className="account-danger-zone">
                    <strong>Delete account</strong>
                    <span>This permanently removes your profile and account access.</span>
                    <button type="button" disabled={busy || !userId} onClick={deleteAccount}>Delete account permanently</button>
                </div>
            </section>
        </main>
    );
}

export default AccountManagement;
// @teamcosmiccoders
