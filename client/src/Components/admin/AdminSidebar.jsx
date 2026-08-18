const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: "⌂" },
  { id: "users", label: "Members", icon: "◎" },
  { id: "reports", label: "Reports", icon: "↗" },
];

export default function AdminSidebar({ activeSection, onSectionChange, onHome, onLogout }) {
  return (
    <aside className="admin-sidebar">
      <button type="button" className="admin-brand" onClick={onHome}>
        <span>↗</span>
        <strong>Skill Exchange</strong>
      </button>

      <div className="admin-sidebar-label">ADMIN WORKSPACE</div>
      <nav aria-label="Admin portal">
        {NAV_ITEMS.map((item) => (
          <button
            type="button"
            key={item.id}
            className={activeSection === item.id ? "admin-nav-item is-active" : "admin-nav-item"}
            onClick={() => onSectionChange(item.id)}
          >
            <span aria-hidden="true">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="admin-sidebar-footer">
        <div className="admin-security-note">
          <span aria-hidden="true">✦</span>
          <p><strong>Protected area</strong><br />Admin access only</p>
        </div>
        <button type="button" className="admin-logout" onClick={onLogout}>Log out</button>
      </div>
    </aside>
  );
}

