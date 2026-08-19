export default function AdminSidebar({
    activeSection,
    onSectionChange,
    onLogout,
}) {
    const items = [
        {
            id: "overview",
            label: "Overview",
            icon: "⌂",
        },
        {
            id: "members",
            label: "Members",
            icon: "♙",
        },
        {
            id: "reports",
            label: "Reports",
            icon: "◒",
        },
    ];

    return (
        <aside className="admin-sidebar">
            <button
                type="button"
                className="admin-brand"
                onClick={() =>
                    onSectionChange("overview")
                }
                aria-label="SkillExchange Admin"
            >
                <span className="admin-brand-mark">
                    SE
                </span>

                <span className="admin-brand-copy">
                    <strong>
                        SkillExchange
                    </strong>

                    <small>
                        ADMIN
                    </small>
                </span>
            </button>

            <p className="admin-sidebar-label">
                ADMIN WORKSPACE
            </p>

            <nav className="admin-navigation">
                {items.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        className={
                            activeSection === item.id
                                ? "admin-nav-item is-active"
                                : "admin-nav-item"
                        }
                        onClick={() =>
                            onSectionChange(item.id)
                        }
                    >
                        <span>
                            {item.icon}
                        </span>

                        <strong>
                            {item.label}
                        </strong>
                    </button>
                ))}
            </nav>

            <div className="admin-sidebar-bottom">
                <div className="admin-protected">
                    <span>✦</span>

                    <div>
                        <strong>
                            Protected workspace
                        </strong>

                        <p>
                            Admin access only
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    className="admin-logout"
                    onClick={onLogout}
                >
                    ↪ Log out
                </button>
            </div>
        </aside>
    );
}
// @teamcosmiccoders
