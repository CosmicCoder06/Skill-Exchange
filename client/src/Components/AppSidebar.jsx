import "../Pages/Profile Page/ProfilePage.css";
import { LogoMark } from "./common/Logo";

function AppSidebar({
    activePage,
    onHome,
    onMessages,
    onBookings,
    onProfile,
    onDashboard,
    dashboardLabel,
    onAccount,
    onLogout,
    showProfileControls = false
}) {
    return (
        <aside className="profile-sidebar">
            <button className="sidebar-logo-btn" onClick={onHome} aria-label="Skill Exchange home" style={{ background: "transparent", border: 0, padding: 0, cursor: "pointer", display: "grid", placeItems: "center" }}>
                <LogoMark size={46} />
            </button>

            <div className="sidebar-navigation">
                <button className={`sidebar-item ${activePage === "home" ? "active" : ""}`} onClick={onHome}>
                    <span className="sidebar-icon">⌂</span>
                    <span className="sidebar-text">Home</span>
                </button>

                <button className={`sidebar-item ${activePage === "chat" ? "active" : ""}`} onClick={onMessages}>
                    <span className="sidebar-icon">◇</span>
                    <span className="sidebar-text">Messages</span>
                </button>

                <button className={`sidebar-item ${activePage === "bookings" ? "active" : ""}`} onClick={onBookings}>
                    <span className="sidebar-icon">▣</span>
                    <span className="sidebar-text">My Sessions</span>
                </button>

                <button className={`sidebar-item ${activePage === "profile" ? "active" : ""}`} onClick={onProfile}>
                    <span className="sidebar-icon">●</span>
                    <span className="sidebar-text">Profile</span>
                </button>

                {showProfileControls && <button className={`sidebar-item ${activePage.endsWith("dashboard") ? "active" : ""}`} onClick={onDashboard}>
                    <span className="sidebar-icon">◫</span>
                    <span className="sidebar-text">{dashboardLabel}</span>
                </button>}

                {showProfileControls && <button className={`sidebar-item ${activePage === "account" ? "active" : ""}`} onClick={onAccount}>
                    <span className="sidebar-icon">⚙</span>
                    <span className="sidebar-text">Account</span>
                </button>}
            </div>

            {showProfileControls && <button className="sidebar-item sidebar-logout" onClick={onLogout}>
                <span className="sidebar-icon">↪</span>
                <span className="sidebar-text">Logout</span>
            </button>}
        </aside>
    );
}

export default AppSidebar;
// @teamcosmiccoders
