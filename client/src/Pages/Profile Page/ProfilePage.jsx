import "./ProfilePage.css";
import "./ProfileActions.css";
import "./ProfilePremium.css";
import { useEffect, useState } from "react";

const hasCompletedDetails = (profile) => {
    const hasText = (value) => typeof value === "string" && value.trim().length > 0;
    const hasSkill = (skills) => Array.isArray(skills) && skills.some(hasText);
    return hasText(profile?.bio) && hasSkill(profile?.skillsToTeach) && hasSkill(profile?.skillsToLearn);
};

function ProfilePage({ token, profileStatus, onHome, onLogout, onMessagesClick, onCompleteProfile }) {
    const [profile, setProfile] = useState(null);
    const [profileComplete, setProfileComplete] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        async function fetchProfile() {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/profile/me`, { headers: { Authorization: `Bearer ${token}` } });
                if (!response.ok) throw new Error("Unable to fetch profile");
                const data = await response.json();
                setProfile(data.profile);
                setProfileComplete(data.profileComplete === true);
            } catch (error) { console.error("Profile fetch error:", error); }
        }
        fetchProfile();
    }, [token]);

    if (!profile) return <div className="profile-loading">Loading your profile…</div>;
    const complete = profileStatus === true || profileComplete || hasCompletedDetails(profile);
    const teach = profile.skillsToTeach?.filter(Boolean) || [];
    const learn = profile.skillsToLearn?.filter(Boolean) || [];
    const initials = profile.name?.charAt(0).toUpperCase();

    async function deleteAccount() {
        if (!window.confirm("Delete your account permanently? This cannot be undone.")) return;
        setDeleting(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/user/delete/${profile._id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
            if (!response.ok) throw new Error("Unable to delete account");
            onLogout();
        } catch (error) { console.error("Account deletion failed", error); window.alert("We could not delete your account. Please try again."); } finally { setDeleting(false); }
    }

    return <main className="profile-page">
        <div className="profile-glow profile-glow-one" /><div className="profile-glow profile-glow-two" />
        <section className="profile-shell"><button className="profile-back" onClick={onHome}>← Back to home</button>
            <header className="profile-hero">
                <div className="profile-avatar-wrap">{profile.avatarUrl ? <img className="profile-avatar-image" src={profile.avatarUrl} alt={`${profile.name}'s profile`} /> : <div className="profile-avatar">{initials}</div>}</div>
                <div className="profile-heading"><span className={complete ? "profile-status complete" : "profile-status"}>{complete ? "Profile complete" : "Profile in progress"}</span><h1>{profile.name}</h1><p>{profile.email}</p></div>
                <div className="profile-hero-actions"><button className="profile-secondary-button" onClick={onMessagesClick}>Messages</button><button className="profile-primary-button" onClick={onCompleteProfile}>{complete ? "Edit profile" : "Complete profile"}</button></div>
            </header>
            <div className="profile-content">
                <section className="profile-about"><p className="profile-eyebrow">ABOUT</p><h2>A little about me</h2><p className="profile-bio">{profile.bio || "Add a short bio so people know what you are looking to learn and share."}</p>{!complete && <button className="profile-complete-cta" onClick={onCompleteProfile}>Complete your profile <span>→</span></button>}</section>
                <aside className="profile-details"><div className="detail-row"><span>Availability</span><strong>{profile.availability?.filter(Boolean).join(", ") || "Not added yet"}</strong></div><div className="detail-row"><span>Hourly rate</span><strong>{profile.hourlyRate ? `₹${profile.hourlyRate}/hr` : "Open to discuss"}</strong></div></aside>
                <section className="profile-skills-section"><div className="skill-block"><p className="profile-eyebrow">I CAN HELP WITH</p><div className="skill-list">{teach.length ? teach.map((skill) => <span key={skill} className="skill-pill teach">{skill}</span>) : <span className="empty-skills">No teaching skills added</span>}</div></div><div className="skill-block"><p className="profile-eyebrow">I WANT TO LEARN</p><div className="skill-list">{learn.length ? learn.map((skill) => <span key={skill} className="skill-pill learn">{skill}</span>) : <span className="empty-skills">No learning skills added</span>}</div></div></section>
                <section className="profile-account-actions"><button className="profile-logout" onClick={onLogout}>Log out</button><button className="profile-delete" disabled={deleting} onClick={deleteAccount}>{deleting ? "Deleting account…" : "Delete account"}</button></section>
            </div>
        </section>
    </main>;
}
export default ProfilePage;
