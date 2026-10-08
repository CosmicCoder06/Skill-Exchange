import ThemeToggle from "../ThemeToggle";
import {
    LayoutDashboard,
    Users,
    CreditCard,
    CalendarCheck2,
    User,
    Shield
} from "lucide-react";

export default function AdminSidebar({
    activeSection,
    onSectionChange,
    onLogout
}) {
    const navItems = [
        { id: "overview", label: "Dashboard", icon: LayoutDashboard },
        { id: "members", label: "Members", icon: Users },
        { id: "payments", label: "Payments", icon: CreditCard },
        { id: "sessions", label: "Sessions", icon: CalendarCheck2 },
        { id: "profile", label: "My Profile", icon: User }
    ];

    return (
        <aside className="admin-sidebar">
            <button
                type="button"
                className="admin-brand"
                onClick={() => onSectionChange("overview")}
            >
                <div className="admin-brand-mark">↗</div>
                <div className="admin-brand-copy">
                    <strong>SkillExchange</strong>
                    <small>ADMIN CONSOLE</small>
                </div>
            </button>

            <div className="admin-sidebar-label">NAVIGATION</div>

            <nav className="admin-navigation" aria-label="Admin Navigation">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                        activeSection === item.id ||
                        (item.id === "members" && activeSection === "view-user") ||
                        (item.id === "profile" && activeSection === "edit-profile");

                    return (
                        <button
                            key={item.id}
                            type="button"
                            className={`admin-nav-item ${isActive ? "is-active" : ""}`}
                            onClick={() => onSectionChange(item.id)}
                            aria-current={isActive ? "page" : undefined}
                        >
                            <span><Icon size={18} strokeWidth={2.2} /></span>
                            {item.label}
                        </button>
                    );
                })}
            </nav>

            <div className="admin-sidebar-bottom">
                <div className="admin-protected">
                    <span><Shield size={16} /></span>
                    <div>
                        <strong>SECURE SESSION</strong>
                        <p>Authorized Admin Access</p>
                    </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", padding: "0 8px" }}>
                    <span style={{ fontSize: "12px", color: "#8eb9a8", fontWeight: 600 }}>Theme</span>
                    <ThemeToggle />
                </div>

                <button
                    type="button"
                    className="admin-logout"
                    onClick={onLogout}
                >
                    Log Out
                </button>
            </div>
        </aside>
    );
}
